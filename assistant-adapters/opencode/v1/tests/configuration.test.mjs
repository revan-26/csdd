import assert from "node:assert/strict"
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { pathToFileURL } from "node:url"
import test from "node:test"
import { installFixture } from "../lib/install.mjs"

function opencode(workspace, args) {
  const command = process.platform === "win32" ? process.env.ComSpec : "opencode"
  const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", "opencode", ...args] : args
  const result = spawnSync(command, commandArgs, {
    cwd: workspace,
    encoding: "utf8",
    timeout: 60_000,
  })
  assert.equal(result.status, 0, `opencode ${args.join(" ")} falló:\n${result.stderr || result.stdout}`)
  return result.stdout
}

async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), "csdd-config-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await installFixture(root)
  return root
}

test("instala solo el payload y los recursos operativos previstos", async (context) => {
  const root = await fixture(context)
  for (const path of [
    ".csdd/CSDD.md",
    ".csdd/protocols/genesis.md",
    ".opencode/agents/CSDD-Orchestrator.md",
    ".opencode/agents/CSDD-Canon.md",
    ".opencode/agents/CSDD-Explorer.md",
    ".opencode/agents/CSDD-Reviewer.md",
    ".opencode/tools/csdd_revision.ts",
    ".opencode/tools/csdd_write.ts",
    ".opencode/lib/artifacts.mjs",
  ]) await access(join(root, path))

  await assert.rejects(() => access(join(root, ".opencode/commands")))
  await assert.rejects(() => access(join(root, ".opencode/skills")))
  await assert.rejects(() => access(join(root, "docs")))
  for (const path of [".opencode/lib/install.mjs", ".opencode/tests", ".opencode/v1", ".opencode/v2", ".opencode/common"]) {
    await assert.rejects(() => access(join(root, path)))
  }
  const manifest = JSON.parse(await readFile(join(root, ".opencode/package.json"), "utf8"))
  assert.deepEqual(manifest.dependencies, { "@opencode-ai/plugin": "1.18.29" })
  assert.equal(manifest.scripts, undefined)
  assert.equal(manifest.devDependencies, undefined)
  for (const name of ["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Explorer", "CSDD-Reviewer"]) {
    const header = await readFile(new URL(`../agents/${name}.md`, import.meta.url), "utf8")
    const prompt = await readFile(new URL(`../../common/prompts/${name}.md`, import.meta.url), "utf8")
    assert.equal(await readFile(join(root, `.opencode/agents/${name}.md`), "utf8"), header.trimEnd() + "\n\n" + prompt)
  }
})

test("compone wrappers V1 y núcleo común con imports locales y ejecutables", async (context) => {
  const root = await fixture(context)
  for (const [tool, module] of [["csdd_write", "write"], ["csdd_revision", "revision"]]) {
    const source = await readFile(join(root, `.opencode/tools/${tool}.ts`), "utf8")
    assert.ok(source.includes(`"../lib/${module}.mjs"`))
    assert.ok(!source.includes("common/"))
    assert.ok(!source.includes("v1/"))
  }
  for (const file of ["artifacts.mjs", "revision.mjs", "write.mjs"]) {
    const installed = await readFile(join(root, ".opencode/lib", file), "utf8")
    const original = await readFile(new URL(`../../common/lib/${file}`, import.meta.url), "utf8")
    assert.equal(installed, original)
  }
  const { writeArtifact } = await import(pathToFileURL(join(root, ".opencode/lib/write.mjs")))
  const { calculateArtifactRevision } = await import(pathToFileURL(join(root, ".opencode/lib/revision.mjs")))
  const result = await writeArtifact(root, "specs", "# Specs\r\n")
  assert.equal(result.path, "docs/specs.md")
  assert.equal(await readFile(join(root, "docs/specs.md"), "utf8"), "# Specs\n")
  assert.match((await calculateArtifactRevision(root, "specs")).reference, /^sha256:[a-f0-9]{64}$/u)
})

test("OpenCode resuelve profundidad dos sin cambiar el agente predeterminado", async (context) => {
  const root = await fixture(context)
  const config = JSON.parse(opencode(root, ["debug", "config"]))
  assert.equal(config.subagent_depth, 2)
  assert.notEqual(config.default_agent, "CSDD-Orchestrator")
})

test("OpenCode descubre los cuatro perfiles con sus modos y herramientas", async (context) => {
  const root = await fixture(context)
  const expected = {
    "CSDD-Orchestrator": { mode: "primary", apply_patch: false, bash: false, task: true, question: true, csdd_revision: true, csdd_write: false },
    "CSDD-Canon": { mode: "subagent", apply_patch: false, bash: false, task: true, question: false, csdd_revision: true, csdd_write: true },
    "CSDD-Explorer": { mode: "subagent", apply_patch: false, bash: false, task: false, question: false, csdd_revision: false, csdd_write: false },
    "CSDD-Reviewer": { mode: "subagent", apply_patch: false, bash: false, task: false, question: false, csdd_revision: true, csdd_write: false },
  }

  for (const [name, contract] of Object.entries(expected)) {
    const agent = JSON.parse(opencode(root, ["debug", "agent", name]))
    assert.equal(agent.mode, contract.mode, name)
    for (const [tool, enabled] of Object.entries(contract).filter(([key]) => key !== "mode")) {
      assert.equal(agent.tools[tool], enabled, `${name}.${tool}; tools=${JSON.stringify(agent.tools)}`)
    }

    const taskRules = agent.permission.filter((rule) => rule.permission === "task")
    if (name === "CSDD-Orchestrator") {
      assert.equal(taskRules.some((rule) => rule.pattern === "*" && rule.action === "deny"), true)
      assert.equal(taskRules.some((rule) => rule.pattern === "CSDD-Canon" && rule.action === "allow"), true)
      assert.equal(taskRules.some((rule) => rule.pattern === "CSDD-Reviewer" && rule.action === "allow"), true)
      assert.equal(taskRules.some((rule) => rule.pattern === "CSDD-Explorer" && rule.action === "allow"), false)
    }
    if (name === "CSDD-Canon") {
      assert.equal(taskRules.some((rule) => rule.pattern === "CSDD-Explorer" && rule.action === "allow"), true)
      assert.equal(taskRules.some((rule) => rule.pattern === "CSDD-Reviewer" && rule.action === "allow"), true)
    }
  }
})

test("el paquete fuente no implementa commands ni skills", async () => {
  const entries = await readdir(new URL("..", import.meta.url))
  assert.equal(entries.includes("commands"), false)
  assert.equal(entries.includes("skills"), false)
})
