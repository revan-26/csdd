import { lstat, open, readFile, realpath, rename, rm } from "node:fs/promises"
import { createHash, randomUUID } from "node:crypto"
import { join, resolve } from "node:path"
import { calculateArtifactRevision, canonicalizeText, genesisApprovedBody, genesisRecordParts, genesisRecords } from "./revision.mjs"
import { ARTIFACTS, artifactLocation } from "./artifacts.mjs"
import { markGenesisRecovery, settleGenesisRecovery } from "./recovery.mjs"
import { administrativeFields, ArtifactGuardError } from "./administrative.mjs"

export async function writeArtifact(workspace, artifact, content) {
  if (!Object.hasOwn(ARTIFACTS, artifact)) throw new Error(`Artefacto no permitido: ${artifact}`)
  if (typeof content !== "string" || !content.trim()) throw new Error("El contenido no puede estar vacío")
  if (content.includes("\0")) throw new Error("El contenido no puede incluir bytes nulos")

  const workspacePath = resolve(workspace)
  const { artifactPath, directory, path } = await artifactLocation(workspacePath, artifact, true)
  let previous
  try {
    const stat = await lstat(artifactPath)
    if (stat.isSymbolicLink()) throw new Error(`El artefacto ${artifact} no puede ser un enlace simbólico`)
    if (!stat.isFile()) throw new Error(`El artefacto ${artifact} no es un archivo regular`)
    if (artifact === "genesis") previous = await readFile(artifactPath, "utf8")
  } catch (error) {
    if (error?.code !== "ENOENT") throw error
  }

  let resolvedContent = content
  for (const referencedArtifact of Object.keys(ARTIFACTS)) {
    const placeholder = `{{csdd_revision:${referencedArtifact}}}`
    if (resolvedContent.includes(placeholder)) {
      const revision = await calculateArtifactRevision(workspacePath, referencedArtifact)
      resolvedContent = resolvedContent.replaceAll(placeholder, revision.reference)
    }
  }

  if (artifact === "genesis") {
    const body = genesisApprovedBody(resolvedContent)
    const bodyReference = `sha256:${createHash("sha256").update(body, "utf8").digest("hex")}`
    const records = genesisRecords(resolvedContent)
    const active = genesisRecordParts(records.at(-1))
    const decision = administrativeFields(active.decision, true)
    const materialization = administrativeFields(active.materialization, true)
    if (previous) {
      const oldRecords = genesisRecords(previous)
      if (records.length < oldRecords.length || records.length > oldRecords.length + 1) throw new Error("No se pueden retirar registros ni añadir varias revisiones a la vez")
      for (let index = 0; index < oldRecords.length; index++) {
        const old = genesisRecordParts(oldRecords[index])
        const current = genesisRecordParts(records[index])
        if (index < records.length - 1) {
          if (canonicalizeText(oldRecords[index]) !== canonicalizeText(records[index])) throw new Error("El registro histórico anterior debe preservarse completo")
          const oldDecision = administrativeFields(old.decision, true)
          const oldMaterialization = administrativeFields(old.materialization, true)
          const closed = oldDecision.status === "approved" && oldMaterialization.stage === "closed"
          const abandoned = oldDecision.status === "rejected" && oldMaterialization.disposition === "abandoned"
          if (!closed && !abandoned) throw new Error("La revisión anterior debe estar aprobada y cerrada o rechazada y abandonada antes de añadir otra")
        } else if (administrativeFields(old.decision, true).status === "approved" && (old.body !== current.body || old.decision !== current.decision)) {
          throw new Error("No se puede reescribir el cuerpo ni la decisión de una revisión aprobada")
        } else if (administrativeFields(old.decision, true).status === "rejected" && administrativeFields(old.materialization, true).disposition === "abandoned" && canonicalizeText(oldRecords[index]) !== canonicalizeText(records[index])) {
          throw new Error("No se puede reescribir una propuesta rechazada y abandonada")
        }
      }
    }
    if (decision.status === "approved" && decision.approved_content_reference !== bodyReference) {
      throw new ArtifactGuardError("approval_reference_mismatch", `La aprobación de Genesis no contiene la referencia real ${bodyReference}`)
    }
    if (materialization.stage === "closed") {
      if (decision.status !== "approved") throw new ArtifactGuardError("closure_without_approval", "No se puede cerrar una revisión sin aprobación del bloque activo")
      if (materialization.genesis_reference !== bodyReference) throw new ArtifactGuardError("genesis_reference_mismatch", "El cierre debe referenciar el cuerpo activo en genesis_reference")
      for (const projection of ["glossary"]) {
        const revision = await calculateArtifactRevision(workspacePath, projection)
        if (materialization[`${projection}_reference`] !== revision.reference) {
          throw new ArtifactGuardError("projection_reference_mismatch", `El cierre de Genesis no contiene la referencia real de ${projection}: ${revision.reference}`)
        }
      }
    }
  }

  const normalized = canonicalizeText(resolvedContent)
  if (artifact === "genesis") await markGenesisRecovery(workspacePath)
  const temporaryPath = join(directory, `.csdd-write-${randomUUID()}.tmp`)
  let handle
  try {
    handle = await open(temporaryPath, "wx", 0o600)
    const temporaryRealPath = await realpath(temporaryPath)
    if (temporaryRealPath !== temporaryPath) {
      throw new Error("El archivo temporal resuelve fuera del destino documental")
    }
    await handle.writeFile(normalized, "utf8")
    await handle.sync()
    await handle.close()
    handle = undefined
    await rename(temporaryPath, artifactPath)
  } finally {
    await handle?.close()
    await rm(temporaryPath, { force: true })
  }
  if (artifact === "genesis" || artifact === "roadmap") {
    try { await settleGenesisRecovery(workspacePath) } catch (error) { if (error.code !== "ENOENT") throw error }
  }
  return {
    artifact,
    path,
    bytes: Buffer.byteLength(normalized, "utf8"),
  }
}
