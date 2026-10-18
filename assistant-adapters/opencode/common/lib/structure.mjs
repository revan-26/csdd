import contract from "../../../../framework/templates/genesis.contract.json" with { type: "json" }
import closureContract from "../../../../framework/templates/consolidation.contract.json" with { type: "json" }
import { canonicalizeText } from "./revision.mjs"

export const CONTRACT_VERSION = contract.version
export const STRUCTURES = { ...contract.artifacts, ...closureContract.artifacts }
export function structureContract(artifact) {
  return Object.hasOwn(closureContract.artifacts, artifact)
    ? { file: "consolidation.contract.json", version: closureContract.version }
    : { file: "genesis.contract.json", version: contract.version }
}

// Proyección estándar para el esquema de entrada de las tools; los títulos y
// condiciones siguen teniendo una sola fuente, el contrato de las plantillas.
export function structureSchema(artifact) {
  if (!STRUCTURES[artifact]) throw new Error("Artefacto estructural no permitido")
  function project(raw) {
    const schema = definition(raw)
    const result = Object.fromEntries(Object.entries(schema).filter(([key]) => !["heading", "conditions", "properties", "items"].includes(key)))
    if (schema.properties) result.properties = Object.fromEntries(Object.entries(schema.properties).map(([key, field]) => [key, project(field)]))
    if (schema.items) result.items = project(schema.items)
    if (schema.conditions) result.allOf = schema.conditions.map(condition => ({
      if: { properties: { [condition.field]: { const: condition.equals } }, required: [condition.field] },
      then: {
        ...(condition.required ? { required: condition.required } : {}),
        ...(condition.forbidden ? { not: { anyOf: condition.forbidden.map(key => ({ required: [key] })) } } : {}),
      },
    }))
    return result
  }
  return project(STRUCTURES[artifact])
}

export function structuralHeadings(text, maximum = 2) {
  const headings = []
  let fence
  for (const line of text.replace(/\r\n?/gu, "\n").split("\n")) {
    const marker = /^[ \t]{0,3}(`{3,}|~{3,})/u.exec(line)?.[1]
    const closing = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/u.exec(line)?.[1]
    if (!fence && marker) fence = marker
    else if (fence && closing?.[0] === fence[0] && closing.length >= fence.length) fence = undefined
    else if (!fence && new RegExp(`^[ \\t]{0,3}#{1,${maximum}}[ \\t]+`, "u").test(line)) headings.push(line)
  }
  return headings
}

export function definition(schema) {
  if (!schema.$ref) return schema
  const referenced = contract.definitions[schema.$ref]
  if (!referenced) throw new Error(`Referencia estructural desconocida: ${schema.$ref}`)
  return { ...referenced, ...Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "$ref")) }
}

