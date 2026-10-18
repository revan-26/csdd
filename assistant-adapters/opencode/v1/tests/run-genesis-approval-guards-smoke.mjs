import assert from "node:assert/strict"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { calculateArtifactRevision } from "../../common/lib/revision.mjs"
import { installFixture } from "../lib/install.mjs"
import { exists, removeFixture, runOpenCode, sessionId } from "./smoke-support.mjs"

const keep = process.argv.includes("--keep")
const root = await mkdtemp(join(tmpdir(), "csdd-genesis-guards-smoke-"))
let passed = false

try {
  await installFixture(root)
  const first = runOpenCode(root, [
    "run", "--agent", "CSDD-Orchestrator", "--format", "json", "--title", "CSDD Genesis approval guards smoke",
    "Ensayo ficticio de Genesis. La responsable es Guard Tester. Necesita anotar recordatorios personales y consultarlos después en el mismo dispositivo. El primer slice registra un recordatorio con texto y lo muestra de forma persistente. Excluye cuentas, colaboración, sincronización e integraciones. Prepara solo el borrador; no existe aprobación.",
  ])
  const session = sessionId(first)
  const genesisPath = join(root, "docs", "base", "GENESIS.md")
  const presented = await calculateArtifactRevision(root, "genesis")

  const invalidResponse = runOpenCode(root, [
    "run", "--session", session, "--agent", "CSDD-Orchestrator", "--format", "json",
    `Apruebo sha256:${"0".repeat(64)}`,
  ])
  for (const file of ["specs.md", "roadmap.md", "glossary.md"]) {
    assert.equal(await exists(join(root, "docs", file)), false, `${file} apareció con una huella inválida`)
  }
  assert.doesNotMatch(await readFile(genesisPath, "utf8"), /^status:\s*approved$/mu)

  const draft = await readFile(genesisPath, "utf8")
  await writeFile(genesisPath, draft.replace("## Decisión Humana", "## Cambio Posterior No Aprobado\n\nEste texto cambia el cuerpo presentado.\n\n## Decisión Humana"))
  const changed = await calculateArtifactRevision(root, "genesis")
  assert.notEqual(changed.reference, presented.reference)

  const staleResponse = runOpenCode(root, [
    "run", "--session", session, "--agent", "CSDD-Orchestrator", "--format", "json",
    `Apruebo ${presented.reference}`,
  ])
  for (const file of ["specs.md", "roadmap.md", "glossary.md"]) {
    assert.equal(await exists(join(root, "docs", file)), false, `${file} apareció tras cambiar el cuerpo presentado`)
  }
  assert.doesNotMatch(await readFile(genesisPath, "utf8"), /^status:\s*approved$/mu)

  console.log(JSON.stringify({ status: "passed", workspace: root, session_id: session, kept: keep }, null, 2))
  passed = true
} catch (error) {
  console.error(`Smoke fallido; workspace preservado en ${root}`)
  throw error
} finally {
  if (!keep && passed) await removeFixture(root)
}
