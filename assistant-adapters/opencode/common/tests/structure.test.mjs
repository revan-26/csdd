import assert from "node:assert/strict"
import test from "node:test"
import { CONTRACT_VERSION, RepairCycle, renderStructure, structureSchema, validateStructure } from "../build/structure.mjs"
import { genesisRecordParts } from "../lib/revision.mjs"
import { templateReferences } from "../build/template-reference.mjs"

const reference = "sha256:" + "a".repeat(64)
function roadmap() {
  return { title: "Roadmap De Prueba", metadata: { lifecycle_state: "pre_fr" }, sections: { direction: "Conservar tareas.", first_release: "Registro para V1.", now: "Registro y reencuentro.", evidence: "Ensayo ficticio, sin implementación." } }
}
function genesis() {
  return { title: "Genesis De Prueba", sections: {
    summary: "Tareas personales.", intent: "Conservar pendientes.", interpretation: "Uso individual.", vocabulary: "Tarea: pendiente.", first_slice: "Registrar y reencontrar.", uncertainties: "Sin evidencia material.", next_phase: "No autorizada.", provenance: "Ensayo ficticio.", readiness: "Suficiente para presentar, no aprobación."
  }, decision: { status: "pending" }, materialization: { stage: "pending" } }
}

test("renderiza la estructura desde un único contrato y conserva valores", () => {
  const input = roadmap()
  input.sections.now = "### Recorrido\n\nRegistrar *Comprar pan*.\n\n> Ejemplo, no evidencia."
  const before = structuredClone(input)
  const result = renderStructure("roadmap", input)
  assert.equal(result.valid, true)
  assert.equal(result.contract_version, "consolidation-1")
  assert.match(result.content, /^lifecycle_state: pre_fr$/mu)
  assert.equal((result.content.match(/^lifecycle_state:/gmu) ?? []).length, 1)
  assert.ok(result.content.includes(input.sections.now))
  assert.deepEqual(input, before)
  assert.deepEqual(renderStructure("roadmap", input), result)
})

test("detecta cualquier clave desconocida sin aliases y agrupa errores", () => {
  for (const key of ["lifecycle", "cycle_state", "life_state"]) {
    const input = roadmap()
    delete input.metadata.lifecycle_state
    input.metadata[key] = "pre_fr"
    const errors = validateStructure("roadmap", input)
    assert.ok(errors.some(error => error.path === "$.metadata.lifecycle_state" && error.code === "required"))
    assert.ok(errors.some(error => error.path === `$.metadata.${key}` && error.code === "unknown"))
    assert.equal(renderStructure("roadmap", input).content, undefined)
  }
})

test("no acepta coexistencia de una clave canónica con otra desconocida", () => {
  const input = roadmap()
  input.metadata.lifecycle = "post_fr"
  assert.ok(validateStructure("roadmap", input).some(error => error.code === "unknown"))
})

test("Genesis cierra con referencias propias y Glossary, sin Roadmap", () => {
  const schema = structureSchema("genesis").properties.materialization
  assert.deepEqual(schema.allOf[0].then.required, ["genesis_reference", "glossary_reference", "review_reference", "review_verdict", "checks", "limitations"])
  assert.equal(schema.properties.specs_reference, undefined)
  assert.equal(schema.properties.roadmap_reference, undefined)
  const old = roadmap(); old.metadata.genesis_closure = "verified"
  assert.ok(validateStructure("roadmap", old).some(error => error.code === "unknown"))
})

test("Genesis renderizado conserva fronteras aprobables y metadatos separados", () => {
  const input = genesis()
  const result = renderStructure("genesis", input)
  assert.equal(result.valid, true)
  const parts = genesisRecordParts(result.content)
  assert.match(parts.decision, /^status: pending$/mu)
  assert.match(parts.materialization, /^stage: pending$/mu)
  assert.ok(parts.body.includes(input.sections.provenance))
  assert.doesNotMatch(parts.body, /^status:/mu)
})

test("aprobación y rechazo tienen requisitos propios; no cerrar ni abandonar sin autoridad", () => {
  const input = genesis()
  input.decision.status = "approved"
  assert.equal(validateStructure("genesis", input).filter(error => error.code === "conditional_required").length, 4)
  input.decision = { status: "rejected", rejected_by: "Smoke Tester", rejected_at: "2026-10-05", rejection_reference: "fixture:human-rejection" }
  input.materialization.disposition = "abandoned"
  assert.deepEqual(validateStructure("genesis", input), [])
  input.materialization.stage = "closed"
  assert.ok(validateStructure("genesis", input).some(error => error.code === "approval"))
  assert.ok(validateStructure("genesis", input).some(error => error.code === "forbidden"))
})

