import assert from "node:assert/strict"
import test from "node:test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import controls from "./focused-controls.mjs"
import { assertReviewReturn, assertNoToolFailures } from "./focused-evaluator.mjs"
import { reviewSchema } from "../lib/reviews.mjs"
import { parseReviewReport, findingSchema, semanticCheckSchema } from "../../common/lib/review-report.mjs"
import { registerTools } from "../lib/tools.mjs"
import { documentSchema } from "../lib/documents.mjs"

function report() {
  const ref = "sha256:" + "a".repeat(64)
  return { status: "completed", review_kind: "semantic", verdict: "non_conforming", summary: "Fixture.",
    findings: [{ severity: "blocking", criterion: "intent_fidelity", evidence: "Equipos frente a individual.", location: "Glossary/Tarea", impact: "Cambio de alcance." }],
    semantic_checks: ["intent_fidelity", "preserved_rules"].map(criterion => ({ criterion, verdict: "non_conforming", evidence: "Contraste de fixture." })),
    limitations: ["Sin modelos."], recommended_action: "Corregir antes de aprobar.",
    artifact_references: { genesis: ref, glossary: ref }, review_reference: "opencode-session:ses_review" }
}

test("esquema publicado declara exactamente los campos internos que valida el reporte", () => {
  assert.deepEqual(reviewSchema.properties.judgment.properties.findings.items, findingSchema)
  assert.deepEqual(reviewSchema.properties.judgment.properties.semantic_checks.items, semanticCheckSchema)
  assert.deepEqual(semanticCheckSchema.required, ["criterion", "verdict", "evidence"])
  assert.equal(semanticCheckSchema.additionalProperties, false)
  assert.equal(findingSchema.additionalProperties, false)
  assert.equal(semanticCheckSchema.properties.result, undefined)
  assert.ok(parseReviewReport(JSON.stringify(report())))
  for (const edit of [r => { r.semantic_checks[0].result = "failed"; delete r.semantic_checks[0].verdict },
    r => { r.findings[0].severity = "high" }, r => { r.findings[0].extra = "alias" },
    r => { r.semantic_checks[0].extra = "alias" }, r => { r.semantic_checks[0].criterion = " " }]) {
    const r = report(); edit(r); assert.equal(parseReviewReport(JSON.stringify(r)), undefined)
  }
})

test("comparación del retorno verifica contenido e identidad sin confundir metadatos", () => {
  const record = { report: report(), path: "docs/base/.review-fixture.json", message_id: "msg_actual", session_id: "ses_review" }
  const returned = { ...record.report, report_path: record.path, review_message_id: record.message_id }
  assertReviewReturn(record, returned)
  for (const edit of [r => { r.report_path = "otra ruta" }, r => { r.review_message_id = "msg_otro" },
    r => { r.summary = "Juicio sustituido" }, r => { r.review_reference = "opencode-session:ses_other" }]) {
    const r = structuredClone(returned); edit(r); assert.throws(() => assertReviewReturn(record, r))
  }
})

