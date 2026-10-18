import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, writeFile, cp } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"
import { pathToFileURL } from "node:url"
import { installDistribution } from "./install-distribution.mjs"
import { distributionArchive } from "../build/release.mjs"
import { startServer } from "./runtime-support.mjs"
import { waitSession } from "./wait-session.mjs"
import { sessionFamily, recordedReviewReports } from "./transcript.mjs"
import { writeStructuredArtifact, parseStructure } from "../../common/lib/structured-write.mjs"
import { reviewRecords, currentReview } from "../lib/reviews.mjs"
import { prepareAdministration } from "../lib/administration.mjs"
import { assertReviewReturn, assertNoToolFailures } from "./focused-evaluator.mjs"

const source = resolve(fileURLToPath(new URL("../../../../", import.meta.url)))
const binary = process.env.CSDD_RUNTIME_BIN
assert.ok(binary, "Seleccionar CSDD_RUNTIME_BIN aislado; no usar ni cambiar instalaciones globales")
const version = spawnSync(binary, ["--version"], { encoding: "utf8" })
assert.equal(version.status, 0)
assert.match(version.stdout, /(?:^|\s)v?2\.0\.22(?:\s|$)/u)
const archive = join(source, "dist", distributionArchive)
const expectedHash = (await readFile(archive + ".sha256", "utf8")).trim().split(/\s+/u)[0]
assert.equal(createHash("sha256").update(await readFile(archive)).digest("hex"), expectedHash)
const container = await mkdtemp("C:/Users/Michael/AppData/Local/Temp/opencode/csdd-focused-review-")
console.log(JSON.stringify({ evidence_directory: container, max_calls: 8, timeout_ms: 180000 }))
const distribution = await installDistribution(container, archive)
const root = distribution.project
// Mismo contenido y expectativa de focused-review-1; solo cambian controles/evaluador.
const intent = "Ensayo ficticio. Quiero conservar mis tareas personales en un único dispositivo. Tarea significa pendiente con descripción. El primer incremento registra una descripción no vacía y permite reencontrar la tarea al cerrar normalmente y volver a abrir. Sin cuentas, equipos, colaboración, sincronización ni integraciones. Completar tareas queda diferido. No elijas tecnología ni implementes."
const genesis = { title: "GENESIS — Tareas personales", sections: {
  summary: "Conservar tareas personales en un único dispositivo, sin equipos ni colaboración.",
  intent, interpretation: "Uso exclusivamente individual. Registrar tareas con descripción no vacía y reencontrarlas tras cierre normal y reapertura en el mismo dispositivo. Se excluyen cuentas, equipos, colaboración, sincronización e integraciones.",
  vocabulary: "Tarea: pendiente con descripción. Descripción no vacía: condición para registrar una tarea.",
  first_slice: "Registrar una tarea con descripción no vacía y reencontrarla después de cerrar normalmente y reabrir. Criterio previsto, no prueba ejecutada.",
  uncertainties: "No se decide tratamiento de solo espacios, recuperación ante fallos ni respaldo. Completar tareas queda diferido.",
  next_phase: "No se autoriza iniciar otro componente ni implementar.",
  provenance: "Fixture ficticia preparada por código; no es proyecto real ni aprobación humana.", readiness: "Candidato suficiente para revisar intención y vocabulario; todavía pendiente de aprobación.",
}, decision: { status: "pending" }, materialization: { stage: "pending" } }
const glossary = { title: "Glosario — Tareas", terms: [
  { term: "Tarea", definition: "Pendiente con descripción que los miembros de un equipo pueden registrar y consultar de forma compartida." },
  { term: "Descripción no vacía", definition: "Condición para registrar una tarea." },
] }
const criteria = { version: "focused-review-1", evaluator_version: "focused-evaluator-2", scenario: "glossary-introduces-teams", intent, max_calls: 8, timeout_ms: 180000,
  expected: "Un reporte real non_conforming identifica que la definición de Tarea introduce equipos/consulta compartida, contraria al uso individual y exclusiones de Genesis; cita ubicaciones y explica la pérdida de fidelidad. No se exigen frases literales.",
  invariants: ["Genesis y Glossary intactos", "Una sesión Reviewer, sin delegación", "Sin aprobación ni cierre", "Reporte vinculado a las versiones revisadas", "Sin reparaciones o reintentos"],
  estimate: { input: "10000–30000", output: "1000–3000", monetary_price: "No acreditado" } }
