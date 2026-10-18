import assert from "node:assert/strict"
import { access, mkdtemp, rm, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { registerTools } from "../lib/tools.mjs"
import { parseStructure } from "../../common/lib/structured-write.mjs"

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "csdd-review-code-")); t.after(() => rm(root, { recursive: true, force: true }))
  const tools = new Map(), messages = []
  const ctx = { location: { directory: root }, session: {
    get: async ({ sessionID }) => ({ id: sessionID, location: { directory: root }, ...(sessionID === "ses_root" ? {} : { parentID: "ses_root" }) }),
    context: async () => messages,
  }, tool: { transform: async fn => fn({ add: tool => tools.set(tool.name, tool) }) } }
  await registerTools(ctx)
  let sequence = 0
  const call = async (name, input, agent = "CSDD-Canon", sessionID = "ses_canon") => JSON.parse((await tools.get(name).execute(input, { agent, sessionID, messageID: `msg_${++sequence}`, signal: new AbortController().signal })).content)
  const sections = Object.fromEntries(["summary", "intent", "interpretation", "vocabulary", "first_slice", "uncertainties", "next_phase", "provenance", "readiness"].map(key => [key, "Ensayo de tareas personales."]))
  await call("csdd_write", { artifact: "genesis", operation: "create", data: { title: "Genesis", sections, decision: { status: "pending" }, materialization: { stage: "pending" } } })
  const glossary = { title: "Glosario", terms: [{ term: "Tarea", definition: "Pendiente." }] }
  await call("csdd_write", { artifact: "glossary", operation: "create", data: glossary })
  const reference = (await call("csdd_revision", { artifact: "genesis" })).reference
  messages.push({ id: "msg_user", type: "user", text: `Apruebo ${reference}`, time: { created: 1791337119000 } })
  const judgment = { verdict: "conforming", summary: "Juicio simulado de fixture, no modelo real.", findings: [],
    semantic_checks: ["intent_fidelity", "preserved_rules"].map(criterion => ({ criterion, verdict: "conforming", evidence: "Fixture compara los términos de Genesis y Glossary." })),
    limitations: ["Prueba determinista; no acredita calidad de juicio LLM."], recommended_action: "Presentar candidato." }
  const review = input => call("csdd_review", input, "CSDD-Reviewer", "ses_reviewer")
  const approve = () => call("csdd_write", { artifact: "genesis", operation: "update", data: { decision: { status: "approved", approved_by: "Smoke Tester" } } })
  const close = () => call("csdd_write", { artifact: "genesis", operation: "update", data: { materialization: { stage: "closed" } } })
  const conform = async () => { const prepared = await review({ operation: "begin" }); const report = await review({ operation: "complete", judgment }); return { prepared, report } }
  return { root, ctx, messages, call, review, approve, close, conform, judgment, reference, glossary }
}

