import { lstat, open, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { artifactLocation } from "./artifacts.mjs"
import { calculateArtifactRevision, genesisRecordParts, genesisRecords } from "./revision.mjs"
import { administrativeFields } from "./administrative.mjs"

export const RECOVERY_MARKER = ".genesis-recovery-pending"

export async function markGenesisRecovery(workspace) {
  const { directory } = await artifactLocation(workspace, "genesis", true)
  const path = join(directory, RECOVERY_MARKER)
  let handle
  try {
    handle = await open(path, "wx", 0o600)
    await handle.writeFile("Genesis write in progress; inspect active record and current sources before resuming.\n")
    await handle.sync()
  } catch (error) {
    if (error.code !== "EEXIST") throw error
    const stat = await lstat(path)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error("Marca de recuperación inválida")
  } finally { await handle?.close() }
}

export async function settleGenesisRecovery(workspace) {
  const { directory, artifactPath } = await artifactLocation(workspace, "genesis")
  const marker = join(directory, RECOVERY_MARKER)
  try { await lstat(marker) } catch (error) { if (error.code === "ENOENT") return; throw error }
  const active = genesisRecordParts(genesisRecords(await readFile(artifactPath, "utf8")).at(-1))
  const decision = administrativeFields(active.decision, true)
  const materialization = administrativeFields(active.materialization, true)
  const rejected = decision.status === "rejected" && materialization.disposition === "abandoned"
  try { await lstat(join(directory, ".glossary-candidate.json")); return }
  catch (error) { if (error.code !== "ENOENT") throw error }
  if (!rejected) {
    if (decision.status !== "approved" || materialization.stage !== "closed") return
    const genesis = await calculateArtifactRevision(workspace, "genesis")
    if (materialization.genesis_reference !== genesis.reference) return
    for (const artifact of ["glossary"]) {
      const revision = await calculateArtifactRevision(workspace, artifact)
      if (materialization[`${artifact}_reference`] !== revision.reference) return
    }
  }
  await rm(marker)
}
