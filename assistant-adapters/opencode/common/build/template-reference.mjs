import { renderStructure, structureSchema, STRUCTURES, structureContract } from "./structure.mjs"

// Referencia humana derivada, no una segunda plantilla editable. No modifica
// el repositorio: la integración de distribución decidirá dónde escribirla.
export function templateReference(artifact) {
  const source = structureContract(artifact)
  const schema = structureSchema(artifact)
  function example(field, key) {
    if (field.type === "object") return Object.fromEntries((field.required ?? []).map(name => [name, example(field.properties[name], name)]))
    if (field.type === "array") return [example(field.items, key)]
    if (key === "lifecycle_state") return "pre_fr"
    if (field.enum) return field.enum[0]
    if (key === "revision_id") return "revision_1"
    return field.description ?? `<${key}>`
  }
  const input = example(schema, artifact)
  const result = renderStructure(artifact, input)
  if (!result.valid) throw new Error(`Ejemplo generado inválido: ${JSON.stringify(result.errors)}`)
  return [
    `# Referencia Estructural: ${artifact}`,
    `Generada desde ${source.file} (${source.version}). No editar esta referencia ni copiar placeholders al producto. La validez estructural no demuestra fidelidad semántica o autoridad.`,
    "## Entrada Mínima De Ejemplo",
    "```json\n" + JSON.stringify(input, null, 2) + "\n```",
    "## Contrato Completo",
    "Incluye campos opcionales y condiciones. Solo añadir contenido aplicable y autorizado.",
    "```json\n" + JSON.stringify(schema, null, 2) + "\n```",
    "## Markdown Derivado De Ejemplo",
    "```markdown\n" + result.content.trimEnd() + "\n```",
  ].join("\n\n") + "\n"
}

export function templateReferences() {
  return Object.fromEntries(Object.keys(STRUCTURES).map(artifact => [artifact, templateReference(artifact)]))
}
