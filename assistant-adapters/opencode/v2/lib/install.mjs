import { cp, lstat, mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { composeAgents } from "../../common/build/agents.mjs"

const adapterRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const commonRoot = resolve(adapterRoot, "..", "common")
const sourceRoot = resolve(adapterRoot, "..", "..", "..")

// Composición para workspaces aislados nuevos. No actualiza instalaciones ajenas.
export async function installFixture(workspace) {
  const target = resolve(workspace)
  const csdd = join(target, ".csdd")
  const opencode = join(target, ".opencode")
  for (const path of [csdd, opencode]) {
    try { await lstat(path) } catch (error) { if (error.code === "ENOENT") continue; throw error }
    throw new Error("La instalación V2 requiere un workspace sin .csdd ni .opencode; no sobrescribe instalaciones existentes")
  }
  await mkdir(opencode, { recursive: true })
  await cp(join(sourceRoot, "framework"), csdd, { recursive: true })
  await composeAgents(adapterRoot, commonRoot, join(opencode, "agents"))
  await cp(join(commonRoot, "lib"), join(opencode, "lib"), { recursive: true })
  const structure = await readFile(join(commonRoot, "lib/structure.mjs"), "utf8")
  await writeFile(join(opencode, "lib/structure.mjs"), structure.replaceAll("../../../../framework/templates/", "./"))
  await cp(join(sourceRoot, "framework/templates/genesis.contract.json"), join(opencode, "lib/genesis.contract.json"))
  await cp(join(sourceRoot, "framework/templates/consolidation.contract.json"), join(opencode, "lib/consolidation.contract.json"))
  await cp(join(adapterRoot, "plugins"), join(opencode, "plugins"), { recursive: true })
  const tools = await readFile(join(adapterRoot, "lib/tools.mjs"), "utf8")
  await writeFile(join(opencode, "lib/tools.mjs"), tools.replaceAll("../../common/lib/", "./"))
  const approval = await readFile(join(adapterRoot, "lib/approval-evidence.mjs"), "utf8")
  await writeFile(join(opencode, "lib/approval-evidence.mjs"), approval.replaceAll("../../common/lib/", "./"))
  for (const name of ["reviews", "administration", "glossary-candidate", "documents"]) {
    const source = await readFile(join(adapterRoot, `lib/${name}.mjs`), "utf8")
    await writeFile(join(opencode, `lib/${name}.mjs`), source.replaceAll("../../common/lib/", "./"))
  }
  await writeFile(join(opencode, "opencode.json"), await readFile(join(adapterRoot, "opencode.json")))
  const manifest = JSON.parse(await readFile(join(adapterRoot, "package.json"), "utf8"))
  await writeFile(join(opencode, "package.json"), JSON.stringify({ private: true, type: "module", dependencies: { "@opencode/plugin": manifest.devDependencies["@opencode/plugin"] } }, null, 2) + "\n")
  return { workspace: target, csdd, opencode }
}
