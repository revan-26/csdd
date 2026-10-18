import { readFile } from "node:fs/promises"
import { artifactLocation } from "./artifacts.mjs"
import { calculateArtifactRevision, genesisRecords, genesisRecordParts, canonicalizeText } from "./revision.mjs"
import { writeArtifact } from "./write.mjs"
import { CONTRACT_VERSION, STRUCTURES, definition, administration, renderStructure, validateStructure } from "./structure.mjs"

const ARTIFACTS = ["genesis", "specs", "roadmap", "glossary"]

export const structuredWriteSchema = {
  type: "object", additionalProperties: false,
  properties: {
    artifact: { type: "string", enum: ["genesis", "glossary"] },
    operation: { type: "string", enum: ["create", "update", "append"], description: "create: nuevo documento; update: parche sobre documento vigente; append: revisión fundamental de Genesis." },
    data: { type: "object", description: "Datos según .csdd/templates/genesis.contract.json y referencias generadas. update admite solo campos cambiados; null retira un campo opcional. Sin documento Markdown completo." },
  }, required: ["artifact", "operation", "data"],
}

// Parser del Markdown producido por el renderizador. No migra formatos ajenos.
function headings(text, level, titles) {
  const result = []
  let fence, offset = 0
  for (const line of text.split("\n")) {
    const marker = /^[ \t]{0,3}(`{3,}|~{3,})/u.exec(line)?.[1]
    const closing = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/u.exec(line)?.[1]
    if (!fence && marker) fence = marker
    else if (fence && closing?.[0] === fence[0] && closing.length >= fence.length) fence = undefined
    else if (!fence) {
      const match = new RegExp(`^#{${level}} (.+)$`, "u").exec(line)
      if (match && (!titles || titles.has(match[1]))) result.push({ title: match[1], offset, body: offset + line.length + 1 })
    }
    offset += line.length + 1
  }
  return result.map((entry, index) => ({ ...entry, content: text.slice(entry.body, result[index + 1]?.offset).trimEnd().replace(/^\n/u, "") }))
}

function parseFields(text, schema, level) {
  const properties = definition(schema).properties
  const entries = headings(text, level, new Set(Object.values(properties).map(field => definition(field).heading).filter(Boolean)))
  const scalarText = text.slice(0, entries[0]?.offset).trim()
  const data = {}
  if (scalarText) for (const line of scalarText.split("\n")) {
    const match = /^([a-z_]+): (.+)$/u.exec(line)
    if (!match || !Object.hasOwn(properties, match[1]) || Object.hasOwn(data, match[1])) throw new Error("Administración existente inválida o duplicada; no se migra ni corrige silenciosamente")
    data[match[1]] = match[2]
  }
  for (const entry of entries) {
    const key = Object.keys(properties).find(key => definition(properties[key]).heading === entry.title)
    if (!key || Object.hasOwn(data, key)) throw new Error("Sección existente desconocida o duplicada")
    data[key] = entry.content
  }
  return data
}

export function parseStructure(artifact, content) {
  content = canonicalizeText(content)
  const schema = STRUCTURES[artifact].properties
  const title = /^# (.+)\n/u.exec(content)?.[1]
  if (!title) throw new Error("El documento existente carece de título estructural")
  const entries = headings(content, 2)
  const data = artifact === "genesis_revision" ? { revision_id: title.replace(/^Revisión de GENESIS: /u, "") } : { title }
  if (schema.metadata) data.metadata = parseFields(content.slice(content.indexOf("\n") + 1, entries[0]?.offset), schema.metadata, 3)
  if (schema.sections) data.sections = {}
  for (const entry of entries) {
    if (schema.decision && entry.title === "Decisión Humana") data.decision = parseFields(entry.content, schema.decision, 3)
    else if (schema.materialization && entry.title === "Materialización") data.materialization = parseFields(entry.content, schema.materialization, 3)
    else if (artifact === "glossary" && entry.title === "Términos") {
      const item = definition(schema.terms.items)
      data.terms = headings(entry.content, 3).map(term => ({ term: term.title, ...parseFields(term.content, { properties: Object.fromEntries(Object.entries(item.properties).filter(([key]) => key !== "term")) }, 4) }))
    } else {
      const properties = schema.sections ? definition(schema.sections).properties : schema
      const key = Object.keys(properties).find(key => definition(properties[key]).heading === entry.title)
      const target = schema.sections ? data.sections : data
      if (!key || Object.hasOwn(target, key)) throw new Error("Sección existente desconocida o duplicada; no regenerar")
      target[key] = entry.content
    }
  }
  const errors = validateStructure(artifact, data)
  if (errors.length) throw new Error(`Documento existente fuera del contrato: ${JSON.stringify(errors)}`)
  return data
}

function merge(previous, patch) {
  const result = structuredClone(previous)
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete result[key]
    else if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) result[key] = merge(result[key], value)
    else Object.defineProperty(result, key, { value: structuredClone(value), enumerable: true, writable: true, configurable: true })
  }
  return result
}

export class StructuredWriteError extends Error {
  constructor(errors, { terminal = false } = {}) {
    super(JSON.stringify({ status: terminal ? "blocked" : "needs_repair", contract_version: CONTRACT_VERSION, errors }))
    this.name = "StructuredWriteError"
    this.errors = errors
    this.terminal = terminal
  }
}

