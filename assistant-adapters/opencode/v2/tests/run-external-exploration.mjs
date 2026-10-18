import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, writeFile, cp, rm, readdir } from "node:fs/promises"
import { join, resolve } from "node:path"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { installDistribution } from "./install-distribution.mjs"
import { distributionArchive } from "../build/release.mjs"
import { startServer } from "./runtime-support.mjs"
import { sessionFamily, toolParts } from "./transcript.mjs"
import { assertNoToolFailures } from "./focused-evaluator.mjs"

const evidence = resolve("tests/evidence", process.argv[2] ?? "external-exploration-fix")
await mkdir(evidence) // Nunca sobrescribir un intento anterior.
const binary = process.env.CSDD_RUNTIME_BIN
assert.ok(binary)
assert.match(spawnSync(binary, ["--version"], { encoding: "utf8" }).stdout, /v2\.0\.22\b/u)
const zip = resolve("dist", distributionArchive)
const digest = createHash("sha256").update(await readFile(zip)).digest("hex")
assert.equal(digest, (await readFile(zip + ".sha256", "utf8")).trim().split(/\s/u)[0])
const container = await mkdtemp("C:/Users/Michael/AppData/Local/Temp/opencode/csdd-external-exploration-")
const { project: root } = await installDistribution(container, zip)
const external = join(container, "reference-outside-workspace")
await mkdir(external)
const reference = join(external, "README.md")
const contents = "# Referencia anterior ficticia\nLas colecciones públicas admiten cambios de colaboradores. Los cambios quedan pendientes hasta la aprobación del dueño. No hay evidencia de pruebas ejecutadas.\n"
await writeFile(reference, contents)
const naturalRetry = process.argv[3] === "natural-retry"
const prompt = naturalRetry
  ? `Antes Canon informó Permission denied: external_directory al explorar el legado; después se dijo que el entorno no tenía una herramienta para solicitar permiso, sin intentar leer. La configuración y las instrucciones ya se actualizaron. Reintenta la exploración de ${reference}. Solo necesito saber qué regla describe ese archivo y qué no podemos afirmar a partir de él. No redactes documentos de producto ni ejecutes código.`
  : `Caso ficticio. Un encargo anterior de explorar esta referencia se dirigió a Canon y quedó bloqueado por external_directory. Reintenta ahora la exploración: lee únicamente ${reference} en su ubicación externa original y dime qué regla describe y qué no podemos afirmar. Solo investigación, no redactar Genesis ni otros documentos, no copiar la referencia ni ejecutar comandos. El runtime podrá solicitar permiso de lectura para esta referencia; la fixture autoriza exclusivamente esa frontera. Finaliza al devolver los hallazgos.`
