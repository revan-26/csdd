import { lstat, mkdir, realpath } from "node:fs/promises"
import { join, resolve } from "node:path"

export const ARTIFACTS = Object.freeze({
  genesis: { path: "docs/base/GENESIS.md", bodyOnly: true },
  specs: { path: "docs/specs.md", bodyOnly: false },
  roadmap: { path: "docs/roadmap.md", bodyOnly: false },
  glossary: { path: "docs/glossary.md", bodyOnly: false },
})

export async function artifactLocation(workspace, artifact, create = false) {
  if (!Object.hasOwn(ARTIFACTS, artifact)) throw new Error(`Artefacto no permitido: ${artifact}`)
  const definition = ARTIFACTS[artifact]
  const root = await realpath(resolve(workspace))
  const parts = definition.path.split("/")
  let directory = root
  for (const part of parts.slice(0, -1)) {
    directory = join(directory, part)
    if (create) {
      try { await mkdir(directory) } catch (error) { if (error?.code !== "EEXIST") throw error }
    }
    const stat = await lstat(directory)
    if (stat.isSymbolicLink() || !stat.isDirectory() || await realpath(directory) !== directory) {
      throw new Error("La carpeta documental no puede ser un enlace ni resolver fuera del workspace")
    }
  }
  return { ...definition, directory, artifactPath: join(root, ...parts) }
}
