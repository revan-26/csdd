import { cp, mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { composeAgents } from "../../common/build/agents.mjs"

const adapterRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const sourceRoot = resolve(adapterRoot, "..", "..", "..")
const commonRoot = resolve(adapterRoot, "..", "common")

export async function installFixture(workspace) {
  const target = resolve(workspace)
  const csdd = join(target, ".csdd")
  const opencode = join(target, ".opencode")
  await mkdir(csdd, { recursive: true })
  await mkdir(opencode, { recursive: true })

  await cp(join(sourceRoot, "framework"), csdd, { recursive: true })
  await composeAgents(adapterRoot, commonRoot, join(opencode, "agents"))
  await cp(join(commonRoot, "lib"), join(opencode, "lib"), { recursive: true })
  const structure = await readFile(join(commonRoot, "lib/structure.mjs"), "utf8")
  await writeFile(join(opencode, "lib/structure.mjs"), structure.replaceAll("../../../../framework/templates/", "./"))
  await cp(join(sourceRoot, "framework/templates/genesis.contract.json"), join(opencode, "lib/genesis.contract.json"))
  await cp(join(sourceRoot, "framework/templates/consolidation.contract.json"), join(opencode, "lib/consolidation.contract.json"))
  await mkdir(join(opencode, "tools"), { recursive: true })
  for (const file of ["csdd_write.ts", "csdd_revision.ts"]) {
    const source = await readFile(join(adapterRoot, "tools", file), "utf8")
    // El paquete instalado reúne el núcleo en lib/; no depende del repositorio fuente.
    await writeFile(join(opencode, "tools", file), source.replaceAll("../../common/lib/", "../lib/"))
  }
  await writeFile(join(opencode, "opencode.json"), await readFile(join(adapterRoot, "opencode.json")))
  const sourcePackage = JSON.parse(await readFile(join(adapterRoot, "package.json"), "utf8"))
  await writeFile(join(opencode, "package.json"), JSON.stringify({
    private: true,
    type: "module",
    dependencies: sourcePackage.devDependencies,
  }, null, 2) + "\n")
  return { workspace: target, csdd, opencode }
}
