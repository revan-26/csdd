import { createHash } from "node:crypto"
import { lstat, open, readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import { artifactLocation } from "../../common/lib/artifacts.mjs"
import { calculateArtifactRevision, resolveArtifact, genesisApprovedBody } from "../../common/lib/revision.mjs"
import { parseReviewReport, verdictSchema, findingSchema, semanticCheckSchema } from "../../common/lib/review-report.mjs"
import { activeDecision } from "./approval-evidence.mjs"

const artifacts = ["genesis", "glossary"]
const hash = value => "sha256:" + createHash("sha256").update(JSON.stringify(value)).digest("hex")
const semanticKeys = ["verdict", "summary", "findings", "semantic_checks", "limitations", "recommended_action"]
export const reviewSchema = { type: "object", additionalProperties: false, properties: {
  operation: { type: "string", enum: ["begin", "complete", "latest"] },
  judgment: { type: "object", additionalProperties: false, properties: {
    verdict: verdictSchema,
    summary: { type: "string" }, findings: { type: "array", items: findingSchema },
    semantic_checks: { type: "array", items: semanticCheckSchema }, limitations: { type: "array", items: { type: "string" } },
    recommended_action: { type: "string" },
  }, required: semanticKeys },
}, required: ["operation"] }

export function roadmapProduct(value) {
  const data = structuredClone(value)
  for (const key of ["last_reviewed", "genesis_closure", "genesis_revision", "genesis_review_reference", "genesis_pending_revision"]) delete data.metadata[key]
  delete data.sections.evidence
  return data
}

export async function reviewRecords(directory) {
  const { directory: base } = await artifactLocation(directory, "genesis")
  const records = []
  for (const name of await readdir(base)) {
    if (!/^\.review-[a-f0-9]{64}\.json$/u.test(name)) continue
    const path = join(base, name); const stat = await lstat(path)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error("Reporte local no puede ser un enlace")
    const envelope = JSON.parse(await readFile(path, "utf8"))
    if (envelope.digest !== hash(envelope.record) || !parseReviewReport(JSON.stringify(envelope.record.report))) throw new Error("Reporte local corrupto")
    const record = envelope.record
    if (record.report.review_reference !== `opencode-session:${record.session_id}` || !record.message_id
      || name !== `.review-${hash([record.session_id, record.message_id]).slice(7)}.json`) throw new Error("Identidad de reporte local inválida")
    records.push({ ...record, path: `docs/base/${name}` })
  }
  return records.sort((a, b) => a.completed_at - b.completed_at)
}

export async function reviewSnapshot(directory, draft = false) {
  const snapshots = {}, references = {}
  for (const artifact of draft ? ["genesis"] : artifacts) {
    const location = await resolveArtifact(directory, artifact)
    const content = await readFile(location.artifactPath, "utf8")
    snapshots[artifact] = artifact === "genesis" ? genesisApprovedBody(content) : content
    references[artifact] = (await calculateArtifactRevision(directory, artifact)).reference
  }
  return { snapshots, references }
}

export async function currentReview(directory, kind) {
  const current = await reviewSnapshot(directory)
  const record = (await reviewRecords(directory)).findLast(record => record.report.review_kind === kind
    && record.report.verdict === "conforming" && artifacts.every(key => record.report.artifact_references[key] === current.references[key]))
  if (!record) throw new Error(`No existe revisión ${kind} conforme de las versiones actuales`)
  return record
}

export function reviewController() {
  const pending = new Map()
  return async (directory, context, input) => {
    context.signal.throwIfAborted()
    if (Object.keys(input).some(key => !["operation", "judgment"].includes(key))) throw new Error("La revisión solo recibe operación y juicio semántico")
    const key = JSON.stringify([directory, context.sessionID])
    if (input.operation === "latest") {
      if (input.judgment) throw new Error("latest no admite juicio ni metadatos")
      const current = await reviewSnapshot(directory)
      const record = (await reviewRecords(directory)).findLast(record => Object.entries(current.references).every(([artifact, ref]) => record.report.artifact_references[artifact] === ref))
      return record ? { ...record.report, report_path: record.path, review_message_id: record.message_id } : { status: "unavailable" }
    }
    if (input.operation === "begin") {
      if (input.judgment) throw new Error("begin no recibe juicio ni metadatos")
      const decision = await activeDecision(directory)
      const snapshot = await reviewSnapshot(directory)
      const kind = "semantic"
      const paths = {}
      const { directory: base } = await artifactLocation(directory, "genesis")
      // Contenido acotado al bloque activo, accesible dentro del workspace.
      // Los archivos son direccionados por contenido y nunca se sobrescriben.
      for (const artifact of artifacts) {
        const name = `.review-input-${artifact}-${hash(snapshot.snapshots[artifact]).slice(7)}.md`
        try {
          const handle = await open(join(base, name), "wx", 0o600)
          try { await handle.writeFile(snapshot.snapshots[artifact]); await handle.sync() }
          finally { await handle.close() }
        } catch (error) {
          if (error.code !== "EEXIST") throw error
          const stat = await lstat(join(base, name))
          if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || await readFile(join(base, name), "utf8") !== snapshot.snapshots[artifact]) throw new Error("Snapshot local inválido")
        }
        paths[artifact] = `docs/base/${name}`
      }
      const prepared = { ...snapshot, paths, kind, begun_at: Date.now() }
      pending.set(key, prepared)
      return { status: "prepared", review_kind: kind, artifact_references: snapshot.references, snapshot_paths: paths,
        approval_status: decision.status, instruction: "Leer ambos snapshots locales completos; usar offset/limit si son extensos. Contrastar intención humana del encargo. No se requiere revisión administrativa LLM." }
    }
    if (input.operation !== "complete" || !pending.has(key)) throw new Error("La revisión requiere begin en esta sesión antes de complete")
    const prepared = pending.get(key)
    const judgment = input.judgment
    if (!judgment || Object.keys(judgment).some(key => !semanticKeys.includes(key))) throw new Error("El LLM no puede proporcionar metadatos administrativos")
    const current = await reviewSnapshot(directory, prepared.kind === "draft")
    if (JSON.stringify(current) !== JSON.stringify({ snapshots: prepared.snapshots, references: prepared.references })) throw new Error("Los archivos cambiaron durante la revisión; no se atribuye el juicio a otra versión")
    for (const artifact of artifacts) {
      const { directory: base } = await artifactLocation(directory, "genesis")
      const path = join(base, prepared.paths[artifact].split("/").at(-1))
      const stat = await lstat(path)
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || await readFile(path, "utf8") !== prepared.snapshots[artifact]) throw new Error("El snapshot de revisión cambió durante el juicio")
    }
    if (!context.messageID || !context.sessionID) throw new Error("El runtime no identifica el mensaje de revisión")
    const report = { ...judgment, status: "completed", review_kind: prepared.kind, artifact_references: prepared.references,
      review_reference: `opencode-session:${context.sessionID}`,
      ...(prepared.kind === "administrative" ? { semantic_review_reference: prepared.semantic.report.review_reference } : {}) }
    if (!parseReviewReport(JSON.stringify(report))) throw new Error("Juicio semántico incompleto o contradictorio para la revisión encargada")
    const record = { session_id: context.sessionID, message_id: context.messageID, begun_at: prepared.begun_at,
      completed_at: Date.now(), report, snapshots: prepared.snapshots, ...(prepared.semantic ? { semantic_message_id: prepared.semantic.message_id } : {}) }
    context.signal.throwIfAborted()
    const { directory: base } = await artifactLocation(directory, "genesis")
    const name = `.review-${hash([context.sessionID, context.messageID]).slice(7)}.json`
    const handle = await open(join(base, name), "wx", 0o600)
    try { await handle.writeFile(JSON.stringify({ record, digest: hash(record) }, null, 2) + "\n"); await handle.sync() }
    finally { await handle.close() }
    pending.delete(key)
    return { ...report, report_path: `docs/base/${name}`, review_message_id: record.message_id,
      ...(record.semantic_message_id ? { semantic_message_id: record.semantic_message_id } : {}) }
  }
}