async function fixture(t, options) {
  const root = await mkdtemp(join(tmpdir(), "csdd-focused-controls-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const session = new Map(), tool = new Map(), executors = new Map()
  const editor = {
    add: value => executors.set(value.name, { ...value, id: value.name }),
    list: () => [...executors.values()],
    update: (id, update) => update(executors.get(id)),
  }
  const runtime = { options, location: { directory: root },
    session: { get: async ({ sessionID }) => ({ id: sessionID, location: { directory: root } }), hook: async (name, fn) => session.set(name, fn) },
    tool: { hook: async (name, fn) => tool.set(name, fn), transform: async fn => fn(editor) } }
  await registerTools(runtime)
  await controls.setup(runtime)
  return { root, session, tool, executors }
}

test("presupuesto permite ocho llamadas, no nueve; título y retries no gastan modelos", async t => {
  const f = await fixture(t)
  const title = {}; f.session.get("title")(title); assert.equal(title.result, "Focused review")
  const retry = { decision: { retry: true } }; f.session.get("retry")(retry); assert.equal(retry.decision.retry, false)
  for (let i = 0; i < 8; i++) await f.session.get("context")({ options: {} })
  await assert.rejects(() => f.session.get("context")({ options: {} }), /ocho llamadas/)
  assert.equal(JSON.parse(await readFile(join(f.root, "call-count.json"))).calls, 8)
})

test("presupuesto explícito de diez bloquea once sin cambiar el predeterminado de ocho", async t => {
  const f = await fixture(t, { maxCalls: 10 })
  for (let i = 0; i < 10; i++) await f.session.get("context")({ options: {} })
  await assert.rejects(() => f.session.get("context")({ options: {} }), /diez llamadas/)
  assert.equal(JSON.parse(await readFile(join(f.root, "call-count.json"))).calls, 10)
})

test("excepción real CSDD sin execute.after impide escritura posterior y llamada de modelo", async t => {
  const f = await fixture(t)
  const context = { agent: "CSDD-Canon", sessionID: "ses_probe", messageID: "msg_probe", signal: new AbortController().signal }
  const document = f.executors.get("csdd_document")
  await f.session.get("context")({ options: {} })
  // Reproduce el intento original directamente: no se emite el hook after.
  await assert.rejects(() => document.execute({ operation: "inspect", path: "docs/base/GENESIS.md" }, context), /Ruta no admitida/)
  await assert.rejects(() => document.execute({ operation: "report", path: "docs/support/probe.md", expected_reference: "absent",
    data: { title: "No escribir", sections: [{ heading: "Hallazgo", text: "No debe persistirse" }], sources: ["fixture"] } }, context), /primer error/)
  await assert.rejects(() => f.executors.get("csdd_revision").execute({ artifact: "genesis" }, context), /primer error/)
  await assert.rejects(() => f.session.get("context")({ options: {} }), /primer error/)
  await assert.rejects(() => readFile(join(f.root, "docs/support/probe.md")), { code: "ENOENT" })
  const first = JSON.parse(await readFile(join(f.root, "first-tool-error.json")))
  assert.equal(first.tool, "csdd_document")
  assert.equal(first.message_id, "msg_probe")
  assert.match(first.error.message, /Ruta no admitida/)
  assert.equal(JSON.parse(await readFile(join(f.root, "call-count.json"))).calls, 1)
})

test("esquema de rutas rechaza Genesis/Glossary también para inspect y permite informes nuevos", () => {
  const path = new RegExp(documentSchema.properties.path.pattern, "u")
  for (const value of ["docs/base/GENESIS.md", "docs/glossary.md", "docs/../outside.md", "docs/support/nested/report.md"]) assert.equal(path.test(value), false)
  for (const value of ["docs/support/report.md", "docs/base/ONTOLOGY.md", "docs/contracts/example/contract.md"]) assert.equal(path.test(value), true)
})

test("primer error de herramienta bloquea siguiente herramienta y llamada antes de reparar", async t => {
  const f = await fixture(t)
  await f.session.get("context")({ options: {} })
  await f.tool.get("execute.after")({ status: "completed", tool: "read" })
  f.tool.get("execute.before")({})
  await f.tool.get("execute.after")({ status: "error", tool: "csdd_review", sessionID: "ses_review", messageID: "msg_first", error: { message: "Entrada inválida" } })
  assert.throws(() => f.tool.get("execute.before")({}), /primer error/)
  await assert.rejects(() => f.session.get("context")({ options: {} }), /primer error/)
  const error = JSON.parse(await readFile(join(f.root, "first-tool-error.json")))
  assert.equal(error.message_id, "msg_first")
  assert.equal(JSON.parse(await readFile(join(f.root, "call-count.json"))).calls, 1)
  assertNoToolFailures([{ messages: [{ content: [{ type: "tool", name: "read", state: { status: "completed" } }] }] }])
  assert.throws(() => assertNoToolFailures([{ messages: [{ content: [{ type: "tool", name: "read", state: { status: "error" } }] }] }]))
})