await writeFile(join(evidence, "criteria.json"), JSON.stringify({ prompt, reference, contents, archive_sha256: digest, max_calls: 8, timeout_ms: 180000, estimate: { input: "5000–30000", output: "500–3000" }, expected: "Orchestrator delega investigación a Explorer, no Canon. Explorer solicita permiso externo y lee referencia sin copiarla; regla y ausencia de evidencia se comunican fielmente.", permission_fixture: "Responder once solo a external_directory para reference-outside-workspace/* de la sesión Explorer hija; cualquier otra solicitud detiene. No habilita permisos persistentes ni fuentes reales." }, null, 2))
const configPath = join(root, ".opencode/opencode.json")
const config = JSON.parse(await readFile(configPath, "utf8"))
config.compaction = { auto: false }
config.plugins.push("./plugins/external-budget")
await mkdir(join(root, ".opencode/plugins/external-budget"))
await cp(new URL("./focused-controls.mjs", import.meta.url), join(root, ".opencode/plugins/external-budget/index.mjs"))
await writeFile(join(root, ".opencode/plugins/external-budget/package.json"), JSON.stringify({ name: "external-budget", type: "module", main: "index.mjs" }))
await writeFile(configPath, JSON.stringify(config))
let server, session, family, error, start, elapsed, timer
const approvals = [], cleanup = []
const normalized = value => value.replaceAll("\\", "/").toLowerCase()
try {
  server = await startServer(root, { program: binary })
  let agents
  const agentsDeadline = Date.now() + 30000
  while (true) {
    agents = await server.api("/api/agent")
    if (["CSDD-Orchestrator", "CSDD-Explorer"].every(id => agents.some(a => a.id === id))) break
    if (Date.now() > agentsDeadline) throw new Error("Perfiles no cargados; cero llamadas al modelo")
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  const explorer = agents.find(a => a.id === "CSDD-Explorer")
  const orchestrator = agents.find(a => a.id === "CSDD-Orchestrator")
  const effect = (agent, action, resource) => agent.permissions.filter(p => (p.action === "*" || p.action === action) && (p.resource === "*" || p.resource === resource)).at(-1)?.effect
  assert.equal(effect(explorer, "external_directory", external + "/*"), "ask")
  for (const action of ["read", "glob", "grep"]) assert.equal(effect(explorer, action, "*"), "allow")
  for (const action of ["edit", "shell", "subagent", "csdd_document"]) assert.equal(effect(explorer, action, "*"), "deny")
  assert.equal(effect(orchestrator, "subagent", "CSDD-Explorer"), "allow")
  const schema = await server.api("/openapi.json")
  assert.ok(schema.paths["/api/session/{sessionID}/permission/{requestID}/reply"].post)
  const deadline = Date.now() + 30000
  while (!JSON.stringify(await server.api("/api/plugin")).includes("csdd.test.focused-budget")) {
    if (Date.now() > deadline) throw new Error("Control no cargado")
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  await writeFile(join(evidence, "preflight.json"), JSON.stringify({ actual_runtime: "2.0.22", explorer_external: "ask", explorer_edit_shell_delegate_write: "deny", orchestrator_explorer: "allow", no_model_calls: true }, null, 2))
  session = await server.api("/api/session", "POST", { title: "CSDD external exploration fix", agent: "CSDD-Orchestrator", model: { providerID: "openai", id: "gpt-6.1-sol" }, location: { directory: root } })
  start = Date.now()
  await Promise.race([(async () => {
    await server.api(`/api/session/${session.id}/prompt`, "POST", { text: prompt })
    while (Date.now() - start < 180000) {
      const requests = await server.api("/api/permission/request")
      for (const request of requests) {
        const child = await server.api(`/api/session/${request.sessionID}`)
        assert.equal(child.parentID, session.id, "No responder permisos de otras sesiones")
        assert.equal(child.agent, "CSDD-Explorer")
        assert.equal(request.action, "external_directory")
        assert.ok(request.resources.length > 0 && request.resources.every(r => normalized(r) === normalized(external + "/*")), "Permiso fuera de frontera autorizada")
        approvals.push({ ...request, fixture_decision: "once" })
        await writeFile(join(evidence, "permissions.json"), JSON.stringify(approvals, null, 2))
        await server.api(`/api/session/${request.sessionID}/permission/${request.id}/reply`, "POST", { decision: "once" })
      }
      const all = await server.api("/api/session?limit=1000")
      const members = all.filter(s => s.id === session.id || s.parentID === session.id)
      if (members.length > 1 && members.every(s => s.outcome === "succeeded")) break
      if (members.some(s => s.outcome === "failed")) throw new Error("Sesión falló; no reparar")
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  })(), new Promise((_, reject) => { timer = setTimeout(() => { server.stop(); reject(new Error("Límite de tres minutos")) }, 180000) })])
  elapsed = Date.now() - start; clearTimeout(timer)
  family = await sessionFamily(server, session.id)
  assert.equal(family.length, 2)
  assert.equal(family.find(s => s.info.id !== session.id).info.agent, "CSDD-Explorer")
  assertNoToolFailures(family)
  assert.ok(family.every(s => s.info.outcome === "succeeded"))
  assert.ok(approvals.length > 0, "Debe ejercitar permiso externo real")
  const explorerSession = family.find(s => s.info.agent === "CSDD-Explorer")
  assert.ok(toolParts(explorerSession.messages).some(p => p.name === "read" && p.state?.status === "completed" && normalized(p.state.input.path) === normalized(reference)), "Explorer debe leer realmente la fuente original")
  assert.equal(await readFile(reference, "utf8"), contents)
  assert.deepEqual((await readdir(root)).sort(), [".csdd", ".opencode", "call-count.json"].sort(), "Sin copias ni documentos producto")
} catch (caught) { error = String(caught) }
finally {
  clearTimeout(timer)
  elapsed ??= start ? Date.now() - start : null
  if (!family && server && session) try { family = await sessionFamily(server, session.id) } catch {}
  if (family) await writeFile(join(evidence, "transcript.json"), JSON.stringify(family, null, 2))
  let calls
  try { calls = JSON.parse(await readFile(join(root, "call-count.json"), "utf8")).calls } catch {}
  if (server && session) try { await server.api(`/api/session/${session.id}`, "DELETE"); cleanup.push("root_and_children_deleted") } catch (caught) { cleanup.push(String(caught)) }
  server?.stop()
  const result = { status: error ? "stopped" : "awaiting_semantic_adjudication", error, archive_sha256: digest, session_id: session?.id, calls, active_elapsed_ms: elapsed, approvals: approvals.length, usage: family?.map(s => ({ session_id: s.info.id, tokens: s.info.tokens, cost: s.info.cost })), cleanup }
  await writeFile(join(evidence, "result.json"), JSON.stringify(result, null, 2))
  await rm(container, { recursive: true, force: true })
  console.log(JSON.stringify(result, null, 2))
}