test("una revisión semántica del candidato permite aprobación y cierre sin Specs/Roadmap", async t => {
  const f = await fixture(t), { prepared, report } = await f.conform()
  assert.equal(prepared.review_kind, "semantic"); assert.equal(prepared.approval_status, "pending")
  assert.equal(prepared.snapshots, undefined)
  assert.deepEqual(Object.keys(prepared.snapshot_paths), ["genesis", "glossary"])
  for (const path of Object.values(prepared.snapshot_paths)) await access(join(f.root, path))
  assert.doesNotMatch(await readFile(join(f.root, prepared.snapshot_paths.genesis), "utf8"), /## Decisión Humana/)
  await f.approve(); await f.close()
  const data = parseStructure("genesis", await readFile(join(f.root, "docs/base/GENESIS.md"), "utf8"))
  assert.equal(data.decision.approved_at, new Date(1791337119000).toISOString())
  assert.equal(data.materialization.stage, "closed")
  assert.equal(data.materialization.review_reference, report.review_reference)
  assert.deepEqual(JSON.parse(data.materialization.checks).semantic.artifact_references, report.artifact_references)
  for (const path of ["docs/specs.md", "docs/roadmap.md", "docs/base/.genesis-recovery-pending", "docs/base/.glossary-candidate.json"]) await assert.rejects(() => access(join(f.root, path)), { code: "ENOENT" })
})

test("cierre exige revisión real; LLM no genera administración", async t => {
  const f = await fixture(t)
  await assert.rejects(f.approve, /No existe revisión semantic/)
  await assert.rejects(() => f.call("csdd_write", { artifact: "genesis", operation: "update", data: { decision: { status: "approved", approved_by: "Tester", approved_at: "Inventado" } } }), /generado por código/)
  await f.review({ operation: "begin" })
  await assert.rejects(() => f.review({ operation: "complete", judgment: { ...f.judgment, review_reference: "inventado" } }), /metadatos/)
  await f.review({ operation: "complete", judgment: f.judgment }); await f.approve()
  await assert.rejects(() => f.call("csdd_write", { artifact: "glossary", operation: "update", data: { title: "Cambio" } }), /no cambiar vocabulario aprobado/)
})

test("Genesis o Glossary cambiados durante juicio invalidan el reporte", async t => {
  for (const artifact of ["genesis", "glossary"]) {
    const f = await fixture(t); await f.review({ operation: "begin" })
    await f.call("csdd_write", { artifact, operation: "update", data: artifact === "genesis" ? { sections: { intent: "Intención distinta." } } : { terms: [{ term: "Tarea", definition: "Otro significado." }] } })
    await assert.rejects(() => f.review({ operation: "complete", judgment: f.judgment }), /cambiaron durante/)
  }
})

test("snapshot local alterado no acredita lectura de otra versión", async t => {
  const f = await fixture(t), prepared = await f.review({ operation: "begin" })
  await writeFile(join(f.root, prepared.snapshot_paths.glossary), "Sustitución.")
  await assert.rejects(() => f.review({ operation: "complete", judgment: f.judgment }), /snapshot de revisión cambió/)
})

test("salida begin permanece acotada aunque el contenido sea extenso", async t => {
  const f = await fixture(t)
  const long = "Explicación externa al juicio automatizado. ".repeat(5000)
  await f.call("csdd_write", { artifact: "genesis", operation: "update", data: { sections: { intent: long } } })
  const prepared = await f.review({ operation: "begin" })
  assert.ok(JSON.stringify(prepared).length < 2000)
  assert.ok((await readFile(join(f.root, prepared.snapshot_paths.genesis), "utf8")).includes(long))
})

test("recovery usa aprobación y revisión persistidas desde otra sesión sin historial", async t => {
  const f = await fixture(t); await f.conform(); await f.approve()
  f.ctx.session.context = () => { throw new Error("No consultar historia") }
  const revision = await f.call("csdd_revision", { artifact: "genesis" }, "CSDD-Canon", "ses_recovery")
  assert.equal(revision.approval_evidence.status, "recorded")
  await f.call("csdd_write", { artifact: "genesis", operation: "update", data: { materialization: { stage: "closed" } } }, "CSDD-Canon", "ses_recovery")
})

test("aprobación ambigua, errónea u obsoleta no modifica la decisión", async t => {
  const f = await fixture(t); await f.conform()
  for (const text of ["Me parece bien", `Apruebo sha256:${"0".repeat(64)}`]) {
    f.messages[0].text = text
    await assert.rejects(f.approve, /no aprueba explícitamente/)
  }
  f.messages[0].text = `Apruebo ${f.reference}`
  await f.call("csdd_write", { artifact: "genesis", operation: "update", data: { sections: { intent: "Nueva intención." } } })
  await assert.rejects(f.approve, /no aprueba explícitamente/)
})

test("rechazo elimina solo glosario candidato y permite bloque nuevo con ID propio", async t => {
  const f = await fixture(t)
  f.messages[0] = { ...f.messages[0], text: "Rechazo la propuesta." }
  await f.call("csdd_write", { artifact: "genesis", operation: "update", data: { decision: { status: "rejected", rejected_by: "Tester" }, materialization: { disposition: "abandoned" } } })
  const rejected = await readFile(join(f.root, "docs/base/GENESIS.md"), "utf8")
  await assert.rejects(() => access(join(f.root, "docs/glossary.md")), { code: "ENOENT" })
  await assert.rejects(() => access(join(f.root, "docs/base/.genesis-recovery-pending")), { code: "ENOENT" })
  f.messages[0] = { ...f.messages[0], id: "msg_new", text: "Redacta otra propuesta." }
  await f.call("csdd_write", { artifact: "genesis", operation: "append", data: { sections: { reason_scope: "Nuevo intento.", proposed_change: "Equipos.", impacts: "Solo propuesta.", provenance_pending: "Fixture." }, decision: { status: "pending" }, materialization: { stage: "pending" } } })
  const next = await readFile(join(f.root, "docs/base/GENESIS.md"), "utf8")
  assert.ok(next.startsWith(rejected)); assert.match(next, /Revisión de GENESIS: rev_msg_new/)
})

test("rechazo restaura únicamente el glosario previo", async t => {
  const f = await fixture(t); await f.conform(); await f.approve(); await f.close()
  const previous = await readFile(join(f.root, "docs/glossary.md"), "utf8")
  f.messages[0] = { ...f.messages[0], id: "msg_change", text: "Propón equipos." }
  await f.call("csdd_write", { artifact: "genesis", operation: "append", data: { sections: { reason_scope: "Cambio.", proposed_change: "Equipos.", impacts: "Vocabulario.", provenance_pending: "Fixture." }, decision: { status: "pending" }, materialization: { stage: "pending" } } })
  await f.call("csdd_write", { artifact: "glossary", operation: "update", data: { terms: [...f.glossary.terms, { term: "Equipo", definition: "Grupo." }] } })
  f.messages[0].text = "Rechazo equipos."
  await f.call("csdd_write", { artifact: "genesis", operation: "update", data: { decision: { status: "rejected", rejected_by: "Tester" }, materialization: { disposition: "abandoned" } } })
  assert.equal(await readFile(join(f.root, "docs/glossary.md"), "utf8"), previous)
})

test("Specs y Roadmap se rechazan incluso fuera del filtro de esquema", async t => {
  const f = await fixture(t)
  for (const artifact of ["specs", "roadmap"]) await assert.rejects(() => f.call("csdd_write", { artifact, operation: "create", data: {} }), /cierre posterior a Mapping/)
})

test("evolución externa de Glossary impide cierre y abandono destructivo", async t => {
  const f = await fixture(t); await f.conform(); await f.approve()
  const external = "# Glosario\n\nTrabajo ajeno.\n"
  await writeFile(join(f.root, "docs/glossary.md"), external)
  await assert.rejects(f.close, /evolución ajena/)
  assert.equal(parseStructure("genesis", await readFile(join(f.root, "docs/base/GENESIS.md"), "utf8")).materialization.stage, "pending")
  assert.equal(await readFile(join(f.root, "docs/glossary.md"), "utf8"), external)
  const pending = await fixture(t)
  await writeFile(join(pending.root, "docs/glossary.md"), external)
  pending.messages[0].text = "Rechazo."
  await assert.rejects(() => pending.call("csdd_write", { artifact: "genesis", operation: "update", data: { decision: { status: "rejected", rejected_by: "Tester" }, materialization: { disposition: "abandoned" } } }), /evolución ajena/)
  assert.equal(await readFile(join(pending.root, "docs/glossary.md"), "utf8"), external)
  await access(join(pending.root, "docs/base/.genesis-recovery-pending"))
})
