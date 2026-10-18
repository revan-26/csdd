import { createHash } from "node:crypto"
import { lstat, readFile, realpath } from "node:fs/promises"
import { sep } from "node:path"
import { ARTIFACTS, artifactLocation } from "./artifacts.mjs"

const ADMIN_HEADINGS = new Set(["Decisión Humana", "Materialización"])

export function artifactNames() {
  return Object.keys(ARTIFACTS)
}

export function canonicalizeText(value) {
  return value.replace(/^\uFEFF/u, "").replace(/\r\n?/gu, "\n").trimEnd() + "\n"
}

export function genesisRecords(value) {
  const normalized = value.replace(/^\uFEFF/u, "").replace(/\r\n?/gu, "\n")
  const starts = [0]
  const ids = new Set()
  let fence
  let offset = 0
  for (const line of normalized.split("\n")) {
    const opening = /^[ \t]{0,3}(`{3,}|~{3,})/u.exec(line)?.[1]
    const closing = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/u.exec(line)?.[1]
    if (opening && !fence) fence = opening
    else if (closing && closing[0] === fence?.[0] && closing.length >= fence.length) fence = undefined
    else if (!fence) {
      const match = /^# Revisión de GENESIS: ([A-Za-z0-9_-]+)[ \t]*$/u.exec(line)
      if (match) {
        if (offset === 0 || ids.has(match[1])) throw new Error("La revisión debe seguir al registro inicial y tener un ID único")
        ids.add(match[1])
        starts.push(offset)
      }
    }
    offset += line.length + 1
  }
  return starts.map((start, index) => normalized.slice(start, starts[index + 1]))
}

export function genesisRecordParts(value) {
  const normalized = value.replace(/^\uFEFF/u, "").replace(/\r\n?/gu, "\n")
  const headings = []
  let fence
  let offset = 0
  for (const line of normalized.split("\n")) {
    const openingMarker = /^[ \t]{0,3}(`{3,}|~{3,})/u.exec(line)?.[1]
    const closingMarker = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/u.exec(line)?.[1]
    if (openingMarker && !fence) fence = openingMarker
    else if (closingMarker && closingMarker[0] === fence?.[0] && closingMarker.length >= fence.length) fence = undefined
    else if (!fence) {
      const match = /^## (Decisión Humana|Materialización)[ \t]*$/u.exec(line)
      if (match) headings.push({ name: match[1], index: offset })
    }
    offset += line.length + 1
  }
  for (const name of ADMIN_HEADINGS) {
    if (headings.filter((heading) => heading.name === name).length !== 1) {
      throw new Error(`GENESIS.md debe contener exactamente un encabezado '## ${name}' fuera de bloques de código`)
    }
  }
  const decision = headings.find((heading) => heading.name === "Decisión Humana")
  const materialization = headings.find((heading) => heading.name === "Materialización")
  if (materialization.index <= decision.index) {
    throw new Error("Materialización debe aparecer después de Decisión Humana")
  }
  const body = normalized.slice(0, decision.index)
  if (!body.trim()) throw new Error("El cuerpo aprobable de GENESIS.md está vacío")
  return {
    body: canonicalizeText(body),
    decision: canonicalizeText(normalized.slice(decision.index, materialization.index)),
    materialization: normalized.slice(materialization.index),
  }
}

export function genesisApprovedBody(value) {
  const records = genesisRecords(value)
  for (const record of records) genesisRecordParts(record)
  return genesisRecordParts(records.at(-1)).body
}

export async function resolveArtifact(workspace, artifact) {
  const definition = await artifactLocation(workspace, artifact)
  const { artifactPath } = definition
  const artifactRealPath = await realpath(artifactPath)
  if (artifactRealPath !== artifactPath) {
    throw new Error(`El artefacto ${artifact} resuelve fuera del workspace`)
  }

  const stat = await lstat(artifactPath)
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`El artefacto ${artifact} no es un archivo`)
  }

  return { ...definition, artifactPath, artifactRealPath }
}

export async function calculateArtifactRevision(workspace, artifact) {
  const definition = await resolveArtifact(workspace, artifact)
  const source = await readFile(definition.artifactRealPath, "utf8")
  const content = definition.bodyOnly ? genesisApprovedBody(source) : canonicalizeText(source)
  const digest = createHash("sha256").update(content, "utf8").digest("hex")
  return {
    artifact,
    path: definition.path.replaceAll("/", sep),
    scope: definition.bodyOnly ? "approved_body" : "full_document",
    reference: `sha256:${digest}`,
    bytes: Buffer.byteLength(content, "utf8"),
  }
}
