import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import test from "node:test"
import { installFixture } from "../lib/install.mjs"
import { installDependencies, requireV2, startServer } from "./runtime-support.mjs"
import { setTimeout as delay } from "node:timers/promises"

test("API plugin 2.0.22 lee intervención original existente sin generar ni usar modelos", { skip: !process.env.CSDD_APPROVAL_PROBE_SESSION, timeout: 180_000 }, async t => {
  requireV2(process.cwd())
  const root = await mkdtemp(join(tmpdir(), "csdd-approval-runtime-")); let server
  t.after(async () => { server?.stop(); await rm(root, { recursive: true, force: true }) })
  await installFixture(root); installDependencies(join(root, ".opencode"))
  const probe = join(root, ".opencode/plugins/probe"); await mkdir(probe)
  await writeFile(join(probe, "package.json"), JSON.stringify({ name: "approval-probe", type: "module", main: "index.mjs" }))
  await writeFile(join(probe, "index.mjs"), `import { Plugin } from '@opencode/plugin'; import { writeFile } from 'node:fs/promises'; import { join } from 'node:path';
export default Plugin.define({id:'csdd.approval.probe', async setup(ctx) {
  const sessionID=${JSON.stringify(process.env.CSDD_APPROVAL_PROBE_SESSION)};
  const messages=await ctx.session.context({sessionID});
  await writeFile(join(ctx.location.directory,'probe.json'), JSON.stringify(messages.filter(m=>m.type==='user')));
}})`)
  const configPath = join(root, ".opencode/opencode.json")
  const config = JSON.parse(await readFile(configPath, "utf8")); config.plugins.push("./plugins/probe")
  await writeFile(configPath, JSON.stringify(config))
  server = await startServer(root); await server.api("/api/agent")
  let messages
  for (let i = 0; i < 100; i++) {
    try { messages = JSON.parse(await readFile(join(root, "probe.json"), "utf8")); break }
    catch (error) { if (error.code !== "ENOENT") throw error; await delay(100) }
  }
  const approval = messages?.find(m => m.id === process.env.CSDD_APPROVAL_PROBE_MESSAGE)
  assert.ok(approval?.text.startsWith("Apruebo sha256:"), "API no devolvió el mensaje original identificable")
  assert.ok(Number.isFinite(approval.time.created))
})