export async function writeStructuredArtifact(workspace, input) {
  const fail = (code, message, terminal = false) => { throw new StructuredWriteError([{ path: "$", code, message }], { terminal }) }
  if (!input || typeof input !== "object" || Object.keys(input).some(key => !["artifact", "operation", "data"].includes(key))) fail("input", "Usar únicamente artifact, operation y data; no se admite content")
  const { artifact, operation } = input
  let { data } = input
  if (!ARTIFACTS.includes(artifact) || !["create", "update", "append"].includes(operation) || !data || typeof data !== "object" || Array.isArray(data)) fail("input", "Entrada estructurada inválida")
  if (operation === "append" && artifact !== "genesis") fail("operation", "Solo Genesis admite bloques añadidos")
  async function resolveReferences(value) {
    if (typeof value === "string") {
      for (const referenced of ARTIFACTS) {
        const token = `{{csdd_revision:${referenced}}}`
        if (value.includes(token)) value = value.replaceAll(token, (await calculateArtifactRevision(workspace, referenced)).reference)
      }
      return value
    }
    if (Array.isArray(value)) return Promise.all(value.map(resolveReferences))
    if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, entry]) => [key, await resolveReferences(entry)])))
    return value
  }
  data = await resolveReferences(data)
  let previous
  try {
    const location = await artifactLocation(workspace, artifact)
    previous = await readFile(location.artifactPath, "utf8")
  } catch (error) { if (error.code !== "ENOENT") throw error }
  if (operation === "create" && previous !== undefined) fail("exists", "El documento ya existe; usar update sin regenerar", true)
  if (operation !== "create" && previous === undefined) fail("missing", "No existe el documento que se intenta actualizar")
  let target = artifact, complete = data, records, oldParts, oldData
  if (artifact === "genesis" && previous !== undefined) {
    records = genesisRecords(previous)
    oldParts = genesisRecordParts(records.at(-1))
    if (operation === "update") target = records.length > 1 ? "genesis_revision" : "genesis"
    if (operation === "append") target = "genesis_revision"
  }
  if (operation === "update") {
    try { oldData = parseStructure(target, artifact === "genesis" ? records.at(-1) : previous) }
    catch (error) { fail("existing_structure", error.message, true) }
    const patchErrors = []
    function checkKeys(patch, schema, path) {
      schema = definition(schema)
      if (!patch || typeof patch !== "object" || Array.isArray(patch) || schema.type !== "object") return
      for (const [key, value] of Object.entries(patch)) {
        if (!Object.hasOwn(schema.properties, key)) patchErrors.push({ path: `${path}.${key}`, code: "unknown", message: "Campo de parche desconocido" })
        else checkKeys(value, schema.properties[key], `${path}.${key}`)
      }
    }
    checkKeys(data, STRUCTURES[target], "$")
    if (patchErrors.length) throw new StructuredWriteError(patchErrors)
    complete = merge(oldData, data)
  }
  const rendered = renderStructure(target, complete)
  if (!rendered.valid) throw new StructuredWriteError(rendered.errors)
  let content = rendered.content
  if (oldParts && operation === "update") {
    const current = genesisRecordParts(content)
    if (oldData.decision.status === "approved") {
      if (current.body !== oldParts.body || JSON.stringify(complete.decision) !== JSON.stringify(oldData.decision)) fail("protected_content", "Cuerpo y decisión aprobados son inmutables; no reparar ni reinterpretar", true)
      // Preservar las zonas aprobadas desde el archivo, no desde el renderizador.
      content = oldParts.body + "\n" + oldParts.decision + "\n" + current.materialization
    }
    content = records.slice(0, -1).join("") + content
  } else if (operation === "append") content = canonicalizeText(previous) + "\n" + content
  let result
  try { result = await writeArtifact(workspace, artifact, content) }
  catch (error) {
    if (error.code) throw error
    fail(error.guardCode ?? "guard", error.message, error.guardCode !== "approval_reference_mismatch")
  }
  return { ...result, status: "written", operation, contract_version: rendered.contract_version, corrections: [] }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
  return value
}

// Sesión + artefacto, no un ID que el modelo pueda cambiar para reiniciar el límite.
export function structuredWriter() {
  const cycles = new Map()
  return async (workspace, sessionID, input) => {
    const key = JSON.stringify([workspace, sessionID, input?.artifact])
    const state = cycles.get(key) ?? { failed: 0, seen: new Set(), blocked: false }
    if (state.blocked) throw new StructuredWriteError([{ path: "$", code: "repair_stopped", message: "Operación bloqueada; informar a Orchestrator, no reintentar" }], { terminal: true })
    const fingerprint = JSON.stringify(stable(input))
    try {
      const result = await writeStructuredArtifact(workspace, input)
      cycles.delete(key)
      return result
    } catch (error) {
      if (!(error instanceof StructuredWriteError)) throw error
      const repair = state.failed
      const repeated = state.seen.has(fingerprint)
      state.failed++
      state.seen.add(fingerprint)
      state.blocked = error.terminal || repeated || repair >= 4
      cycles.set(key, state)
      return { status: state.blocked ? "blocked" : "needs_repair", repair, remaining_repairs: Math.max(0, 4 - repair), reason: repeated ? "repeated_invalid_input" : repair >= 4 ? "repair_limit" : error.terminal ? "protected_or_existing_content" : "structure", contract_version: CONTRACT_VERSION, errors: error.errors }
    }
  }
}
