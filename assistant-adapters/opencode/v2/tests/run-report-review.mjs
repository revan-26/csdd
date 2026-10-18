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

const evidence = resolve("tests/evidence/prompt-review-report")
await mkdir(evidence)
const binary = process.env.CSDD_RUNTIME_BIN
assert.ok(binary)
assert.match(spawnSync(binary, ["--version"], { encoding: "utf8" }).stdout, /v2\.0\.22\b/u)
const zip = resolve("dist", distributionArchive)
const digest = createHash("sha256").update(await readFile(zip)).digest("hex")
assert.equal(digest, (await readFile(zip + ".sha256", "utf8")).trim().split(/\s/u)[0])
const container = await mkdtemp("C:/Users/Michael/AppData/Local/Temp/opencode/csdd-report-review-")
const { project: root } = await installDistribution(container, zip)
const source = "# Fuente ficticia\nEl README del legado describe aprobación del dueño antes de publicar cambios. No se inspeccionó código ni se ejecutaron pruebas.\n"
const report = "# Informe consultivo\nLa documentación del legado describe aprobación del dueño antes de publicar cambios. Esto demuestra que la implementación funciona y sus pruebas pasan. Esa regla queda aprobada para el producto nuevo.\n"
await mkdir(join(root, "docs/support"), { recursive: true })
await writeFile(join(root, "docs/support/source.md"), source)
await writeFile(join(root, "docs/support/report.md"), report)
const prompt = "Revisa docs/support/report.md contra docs/support/source.md. La persona solo pidió investigar el antecedente; todavía no decidió adoptar reglas del legado. Devuelve los defectos materiales del informe, su evidencia y las correcciones necesarias."
await writeFile(join(evidence, "criteria.json"), JSON.stringify({ prompt, source, report, archive_sha256: digest, max_calls: 8, timeout_ms: 180000, estimate: { input: "5000–15000", output: "500–2000" }, expected: "Reviewer lee informe/fuente, detecta verificación no sustentada y adopción no aprobada. No exige Genesis/Glossary ni llama csdd_review ni escribe ni delega. No hay aclaraciones o permisos previstos: detener si aparecen." }, null, 2))
const configPath = join(root, ".opencode/opencode.json")
const config = JSON.parse(await readFile(configPath, "utf8"))
config.compaction = { auto: false }
config.plugins.push("./plugins/review-budget")
await mkdir(join(root, ".opencode/plugins/review-budget"))
await cp(new URL("./focused-controls.mjs", import.meta.url), join(root, ".opencode/plugins/review-budget/index.mjs"))
await writeFile(join(root, ".opencode/plugins/review-budget/package.json"), JSON.stringify({ name: "review-budget", type: "module", main: "index.mjs" }))
await writeFile(configPath, JSON.stringify(config))
let server, session, family, error, start, elapsed, timer
const cleanup = []
try {
  server = await startServer(root, { program: binary })
  const deadline = Date.now() + 30000
  while (true) {
    const agents = await server.api("/api/agent")
    const plugins = await server.api("/api/plugin")
    if (agents.some(a => a.id === "CSDD-Reviewer") && JSON.stringify(plugins).includes("csdd.test.focused-budget")) break
    if (Date.now() > deadline) throw new Error("Perfil o control no cargado; cero llamadas al modelo")
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  await writeFile(join(evidence, "preflight.json"), JSON.stringify({ runtime: "2.0.22", genesis_absent: true, report_and_source_prepared: true, controls_loaded: true }))
  session = await server.api("/api/session", "POST", { title: "CSDD report review without Genesis", agent: "CSDD-Reviewer", model: { providerID: "openai", id: "gpt-6.1-sol" }, location: { directory: root } })
  start = Date.now()
  await Promise.race([(async () => {
    await server.api(`/api/session/${session.id}/prompt`, "POST", { text: prompt })
    while (true) {
      assert.deepEqual(await server.api("/api/permission/request"), [], "Permiso no previsto; detener")
      const current = await server.api(`/api/session/${session.id}`)
      if (current.outcome === "succeeded") break
      if (current.outcome === "failed") throw new Error("Sesión falló; no reparar")
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  })(), new Promise((_, reject) => { timer = setTimeout(() => { server.stop(); reject(new Error("Límite de tres minutos")) }, 180000) })])
  elapsed = Date.now() - start; clearTimeout(timer)
  family = await sessionFamily(server, session.id)
  assert.equal(family.length, 1)
  assertNoToolFailures(family)
  const tools = toolParts(family[0].messages)
  assert.ok(tools.every(p => ["read", "glob", "grep"].includes(p.name)), "Solo inspección, sin revisión Genesis ni escritura")
  for (const path of ["docs/support/source.md", "docs/support/report.md"]) {
    assert.ok(tools.some(p => p.name === "read" && p.state?.status === "completed" && p.state.input.path.replaceAll("\\", "/").endsWith(path)), "Fuente leída: " + path)
  }
  assert.equal(await readFile(join(root, "docs/support/source.md"), "utf8"), source)
  assert.equal(await readFile(join(root, "docs/support/report.md"), "utf8"), report)
  assert.deepEqual(await readdir(join(root, "docs")), ["support"])
  assert.deepEqual((await readdir(join(root, "docs/support"))).sort(), ["report.md", "source.md"])
} catch (caught) { error = String(caught) }
finally {
  clearTimeout(timer)
  elapsed ??= start ? Date.now() - start : null
  if (!family && server && session) try { family = await sessionFamily(server, session.id) } catch {}
  if (family) await writeFile(join(evidence, "transcript.json"), JSON.stringify(family, null, 2))
  let calls
  try { calls = JSON.parse(await readFile(join(root, "call-count.json"), "utf8")).calls } catch {}
  if (server && session) try { await server.api(`/api/session/${session.id}`, "DELETE"); cleanup.push("root_deleted") } catch (caught) { cleanup.push(String(caught)) }
  server?.stop()
  const result = { status: error ? "stopped" : "awaiting_semantic_adjudication", error, archive_sha256: digest, session_id: session?.id, calls, active_elapsed_ms: elapsed, usage: family?.map(s => ({ session_id: s.info.id, tokens: s.info.tokens, cost: s.info.cost })), cleanup }
  await writeFile(join(evidence, "result.json"), JSON.stringify(result, null, 2))
  await rm(container, { recursive: true, force: true })
  console.log(JSON.stringify(result, null, 2))
}