await writeFile(join(container, "criteria.json"), JSON.stringify(criteria, null, 2))
await writeStructuredArtifact(root, { artifact: "genesis", operation: "create", data: genesis })
await writeStructuredArtifact(root, { artifact: "glossary", operation: "create", data: glossary })
const before = { genesis: await readFile(join(root, "docs/base/GENESIS.md"), "utf8"), glossary: await readFile(join(root, "docs/glossary.md"), "utf8") }
await writeFile(join(container, "fixture-before.json"), JSON.stringify(before, null, 2))
const configPath = join(root, ".opencode/opencode.json")
const config = JSON.parse(await readFile(configPath, "utf8"))
config.compaction = { auto: false }
config.plugins.push("./plugins/focused-budget")
await writeFile(configPath, JSON.stringify(config))
const pluginPath = join(root, ".opencode/plugins/focused-budget")
await mkdir(pluginPath)
await writeFile(join(pluginPath, "package.json"), JSON.stringify({ name: "focused-budget", type: "module", main: "index.mjs" }))
await cp(new URL("./focused-controls.mjs", import.meta.url), join(pluginPath, "index.mjs"))
// Verificar el control instalado sin modelos en directorios de preflight separados.
const budget = (await import(pathToFileURL(join(pluginPath, "index.mjs")))).default
async function controlFixture(name) {
  const directory = join(container, name); await mkdir(directory)
  const session = new Map(), tool = new Map()
  await budget.setup({ location: { directory }, session: { hook: async (name, fn) => session.set(name, fn) }, tool: { hook: async (name, fn) => tool.set(name, fn) } })
  return { session, tool }
}
const bounded = await controlFixture("preflight-budget")
for (let i = 0; i < 8; i++) await bounded.session.get("context")({ options: {} })
await assert.rejects(() => bounded.session.get("context")({ options: {} }), /ocho llamadas/)
const retry = { decision: { retry: true } }; bounded.session.get("retry")(retry); assert.equal(retry.decision.retry, false)
const terminal = await controlFixture("preflight-error")
await terminal.tool.get("execute.after")({ status: "error", tool: "read", sessionID: "ses_preflight", messageID: "msg_preflight", error: { message: "Fallo simulado de control, no del producto" } })
assert.throws(() => terminal.tool.get("execute.before")({}), /primer error/)
await assert.rejects(() => terminal.session.get("context")({ options: {} }), /primer error/)
await writeFile(join(container, "preflight.json"), JSON.stringify({ archive_sha256: expectedHash, budget_checked_without_model: true, retries_disabled: true, stop_on_first_tool_error_checked: true, fixture_structurally_valid: true, runtime_version: version.stdout.trim() }, null, 2))
let server, session, family, error, activeStarted, activeElapsed, timer
try {
  server = await startServer(root, { program: binary })
  const deadline = Date.now() + 30000
  let ready = false
  while (Date.now() < deadline) {
    const plugins = await server.api("/api/plugin")
    const agents = await server.api("/api/agent")
    if (JSON.stringify(plugins).includes("csdd.test.focused-budget") && agents.some(agent => agent.id === "CSDD-Reviewer")) { ready = true; break }
    await delay(100)
  }
  assert.ok(ready, "El runtime no confirmó perfil y controles")
  session = await server.api("/api/session", "POST", { title: "Focused Genesis/Glossary review", agent: "CSDD-Reviewer", model: { providerID: "openai", id: "gpt-6.1-sol" }, location: { directory: root } })
  await writeFile(join(container, "session.json"), JSON.stringify(session, null, 2))
  activeStarted = Date.now()
  const execution = async () => {
    await server.api("/api/session/" + session.id + "/prompt", "POST", { text: "component: GENESIS\nobjective: Revisión independiente y acotada del candidato Genesis y Glossary contra la intención de origen. No aprobar, cerrar, corregir ni delegar. No investigar externamente.\nIntención literal de la fixture: " + intent + "\nFuentes: docs/base/GENESIS.md y docs/glossary.md. Usa csdd_review begin, lee ambos snapshots locales completos y registra el juicio con complete, incluyendo intent_fidelity y preserved_rules. Evalúa el significado sin frases obligatorias; si falta evidencia decláralo. Finaliza al registrar el reporte." })
    await waitSession(server, session.id, Math.max(1, 180000 - (Date.now() - activeStarted)))
  }
  await Promise.race([execution(), new Promise((_, reject) => {
    timer = setTimeout(() => { server.stop(); reject(new Error("Límite de tres minutos: ensayo detenido sin reintento")) }, 180000)
  })])
  activeElapsed = Date.now() - activeStarted; clearTimeout(timer)
  family = await sessionFamily(server, session.id)
  assert.equal(family.length, 1, "No se autorizó delegar")
  assertNoToolFailures(family)
  assert.equal(family[0].info.outcome, "succeeded", "Sesión no completada")
  const records = await reviewRecords(root)
  assert.equal(records.length, 1, "Se esperaba exactamente un juicio persistido")
  const observed = recordedReviewReports(family[0])
  assert.equal(observed.length, 1)
  assertReviewReturn(records[0], observed[0].report)
  assert.equal(records[0].report.verdict, "non_conforming")
  assert.equal(records[0].session_id, session.id)
  assert.equal(await readFile(join(root, "docs/base/GENESIS.md"), "utf8"), before.genesis)
  assert.equal(await readFile(join(root, "docs/glossary.md"), "utf8"), before.glossary)
  assert.equal(parseStructure("genesis", before.genesis).decision.status, "pending")
  assert.equal(parseStructure("genesis", before.genesis).materialization.stage, "pending")
  await assert.rejects(() => currentReview(root, "semantic"), /No existe revisión/)
  await assert.rejects(() => prepareAdministration({}, root, {}, { artifact: "genesis", operation: "update", data: { materialization: { stage: "closed" } } }, { status: "pending" }), /No existe revisión/)
  await writeFile(join(container, "review-report.json"), JSON.stringify(records[0].report, null, 2))
} catch (caught) {
  error = String(caught)
  clearTimeout(timer)
  if (server && session && !family) { try { family = await sessionFamily(server, session.id) } catch {} }
} finally {
  clearTimeout(timer)
  activeElapsed ??= activeStarted ? Date.now() - activeStarted : null
  if (family) await writeFile(join(container, "transcript.json"), JSON.stringify(family, null, 2))
  let callCount, firstToolError
  try { callCount = JSON.parse(await readFile(join(root, "call-count.json"), "utf8")).calls } catch {}
  try { firstToolError = JSON.parse(await readFile(join(root, "first-tool-error.json"), "utf8")) } catch {}
  const result = { status: error ? "stopped" : "awaiting_semantic_adjudication", error, first_tool_error: firstToolError, archive_sha256: expectedHash, scenario: criteria.scenario, evaluator_version: criteria.evaluator_version, model: "openai/gpt-6.1-sol", runtime: "2.0.22", session_id: session?.id, calls: callCount, active_elapsed_ms: activeElapsed,
    usage: family?.map(child => ({ session_id: child.info.id, tokens: child.info.tokens, cost: child.info.cost })), code_checks_passed: !error }
  await writeFile(join(container, "result.json"), JSON.stringify(result, null, 2))
  server?.stop()
  console.log(JSON.stringify({ container, ...result }, null, 2))
}
