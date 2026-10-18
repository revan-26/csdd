import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, unlink } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import test from "node:test"
import plugin from "../plugins/csdd/index.mjs"
import { registerTools } from "../lib/tools.mjs"

async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), "csdd-v2-tools-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  const tools = new Map()
  const runtime = {
    location: { directory: root },
    session: { get: async ({ sessionID }) => ({ id: sessionID, location: { directory: root } }) },
    tool: { transform: async (callback) => { callback({ add: (tool) => tools.set(tool.name, tool) }); return { dispose() {} } } },
  }
  await plugin.setup(runtime)
  const invocation = (agent) => ({ agent, sessionID: "ses_v2_fixture", signal: new AbortController().signal })
  return { root, tools, runtime, invocation }
}

test("plugin V2 registra tools directas con esquemas cerrados y permiso propio", async (context) => {
  const { tools, runtime } = await fixture(context)
  assert.equal(plugin.id, "csdd.genesis")
  assert.deepEqual([...tools.keys()], ["csdd_document", "csdd_revision", "csdd_review", "csdd_write"])
  await registerTools(runtime)
  assert.equal(tools.size, 4, "El transform es repetible sin duplicados")
  for (const tool of tools.values()) {
    assert.equal(tool.input.additionalProperties, false)
    if (tool.name === "csdd_write") assert.deepEqual(tool.input.properties.artifact.enum, ["genesis", "glossary"])
    if (tool.name === "csdd_revision") assert.deepEqual(tool.input.properties.artifact.enum, ["genesis", "specs", "roadmap", "glossary"])
    assert.deepEqual(tool.options, { codemode: false, permission: tool.name })
  }
})

