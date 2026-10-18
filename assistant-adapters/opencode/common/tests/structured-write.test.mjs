import assert from "node:assert/strict"
import { access, mkdtemp, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import test from "node:test"
import { writeStructuredArtifact, structuredWriter, parseStructure } from "../lib/structured-write.mjs"
import { renderStructure } from "../lib/structure.mjs"
import { calculateArtifactRevision, genesisRecordParts } from "../lib/revision.mjs"

function data(artifact) {
  if (artifact === "genesis") return { title: "Genesis", sections: { summary: "Tareas.", intent: "Conservar.", interpretation: "Individual.", vocabulary: "Tarea: pendiente.", first_slice: "Registro.", uncertainties: "Sin implementación.", next_phase: "No autorizada.", provenance: "Fixture ficticia.", readiness: "Suficiente para presentar." }, decision: { status: "pending" }, materialization: { stage: "pending" } }
  if (artifact === "specs") return { title: "Specs", sections: { purpose: "Tareas.", scope: "Individual.", actors_outcomes: "Persona.", behaviors: "Registro.", rules: "Referencia a dominio.", v1_scope: "Registro.", architecture: "Unidad única.", references: "docs/domains/tareas.md" } }
  if (artifact === "roadmap") return { title: "Roadmap", metadata: { lifecycle_state: "pre_fr" }, sections: { direction: "Pendientes.", first_release: "Registro para V1.", now: "Registro.", evidence: "Fixture ficticia." } }
  return { title: "Glosario", terms: [{ term: "Tarea", definition: "Pendiente.", limits: "### not generated".replace("###", "#####") }] }
}
async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), "csdd-structured-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  return root
}

test("escritura estructurada y parser hacen roundtrip en las cuatro salidas", async context => {
  const root = await fixture(context)
  for (const artifact of ["genesis", "specs", "roadmap", "glossary"]) {
    const value = data(artifact)
    const result = await writeStructuredArtifact(root, { artifact, operation: "create", data: value })
    const text = await readFile(join(root, result.path), "utf8")
    assert.deepEqual(parseStructure(artifact, text), value)
    assert.equal(text, renderStructure(artifact, value).content)
  }
})

test("parche conserva narrativa omitida y retira solo campos opcionales", async context => {
  const root = await fixture(context)
  const value = data("roadmap")
  value.metadata.last_reviewed = "2026-10-08"
  await writeStructuredArtifact(root, { artifact: "roadmap", operation: "create", data: value })
  await writeStructuredArtifact(root, { artifact: "roadmap", operation: "update", data: { metadata: { last_reviewed: null } } })
  const text = await readFile(join(root, "docs/roadmap.md"), "utf8")
  assert.ok(text.includes(value.sections.now))
  assert.doesNotMatch(text, /last_reviewed:/)
  await assert.rejects(() => writeStructuredArtifact(root, { artifact: "roadmap", operation: "update", data: { metadata: { lifecycle_state: null } } }), /required/)
  assert.equal(await readFile(join(root, "docs/roadmap.md"), "utf8"), text)
})

test("no admite Markdown completo ni aliases; ninguna escritura ante error", async context => {
  const root = await fixture(context)
  await assert.rejects(() => writeStructuredArtifact(root, { artifact: "specs", content: "# Specs" }), /content/)
  await assert.rejects(() => access(join(root, "docs/specs.md")), { code: "ENOENT" })
  const value = data("roadmap")
  value.metadata.life_state = value.metadata.lifecycle_state
  delete value.metadata.lifecycle_state
  await assert.rejects(() => writeStructuredArtifact(root, { artifact: "roadmap", operation: "create", data: value }), /unknown/)
})

test("conserva cuerpo y decisión aprobados desde el documento al actualizar materialización", async context => {
  const root = await fixture(context)
  await writeStructuredArtifact(root, { artifact: "genesis", operation: "create", data: data("genesis") })
  const ref = (await calculateArtifactRevision(root, "genesis")).reference
  await writeStructuredArtifact(root, { artifact: "genesis", operation: "update", data: { decision: { status: "approved", approved_by: "Smoke Tester", approved_at: "2026-10-05", approved_content_reference: ref, approval_reference: `fixture:human; statement:Apruebo ${ref}` } } })
  const before = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  await writeStructuredArtifact(root, { artifact: "genesis", operation: "update", data: { materialization: { notes: "Revisión pendiente." } } })
  const after = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  assert.equal(genesisRecordParts(before).body, genesisRecordParts(after).body)
  assert.equal(genesisRecordParts(before).decision, genesisRecordParts(after).decision)
  await assert.rejects(() => writeStructuredArtifact(root, { artifact: "genesis", operation: "update", data: { sections: { intent: "Otra intención." } } }), /protected_content/)
  assert.equal(await readFile(join(root, "docs/base/GENESIS.md"), "utf8"), after)
})

test("rechazo estructurado preserva bloque y permite append con referencia propia", async context => {
  const root = await fixture(context)
  await writeStructuredArtifact(root, { artifact: "genesis", operation: "create", data: data("genesis") })
  await writeStructuredArtifact(root, { artifact: "genesis", operation: "update", data: { decision: { status: "rejected", rejected_by: "Smoke Tester", rejected_at: "2026-10-05", rejection_reference: "fixture:human-reject" }, materialization: { disposition: "abandoned" } } })
  const rejected = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  await writeStructuredArtifact(root, { artifact: "genesis", operation: "append", data: { revision_id: "new_1", sections: { reason_scope: "Cambio.", proposed_change: "Equipos.", impacts: "Revisión.", provenance_pending: "Fixture." }, decision: { status: "pending" }, materialization: { stage: "pending" } } })
  assert.ok((await readFile(join(root, "docs/base/GENESIS.md"), "utf8")).startsWith(rejected))
})

test("el contador operativo permite cuatro reparaciones y bloquea repetición", async context => {
  const root = await fixture(context)
  const write = structuredWriter()
  for (let index = 0; index < 4; index++) {
    const value = data("roadmap")
    value.metadata.lifecycle_state = `invalid-${index}`
    const result = await write(root, "ses_fixture", { artifact: "roadmap", operation: "create", data: value })
    assert.equal(result.repair, index)
    assert.equal(result.status, "needs_repair")
  }
  assert.equal((await write(root, "ses_fixture", { artifact: "roadmap", operation: "create", data: data("roadmap") })).status, "written")
  const invalid = { artifact: "specs", operation: "create", data: {} }
  assert.equal((await write(root, "ses_fixture", invalid)).status, "needs_repair")
  assert.equal((await write(root, "ses_fixture", invalid)).status, "blocked")
  await assert.rejects(() => write(root, "ses_fixture", { artifact: "specs", operation: "create", data: data("specs") }), /repair_stopped/)
})

test("campos desconocidos nulos y claves de prototipo no eluden validación", async context => {
  const root = await fixture(context)
  await writeStructuredArtifact(root, { artifact: "roadmap", operation: "create", data: data("roadmap") })
  for (const patch of [{ metadata: { life_state: null } }, JSON.parse('{"__proto__":{"polluted":true}}')]) {
    await assert.rejects(() => writeStructuredArtifact(root, { artifact: "roadmap", operation: "update", data: patch }), /unknown/)
  }
  assert.equal({}.polluted, undefined)
})
