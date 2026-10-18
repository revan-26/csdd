import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import test from "node:test"
import { setTimeout as delay } from "node:timers/promises"
import { installFixture } from "../lib/install.mjs"
import { installDependencies, requireV2, startServer } from "./runtime-support.mjs"
import { sessionFamily } from "./transcript.mjs"

function effect(agent, action, resource = "*") {
  return agent.permissions.filter((r) => (r.action === "*" || r.action === action) && (r.resource === "*" || r.resource === resource)).at(-1)?.effect
}

test("runtime V2 carga plugin, perfiles, permisos y profundidad sin llamar modelos", { skip: process.env.CSDD_TEST_SOURCE_RUNTIME !== "1", timeout: 240_000 }, async (context) => {
  requireV2(process.cwd())
  const root = await mkdtemp(join(tmpdir(), "csdd-v2-runtime-"))
  let server
  context.after(async () => { server?.stop(); await rm(root, { recursive: true, force: true }) })
  await installFixture(root)
  installDependencies(join(root, ".opencode"))
  // Plugin de diagnóstico exclusivo de la fixture: observa el registro real.
  const probe = join(root, ".opencode/plugins/probe")
  await mkdir(probe)
  await writeFile(join(probe, "package.json"), JSON.stringify({ name: "csdd-test-probe", private: true, type: "module", main: "./index.mjs" }))
  const configPath = join(root, ".opencode/opencode.json")
  const configured = JSON.parse(await readFile(configPath, "utf8"))
  configured.plugins.push("./plugins/probe")
  await writeFile(configPath, JSON.stringify(configured))
  await writeFile(join(probe, "index.mjs"), `import { Plugin } from "@opencode/plugin"
import { writeFile } from "node:fs/promises"
import { join } from "node:path"
export default Plugin.define({ id: "csdd.test.probe", async setup(ctx) {
  const tools = await ctx.tool.list()
  await writeFile(join(ctx.location.directory, "registered-tools.json"), JSON.stringify(tools.filter(t => t.id.startsWith("csdd_")).map(t => ({ id: t.id, input: t.input, options: t.options }))))
}})
`)
  server = await startServer(root)
  await server.api("/api/agent")
  let plugins = []
  // La activación del plugin es asíncrona. Esperar disponibilidad, no asumirla
  // a partir de que el servidor haya abierto su puerto.
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    plugins = await server.api("/api/plugin")
    if (JSON.stringify(plugins).includes("csdd.genesis")) break
    await delay(100)
  }
  assert.ok(JSON.stringify(plugins).includes("csdd.genesis"), `El plugin CSDD no figura activo: ${JSON.stringify(plugins)}`)
  const tools = JSON.parse(await readFile(join(root, "registered-tools.json"), "utf8"))
  assert.deepEqual(tools.map(t => t.id).sort(), ["csdd_review", "csdd_revision", "csdd_write"])
  const config = await server.api("/api/config")
  const localConfig = config.find(source => source.path === configPath)?.info
  assert.equal(localConfig.experimental.subagent_depth, 2)
  assert.notEqual(localConfig.default_agent, "CSDD-Orchestrator")
  const agents = await server.api("/api/agent")
  for (const name of ["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Explorer", "CSDD-Reviewer"]) {
    const agent = agents.find(a => a.id === name)
    assert.ok(agent, name)
    assert.equal(agent.mode, name === "CSDD-Orchestrator" ? "primary" : "subagent")
    assert.equal(agent.hidden, false)
    assert.ok(agent.system.includes(`Eres ${name}`))
    for (const action of ["shell", "edit", "skill", "execute"]) assert.equal(effect(agent, action), "deny", `${name}.${action}`)
    assert.equal(effect(agent, "read"), "allow")
    assert.equal(effect(agent, "csdd_write"), name === "CSDD-Canon" ? "allow" : "deny")
    assert.equal(effect(agent, "csdd_revision"), name === "CSDD-Explorer" ? "deny" : "allow")
    assert.equal(effect(agent, "question"), name === "CSDD-Orchestrator" ? "allow" : "deny")
    assert.equal(effect(agent, "subagent", "general"), "deny")
  }
  const orchestrator = agents.find(a => a.id === "CSDD-Orchestrator")
  assert.equal(effect(orchestrator, "subagent", "CSDD-Canon"), "allow")
  assert.equal(effect(orchestrator, "subagent", "CSDD-Reviewer"), "allow")
  assert.equal(effect(orchestrator, "subagent", "CSDD-Explorer"), "deny")
  const canon = agents.find(a => a.id === "CSDD-Canon")
  assert.equal(effect(canon, "subagent", "CSDD-Explorer"), "allow")
  assert.equal(effect(canon, "subagent", "CSDD-Reviewer"), "allow")
  // Comprobar también las formas reales de creación y lectura usadas por el
  // harness V2. Crear una sesión vacía no envía un prompt ni usa un modelo.
  const created = await server.api("/api/session", "POST", { title: "CSDD V2 empty test", agent: "CSDD-Orchestrator", location: { directory: root } })
  const family = await sessionFamily(server, created.id)
  assert.equal(family.length, 1)
  assert.equal(family[0].info.location.directory, root)
  assert.equal(family[0].info.agent, "CSDD-Orchestrator")
  assert.ok(!family[0].messages.some(message => message.type === "assistant"))
  await server.api(`/api/session/${created.id}`, "DELETE")
})
