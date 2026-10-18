import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"
import { templateReferences } from "./template-reference.mjs"

const templates = fileURLToPath(new URL("../../../../framework/templates/", import.meta.url))
const files = { genesis: "genesis.template.md", genesis_revision: "genesis-revision.template.md", specs: "specs.template.md", roadmap: "roadmap.template.md", glossary: "glossary.template.md" }

export async function generateTemplates({ check = false, directory = templates } = {}) {
  const references = templateReferences()
  for (const [artifact, name] of Object.entries(files)) {
    const path = resolve(directory, name)
    if (check) {
      if (await readFile(path, "utf8") !== references[artifact]) throw new Error(`Referencia generada desactualizada: ${path}`)
    } else await writeFile(path, references[artifact], "utf8")
  }
  return Object.values(files)
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await generateTemplates({ check: process.argv.includes("--check") })))
