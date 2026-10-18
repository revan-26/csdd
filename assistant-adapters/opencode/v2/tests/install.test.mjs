import assert from "node:assert/strict"
import { access, mkdtemp, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"
import test from "node:test"
import { installFixture } from "../lib/install.mjs"

test("compone una instalación V2 autosuficiente sin tools ni scripts V1", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "csdd-v2-install-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await installFixture(root)
  for (const file of [".csdd/CSDD.md", ".opencode/plugins/csdd/index.mjs", ".opencode/lib/tools.mjs"]) await access(join(root, file))
  for (const file of ["docs", ".opencode/tools", ".opencode/tests", ".opencode/lib/install.mjs", ".opencode/commands", ".opencode/skills"]) await assert.rejects(() => access(join(root, file)))
  const manifest = JSON.parse(await readFile(join(root, ".opencode/package.json"), "utf8"))
  assert.deepEqual(manifest, { private: true, type: "module", dependencies: { "@opencode/plugin": "2.0.22" } })
  const config = JSON.parse(await readFile(join(root, ".opencode/opencode.json"), "utf8"))
  assert.equal(config.experimental.subagent_depth, 2)
  assert.equal(config.subagent_depth, undefined)
  assert.equal(config.default_agent, undefined)
  for (const name of ["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Explorer", "CSDD-Reviewer"]) {
    const installed = await readFile(join(root, `.opencode/agents/${name}.md`), "utf8")
    const prompt = await readFile(new URL(`../../common/prompts/${name}.md`, import.meta.url), "utf8")
    assert.ok(installed.endsWith(prompt))
    assert.ok(installed.includes("permissions:"))
    assert.ok(!installed.includes("hidden: true"), "Los subagentes V2 deben ser descubribles por el delegado")
  }
  const tools = await readFile(join(root, ".opencode/lib/tools.mjs"), "utf8")
  assert.ok(!tools.includes("common/"))
  const { registerTools } = await import(pathToFileURL(join(root, ".opencode/lib/tools.mjs")))
  assert.equal(typeof registerTools, "function")
  await assert.rejects(() => installFixture(root), /no sobrescribe/)
})
