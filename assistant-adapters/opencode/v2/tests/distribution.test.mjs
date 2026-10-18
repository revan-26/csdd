import assert from "node:assert/strict"
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import test from "node:test"
import { buildZip } from "../build/distribution.mjs"
import { distributionName, distributionVersion, opencodeBaseline } from "../build/release.mjs"
import { startServer } from "./runtime-support.mjs"
import { setTimeout as delay } from "node:timers/promises"

function install(bat, target, cwd) {
  return spawnSync(process.env.ComSpec, ["/d", "/c", `""${bat}" "${target}""`], { cwd, encoding: "utf8", timeout: 30_000, windowsVerbatimArguments: true })
}

test("ZIP instala por BAT; plugin funciona sin paquetes externos ni Node/npm en PATH", { skip: process.platform !== "win32", timeout: 180_000 }, async context => {
  const root = await mkdtemp(join(tmpdir(), "csdd-distribution-"))
  let server
  context.after(async () => { server?.stop(); await rm(root, { recursive: true, force: true }) })
  const zipCandidate = process.env.CSDD_DISTRIBUTION_ZIP
  const { zip, sha256 } = zipCandidate
    ? { zip: zipCandidate, sha256: (await readFile(zipCandidate + ".sha256", "utf8")).trim().split(/\s+/u)[0] }
    : await buildZip(join(root, "dist"))
  assert.equal(createHash("sha256").update(await readFile(zip)).digest("hex"), sha256)
  const extracted = join(root, "Paquete con espacios á")
  const ps = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${extracted}'`], { encoding: "utf8" })
  assert.equal(ps.status, 0, ps.stderr)
  const payload = join(extracted, distributionName)
  const manifest = JSON.parse(await readFile(join(payload, "MANIFEST.json"), "utf8"))
  assert.equal(manifest.version, distributionVersion)
  assert.equal(manifest.integration, "opencode2")
  assert.equal(manifest.opencode, opencodeBaseline)
  assert.match(await readFile(join(payload, "VERSION"), "utf8"), /CSDD 0\.1\.0 candidate\nIntegration: OpenCode V2\nOpenCode baseline: 2\.0\.22/u)
  for (const [path, digest] of Object.entries(manifest.files)) assert.equal(createHash("sha256").update(await readFile(join(payload, path))).digest("hex"), digest, path)
  const target = join(root, "Proyecto con espacios é !")
  await mkdir(target)
  await writeFile(join(target, "README.md"), "Trabajo ajeno\n")
  const bat = join(payload, "instalar.bat")
  const installed = install(bat, target, root)
  assert.equal(installed.status, 0, installed.stderr + installed.stdout)
  assert.equal(await readFile(join(target, "README.md"), "utf8"), "Trabajo ajeno\n")
  for (const path of ["docs", ".opencode/node_modules", ".opencode/package.json"]) await assert.rejects(() => access(join(target, path)), { code: "ENOENT" })
  assert.equal(install(bat, target, root).status, 1, "No sobrescribir una instalación")
  assert.equal(install(bat, join(root, "inexistente"), root).status, 1)
  await rm(join(payload, "assistant-adapters/opencode-v2/agents/CSDD-Canon.md"))
  const untouched = join(root, "Sin cambios")
  await mkdir(untouched)
  assert.equal(install(bat, untouched, root).status, 1)
  await assert.rejects(() => access(join(untouched, ".csdd")), { code: "ENOENT" })

  // Plugin diagnóstico sin imports npm: usa contexto real del host y executors
  // registrados, no llama al modelo ni acredita todavía su dispatch agentic.
  await mkdir(join(target, ".opencode/plugins/probe"))
  await writeFile(join(target, ".opencode/plugins/probe/package.json"), JSON.stringify({ name: "probe", type: "module", main: "./index.mjs" }))
  const probe = join(target, ".opencode/plugins/probe/index.mjs")
  await cp(new URL("./focused-controls.mjs", import.meta.url), join(target, ".opencode/plugins/probe/controls.mjs"))
  await writeFile(probe, `import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import controls from "./controls.mjs"
export default { id: "csdd.test.distribution", async setup(ctx) {
  try {
  const tools = await ctx.tool.list()
  const session = await ctx.session.create({ agent: "CSDD-Canon", title: "Distribution probe" })
  try {
    const invocation = { sessionID: session.id, agent: "CSDD-Canon", signal: new AbortController().signal }
    const sections = Object.fromEntries(["summary", "intent", "interpretation", "vocabulary", "first_slice", "uncertainties", "next_phase", "provenance", "readiness"].map(key => [key, "Prueba de distribución."]))
    const written = await tools.find(t => t.id === "csdd_write").execute({ artifact: "genesis", operation: "create", data: { title: "Genesis", sections, decision: { status: "pending" }, materialization: { stage: "pending" } } }, invocation)
    const revision = await tools.find(t => t.id === "csdd_revision").execute({ artifact: "genesis" }, invocation)
    let denied = false
    try { await tools.find(t => t.id === "csdd_write").execute({ artifact: "specs", content: "# No\\n" }, { ...invocation, agent: "CSDD-Reviewer" }) } catch { denied = true }
    // Reproducir sin modelos la excepción real y el intento posterior de escritura.
    // Registro tardío deliberado: list() debe entregar los executors transformados.
    await controls.setup(ctx)
    const guarded = await ctx.tool.list()
    const document = guarded.find(t => t.id === "csdd_document")
    let routeError, continuationError
    try { await document.execute({ operation: "inspect", path: "docs/base/GENESIS.md" }, invocation) } catch (error) { routeError = String(error) }
    try { await document.execute({ operation: "report", path: "docs/support/forbidden-after-error.md", expected_reference: "absent", data: { title: "Probe", sections: [{ heading: "Probe", text: "No escribir" }], sources: ["fixture"] } }, invocation) } catch (error) { continuationError = String(error) }
    await writeFile(join(ctx.location.directory, "distribution-probe.json"), JSON.stringify({ written, revision, denied, routeError, continuationError }))
  } finally { await ctx.session.remove({ sessionID: session.id }) }
  } catch (error) { await writeFile(join(ctx.location.directory, "distribution-probe.json"), JSON.stringify({ error: String(error), stack: error.stack })) }
}}
`)
  const configPath = join(target, ".opencode/opencode.json")
  const config = JSON.parse(await readFile(configPath, "utf8"))
  config.plugins.push("./plugins/probe")
  await writeFile(configPath, JSON.stringify(config))
  const binary = process.env.CSDD_RUNTIME_BIN ?? join(process.env.APPDATA, "npm/node_modules/@opencode/cli/bin/opencode.exe")
  await access(binary)
  const version = spawnSync(binary, ["--version"], { encoding: "utf8" })
  assert.match(version.stdout, /(?:^|\s)v?2\.0\.22(?:\s|$)/u, "La prueba de distribución requiere runtime 2.0.22")
  const env = { ...process.env, PATH: "", npm_config_offline: "true", npm_config_registry: "http://127.0.0.1:9", NODE_PATH: "" }
  for (const key of Object.keys(env)) if (key.toUpperCase() === "PATH" && key !== "PATH") delete env[key]
  for (const program of ["node", "npm"]) {
    const located = spawnSync(join(process.env.SystemRoot, "System32/where.exe"), [program], { cwd: target, env, encoding: "utf8" })
    assert.notEqual(located.status, 0, `${program} sigue disponible en PATH: ${located.stdout}`)
  }
  server = await startServer(target, { program: binary, env })
  await server.api("/api/agent")
  const deadline = Date.now() + 30_000
  let result
  while (Date.now() < deadline) {
    try { result = JSON.parse(await readFile(join(target, "distribution-probe.json"), "utf8")); break } catch (error) { if (error.code !== "ENOENT") throw error }
    await delay(100)
  }
  assert.ok(result, "El host no ejecutó el diagnóstico empaquetado")
  assert.equal(result.error, undefined, result.stack)
  assert.equal(result.denied, true)
  assert.match(result.routeError, /Ruta no admitida/)
  assert.match(result.continuationError, /primer error/)
  const firstError = JSON.parse(await readFile(join(target, "first-tool-error.json"), "utf8"))
  assert.equal(firstError.tool, "csdd_document")
  assert.match(firstError.error.message, /Ruta no admitida/)
  await assert.rejects(() => access(join(target, "docs/support/forbidden-after-error.md")), { code: "ENOENT" })
  await assert.rejects(() => access(join(target, "call-count.json")), { code: "ENOENT" })
  assert.match(JSON.parse(result.revision.content).reference, /^sha256:[a-f0-9]{64}$/u)
  assert.match(await readFile(join(target, "docs/base/GENESIS.md"), "utf8"), /Prueba de distribución/u)
  let agents = []
  while (Date.now() < deadline) {
    agents = await server.api("/api/agent")
    if (agents.some(agent => agent.id === "CSDD-Reviewer")) break
    await delay(100)
  }
  for (const name of ["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Explorer", "CSDD-Reviewer"]) assert.ok(agents.find(agent => agent.id === name)?.system.includes(`Eres ${name}`))
  for (const name of ["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Explorer", "CSDD-Reviewer"]) {
    const profile = await readFile(join(target, ".opencode/agents", name + ".md"), "utf8")
    const expected = name === "CSDD-Explorer" ? "openai/gpt-6-luna#high" : "openai/gpt-6.1-sol#medium"
    assert.ok(profile.includes(`model: ${expected}\n`), `Asignación empaquetada: ${name}`)
    assert.ok(agents.find(agent => agent.id === name)?.model, `Modelo efectivo definido: ${name}`)
  }
})