export function validateStructure(artifact, data) {
  const errors = []
  const issue = (path, code, message) => errors.push({ path, code, message })
  const root = STRUCTURES[artifact]
  if (!root) return [{ path: "$", code: "artifact", message: "Artefacto estructural no permitido" }]
  function visit(value, schema, path) {
    schema = definition(schema)
    const validType = schema.type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value)
      : schema.type === "array" ? Array.isArray(value) : typeof value === schema.type
    if (!validType) { issue(path, "type", `Se requiere ${schema.type}`); return }
    if (schema.enum && !schema.enum.includes(value)) issue(path, "enum", `Valores permitidos: ${schema.enum.join(", ")}`)
    if (typeof value === "string") {
      if (value.includes("\0")) issue(path, "nul", "No se permiten bytes nulos")
      if (schema.minLength && value.trim().length < schema.minLength) issue(path, "empty", "No puede estar vacío")
      if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) issue(path, "pattern", "Formato inválido")
      if (schema.pattern === "^[^\\r\\n]+$" && /[\r\n]/u.test(value)) issue(path, "single_line", "El dato administrativo debe ocupar una sola línea")
      if (schema.heading && structuralHeadings(value).length) issue(path, "reserved", "Los encabezados de niveles 1 y 2 los genera el framework; usar nivel 3 o inferior dentro del contenido")
      if (/^\$\.(decision|materialization)\./u.test(path) && schema.heading) {
        const siblings = definition(STRUCTURES[artifact].properties[path.split(".")[1]]).properties
        const reserved = new Set(Object.values(siblings).map(field => definition(field).heading).filter(Boolean))
        if (structuralHeadings(value, 3).some(line => reserved.has(line.replace(/^[ \t]*###\s+/u, "").trim()))) issue(path, "reserved", "No reutilizar encabezados administrativos generados dentro de las notas")
      }
    }
    if (schema.type === "array") {
      if (schema.minItems && value.length < schema.minItems) issue(path, "items", "Faltan entradas")
      value.forEach((item, index) => visit(item, schema.items, `${path}[${index}]`))
    }
    if (schema.type === "object") {
      for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) issue(`${path}.${key}`, "required", "Campo obligatorio ausente")
      for (const [key, entry] of Object.entries(value)) {
        if (!Object.hasOwn(schema.properties, key)) issue(`${path}.${key}`, "unknown", "Campo desconocido; no se adivina su equivalencia")
        else visit(entry, schema.properties[key], `${path}.${key}`)
      }
      for (const condition of schema.conditions ?? []) {
        if (value[condition.field] !== condition.equals) continue
        for (const key of condition.required ?? []) if (!Object.hasOwn(value, key)) issue(`${path}.${key}`, "conditional_required", `Obligatorio con ${condition.field}: ${condition.equals}`)
        for (const key of condition.forbidden ?? []) if (Object.hasOwn(value, key)) issue(`${path}.${key}`, "forbidden", `No corresponde con ${condition.field}: ${condition.equals}`)
      }
    }
  }
  visit(data, root, "$")
  if ((artifact === "genesis" || artifact === "genesis_revision") && data && typeof data === "object") {
    if (data.materialization?.stage === "closed" && data.decision?.status !== "approved") issue("$.materialization.stage", "approval", "No cerrar sin aprobación propia")
    if (data.materialization?.stage === "closed" && data.materialization?.review_verdict !== "conforming") issue("$.materialization.review_verdict", "review", "Cerrar exige revisión conforme")
    if (data.materialization?.disposition === "abandoned" && data.decision?.status !== "rejected") issue("$.materialization.disposition", "rejection", "Abandonar exige rechazo explícito")
  }
  if (artifact === "glossary" && Array.isArray(data?.terms)) {
    const seen = new Set()
    data.terms.forEach((entry, index) => {
      if (typeof entry?.term !== "string") return
      if (seen.has(entry.term)) issue(`$.terms[${index}].term`, "duplicate", "Término preferido duplicado; no fusionar definiciones")
      seen.add(entry.term)
      for (const [key, text] of Object.entries(entry)) if (key !== "term" && typeof text === "string" && structuralHeadings(text, 4).length) issue(`$.terms[${index}].${key}`, "reserved", "En entradas de glosario usar subtítulos de nivel 5 o inferior")
    })
  }
  return errors
}

function sections(schema, data, level = 2) {
  return Object.entries(definition(schema).properties).filter(([key]) => Object.hasOwn(data, key))
    .map(([key, field]) => `${"#".repeat(level)} ${definition(field).heading}\n\n${data[key]}`).join("\n\n")
}

export function administration(schema, data) {
  const properties = definition(schema).properties
  const scalars = Object.entries(properties).filter(([key, field]) => Object.hasOwn(data, key) && !definition(field).heading)
    .map(([key]) => `${key}: ${data[key]}`).join("\n")
  const narrative = Object.entries(properties).filter(([key, field]) => Object.hasOwn(data, key) && definition(field).heading)
    .map(([key, field]) => `### ${definition(field).heading}\n\n${data[key]}`).join("\n\n")
  return [scalars, narrative].filter(Boolean).join("\n\n")
}

export function renderStructure(artifact, data) {
  const errors = validateStructure(artifact, data)
  if (errors.length) return { valid: false, contract_version: structureContract(artifact).version, errors }
  const schema = STRUCTURES[artifact].properties
  const title = artifact === "genesis_revision" ? `Revisión de GENESIS: ${data.revision_id}` : data.title
  const blocks = [`# ${title}`]
  if (data.metadata) blocks.push(administration(schema.metadata, data.metadata))
  if (data.sections) blocks.push(sections(schema.sections, data.sections))
  if (data.decision) blocks.push(`## Decisión Humana\n\n${administration(schema.decision, data.decision)}`)
  if (data.materialization) blocks.push(`## Materialización\n\n${administration(schema.materialization, data.materialization)}`)
  if (artifact === "glossary") {
    if (data.purpose) blocks.push(`## ${definition(schema.purpose).heading}\n\n${data.purpose}`)
    const item = definition(schema.terms.items)
    blocks.push("## Términos\n\n" + data.terms.map(entry => `### ${entry.term}\n\n${sections({ properties: Object.fromEntries(Object.entries(item.properties).filter(([key]) => key !== "term")) }, entry, 4)}`).join("\n\n"))
    if (data.deprecated_terms) blocks.push(`## ${definition(schema.deprecated_terms).heading}\n\n${data.deprecated_terms}`)
  }
  return { valid: true, contract_version: structureContract(artifact).version, content: canonicalizeText(blocks.join("\n\n")), errors: [] }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
  return value
}

// Estado de una operación de reparación; no escribe ni invoca un modelo.
export class RepairCycle {
  #seen = new Set()
  #submissions = 0
  #stopped = false

  evaluate(artifact, data, { protectedChange = false, needsHumanDecision = false } = {}) {
    if (this.#stopped) return { status: "stopped", reason: "cycle_already_stopped" }
    const errors = validateStructure(artifact, data)
    const fingerprint = JSON.stringify(stable({ artifact, data }))
    const repair = this.#submissions++
    let reason
    if (protectedChange) reason = "protected_content"
    else if (needsHumanDecision) reason = "human_decision"
    else if (this.#seen.has(fingerprint) && errors.length) reason = "repeated_invalid_input"
    else if (repair > 4 || (repair === 4 && errors.length)) reason = "repair_limit"
    if (reason) { this.#stopped = true; return { status: "stopped", reason, repair, errors } }
    if (!errors.length) { this.#stopped = true; return { status: "valid", repair, errors: [] } }
    this.#seen.add(fingerprint)
    return { status: "needs_repair", repair, remaining_repairs: 4 - repair, errors }
  }
}
