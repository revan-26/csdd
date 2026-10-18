import { lstat, open, readFile, rename, rm } from "node:fs/promises"
import { join } from "node:path"
import { artifactLocation } from "../../common/lib/artifacts.mjs"
import { writeArtifact } from "../../common/lib/write.mjs"

async function location(directory) {
  const base = await artifactLocation(directory, "genesis", true)
  return join(base.directory, ".glossary-candidate.json")
}

async function readCandidate(directory) {
  const path = await location(directory)
  try {
    const stat = await lstat(path)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error("Registro de candidato inválido")
    const record = JSON.parse(await readFile(path, "utf8"))
    if (!["string", "object"].includes(typeof record.previous) || (record.previous !== null && typeof record.previous !== "string")
      || (record.current !== null && typeof record.current !== "string")) throw new Error("Registro de candidato corrupto")
    return record
  } catch (error) { if (error.code !== "ENOENT") throw error }
}

async function glossary(directory) {
  const { artifactPath } = await artifactLocation(directory, "glossary", true)
  try {
    const stat = await lstat(artifactPath)
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Glossary candidato no puede ser un enlace")
    return await readFile(artifactPath, "utf8")
  } catch (error) { if (error.code !== "ENOENT") throw error; return null }
}

async function persist(directory, record) {
  const path = await location(directory), temporary = `${path}.tmp`
  const handle = await open(temporary, "wx", 0o600)
  try { await handle.writeFile(JSON.stringify(record) + "\n"); await handle.sync() }
  finally { await handle.close() }
  await rename(temporary, path)
}

export async function beginGlossaryCandidate(directory) {
  const current = await glossary(directory)
  const record = await readCandidate(directory)
  if (record && record.current !== current) throw new Error("Glossary evolucionó fuera del candidato; preservar y aclarar antes de escribir")
  if (!record) await persist(directory, { previous: current, current })
}

export async function trackGlossaryCandidate(directory) {
  const record = await readCandidate(directory)
  if (!record) throw new Error("Falta registro previo del candidato")
  await persist(directory, { ...record, current: await glossary(directory) })
}

export async function verifyGlossaryCandidate(directory) {
  const record = await readCandidate(directory)
  if (record && record.current !== await glossary(directory)) throw new Error("Glossary tiene evolución ajena o escritura interrumpida; preservar antes de cerrar")
}

export async function settleGlossaryCandidate(directory, rejected = false) {
  const record = await readCandidate(directory)
  if (!record) return
  const current = await glossary(directory)
  if (record.current !== current && (!rejected || record.previous !== current)) throw new Error("Glossary tiene evolución ajena o escritura interrumpida; no restaurar automáticamente")
  if (rejected && current !== record.previous) {
    if (record.previous === null) {
      const { artifactPath } = await artifactLocation(directory, "glossary")
      await rm(artifactPath)
    } else await writeArtifact(directory, "glossary", record.previous)
  }
  await rm(await location(directory))
}
