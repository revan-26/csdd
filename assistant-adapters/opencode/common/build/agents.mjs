import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

export const AGENTS = Object.freeze(["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Explorer", "CSDD-Reviewer"])

export async function composeAgents(versionRoot, commonRoot, target) {
  await mkdir(target, { recursive: true })
  for (const name of AGENTS) {
    const header = await readFile(join(versionRoot, "agents", `${name}.md`), "utf8")
    const body = await readFile(join(commonRoot, "prompts", `${name}.md`), "utf8")
    await writeFile(join(target, `${name}.md`), header.trimEnd() + "\n\n" + body)
  }
}