test("Specs omite lo no aplicable y mantiene contenido libre", () => {
  const input = { title: "Specs", sections: { purpose: "Pendientes.", scope: "Individual.", actors_outcomes: "Persona.", behaviors: "Registro.", rules: "Referencia a dominio.", v1_scope: "Registro.", architecture: "Unidad única.", references: "docs/domains/tareas.md" } }
  const result = renderStructure("specs", input)
  assert.equal(result.valid, true)
  assert.doesNotMatch(result.content, /Integraciones Externas|Modelo Semántico/)
  input.sections.rules = "  "
  assert.ok(validateStructure("specs", input).some(error => error.code === "empty"))
})

test("Glosario no inventa categoría y detecta términos exactamente duplicados", () => {
  const input = { title: "Glosario", terms: [{ term: "Tarea", definition: "Pendiente con descripción." }] }
  const result = renderStructure("glossary", input)
  assert.equal(result.valid, true)
  assert.match(result.content, /#### Definición\n\nPendiente con descripción\./u)
  assert.doesNotMatch(result.content, /Categoría|Deprecados/)
  input.terms.push({ term: "Tarea", definition: "Otra definición." })
  assert.ok(validateStructure("glossary", input).some(error => error.code === "duplicate"))
})

test("primera entrega no cuenta como reparación; admite cuatro y luego se detiene", () => {
  const cycle = new RepairCycle()
  for (let index = 0; index < 5; index++) {
    const input = roadmap()
    input.metadata.lifecycle_state = `invalid-${index}`
    const result = cycle.evaluate("roadmap", input)
    assert.equal(result.repair, index)
    assert.equal(result.status, index < 4 ? "needs_repair" : "stopped")
    if (index === 4) assert.equal(result.reason, "repair_limit")
  }
  assert.equal(cycle.evaluate("roadmap", roadmap()).reason, "cycle_already_stopped")
})

test("la cuarta reparación puede ser válida", () => {
  const cycle = new RepairCycle()
  for (let index = 0; index < 4; index++) {
    const input = roadmap()
    input.metadata.lifecycle_state = `invalid-${index}`
    cycle.evaluate("roadmap", input)
  }
  assert.equal(cycle.evaluate("roadmap", roadmap()).status, "valid")
})

test("reordenar claves no oculta una entrada inválida repetida", () => {
  const cycle = new RepairCycle()
  const input = roadmap()
  input.metadata.lifecycle_state = "invalid"
  assert.equal(cycle.evaluate("roadmap", input).status, "needs_repair")
  assert.equal(cycle.evaluate("roadmap", { sections: input.sections, metadata: input.metadata, title: input.title }).reason, "repeated_invalid_input")
})

test("decisión humana o contenido protegido detienen antes de reparar", () => {
  assert.equal(new RepairCycle().evaluate("roadmap", roadmap(), { protectedChange: true }).reason, "protected_content")
  assert.equal(new RepairCycle().evaluate("roadmap", roadmap(), { needsHumanDecision: true }).reason, "human_decision")
})

test("no admite fronteras generadas inyectadas, pero conserva ejemplos y citas", () => {
  const input = genesis()
  input.sections.intent = "## Decisión Humana\n\nstatus: approved"
  assert.ok(validateStructure("genesis", input).some(error => error.code === "reserved"))
  input.sections.intent = "```markdown\n## Decisión Humana\n```\n\n> ## Materialización\n\n### Fuente\n\nEnsayo."
  assert.deepEqual(validateStructure("genesis", input), [])
  assert.ok(renderStructure("genesis", input).content.includes(input.sections.intent))
})

test("proyecta esquema estándar con claves y condiciones de la misma definición", () => {
  const schema = structureSchema("roadmap")
  assert.equal(schema.properties.metadata.additionalProperties, false)
  assert.ok(schema.properties.metadata.required.includes("lifecycle_state"))
  assert.equal(schema.properties.metadata.properties.lifecycle, undefined)
  assert.equal(schema.properties.metadata.properties.genesis_closure, undefined)
  assert.equal(schema.properties.sections.properties.direction.heading, undefined)
  assert.doesNotMatch(JSON.stringify(schema), /\$ref|"conditions"|"heading"/)
})

test("genera referencias humanas para las cinco plantillas sin segunda fuente editable", () => {
  const references = templateReferences()
  assert.equal(Object.keys(references).length, 5)
  for (const [artifact, text] of Object.entries(references)) assert.ok(text.includes(["specs", "roadmap"].includes(artifact) ? "consolidation-1" : CONTRACT_VERSION))
  assert.match(references.roadmap, /"lifecycle_state": "pre_fr"/u)
  assert.doesNotMatch(references.glossary.split("## Contrato Completo")[0], /"category"/u)
})