test("Canon escribe y los tres lectores calculan referencias con resultados estructurados", async (context) => {
  const { root, tools, invocation } = await fixture(context)
  const sections = Object.fromEntries(["summary", "intent", "interpretation", "vocabulary", "first_slice", "uncertainties", "next_phase", "provenance", "readiness"].map(key => [key, "Fixture."]))
  const write = await tools.get("csdd_write").execute({ artifact: "genesis", operation: "create", data: { title: "Genesis", sections, decision: { status: "pending" }, materialization: { stage: "pending" } } }, invocation("CSDD-Canon"))
  assert.equal(JSON.parse(write.content).path, "docs/base/GENESIS.md")
  assert.equal(JSON.parse(write.content).status, "written")
  assert.match(await readFile(join(root, "docs/base/GENESIS.md"), "utf8"), /^# Genesis\n/u)
  for (const agent of ["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Reviewer"]) {
    const result = JSON.parse((await tools.get("csdd_revision").execute({ artifact: "genesis" }, invocation(agent))).content)
    assert.match(result.reference, /^sha256:[a-f0-9]{64}$/u)
    assert.equal(result.session_id, "ses_v2_fixture")
    assert.ok(result.observed_at)
  }
})

test("rechaza agentes indebidos incluso fuera del filtro de permisos", async (context) => {
  const { tools, invocation } = await fixture(context)
  for (const agent of ["CSDD-Orchestrator", "CSDD-Reviewer", "CSDD-Explorer", "build", undefined]) {
    await assert.rejects(() => tools.get("csdd_write").execute({ artifact: "specs", content: "# Cambiar\n" }, invocation(agent)), /no autorizado/)
  }
  await assert.rejects(() => tools.get("csdd_revision").execute({ artifact: "specs" }, invocation("CSDD-Explorer")), /no autorizado/)
})

test("resuelve el workspace desde la sesión y falla cerrado ante traslado o contexto incompleto", async (context) => {
  const { root, tools, runtime, invocation } = await fixture(context)
  const other = join(root, "other")
  await mkdir(other)
  runtime.session.get = async ({ sessionID }) => ({ id: sessionID, location: { directory: other } })
  await assert.rejects(() => tools.get("csdd_write").execute({ artifact: "specs", content: "# Otro\n" }, invocation("CSDD-Canon")), /workspace del plugin/)
  runtime.session.get = async () => ({ id: "ses_wrong", location: { directory: root } })
  await assert.rejects(() => tools.get("csdd_write").execute({ artifact: "specs", content: "# Otro\n" }, invocation("CSDD-Canon")), /workspace válido/)
})

test("no inicia escritura si la invocación ya está cancelada", async (context) => {
  const { tools, invocation } = await fixture(context)
  const abort = new AbortController()
  abort.abort()
  await assert.rejects(() => tools.get("csdd_write").execute({ artifact: "specs", content: "# Cancelado\n" }, { ...invocation("CSDD-Canon"), signal: abort.signal }), { name: "AbortError" })
})

test("aprobación se registra desde runtime y otra sesión recupera sin acceso al historial", async context => {
  const { root, tools, runtime, invocation } = await fixture(context)
  const writer = tools.get("csdd_write")
  const canon = invocation("CSDD-Canon")
  const sections = Object.fromEntries(["summary", "intent", "interpretation", "vocabulary", "first_slice", "uncertainties", "next_phase", "provenance", "readiness"].map(key => [key, "Ensayo ficticio acotado."]))
  assert.equal(JSON.parse((await writer.execute({ artifact: "genesis", operation: "create", data: { title: "Genesis", sections, decision: { status: "pending" }, materialization: { stage: "pending" } } }, canon)).content).status, "written")
  const reference = JSON.parse((await tools.get("csdd_revision").execute({ artifact: "genesis" }, canon)).content).reference
  const before = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  const decision = { status: "approved", approved_by: "Smoke Tester" }
  runtime.session.context = async () => []
  await assert.rejects(() => writer.execute({ artifact: "genesis", operation: "update", data: { decision } }, canon), /intervención/)
  assert.equal(await readFile(join(root, "docs/base/GENESIS.md"), "utf8"), before)
  runtime.session.context = async () => [{ type: "user", id: "msg_real", text: `Apruebo ${reference}`, time: { created: 1000 } }]
  await writer.execute({ artifact: "glossary", operation: "create", data: { title: "Glosario", terms: [{ term: "Tarea", definition: "Pendiente." }] } }, canon)
  const reviewer = { ...invocation("CSDD-Reviewer"), sessionID: "ses_reviewer", messageID: "msg_review" }
  await tools.get("csdd_review").execute({ operation: "begin" }, reviewer)
  await tools.get("csdd_review").execute({ operation: "complete", judgment: { verdict: "conforming", summary: "Fixture.", findings: [], semantic_checks: ["intent_fidelity", "preserved_rules"].map(criterion => ({ criterion, verdict: "conforming", evidence: "Fixture determinista." })), limitations: ["No modelo."], recommended_action: "Presentar." } }, reviewer)
  assert.equal(JSON.parse((await writer.execute({ artifact: "genesis", operation: "update", data: { decision } }, canon)).content).status, "written")
  runtime.session.context = () => { throw new Error("No acceder al historial desde recuperación") }
  const newSession = { ...canon, sessionID: "ses_recovery" }
  const recovered = JSON.parse((await tools.get("csdd_revision").execute({ artifact: "genesis" }, newSession)).content)
  assert.equal(recovered.approval_evidence.status, "recorded")
  assert.equal(recovered.approval_evidence.message_id, "msg_real")
  assert.equal(JSON.parse((await writer.execute({ artifact: "genesis", operation: "update", data: { materialization: { stage: "closed" } } }, newSession)).content).status, "written")
  await unlink(join(root, recovered.approval_evidence.path))
  assert.equal(JSON.parse((await tools.get("csdd_revision").execute({ artifact: "genesis" }, newSession)).content).approval_evidence.status, "unavailable")
  await assert.rejects(() => writer.execute({ artifact: "genesis", operation: "update", data: { materialization: { notes: "Otro" } } }, newSession), { code: "ENOENT" })
})
