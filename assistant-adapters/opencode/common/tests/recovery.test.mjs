import assert from "node:assert/strict"
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { writeArtifact } from "../lib/write.mjs"
import { calculateArtifactRevision } from "../lib/revision.mjs"
import { markGenesisRecovery, settleGenesisRecovery, RECOVERY_MARKER } from "../lib/recovery.mjs"

const draft = "# Genesis\n\nUso personal.\n\n## Decisión Humana\n\nstatus: pending\n\n## Materialización\n\nstage: pending\n"
const next = "# Revisión de GENESIS: next_1\n\nEquipo.\n\n## Decisión Humana\n\nstatus: pending\n\n## Materialización\n\nstage: pending\n"
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "csdd-recovery-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  await writeArtifact(root, "genesis", draft)
  return { root, marker: join(root, "docs/base", RECOVERY_MARKER) }
}
async function close(root) {
  const ref = (await calculateArtifactRevision(root, "genesis")).reference
  await writeArtifact(root, "glossary", "# Glosario\n")
  const approved = draft.replace("status: pending", `status: approved\napproved_content_reference: ${ref}`)
  const closed = approved.replace("stage: pending", "stage: closed\ngenesis_reference: {{csdd_revision:genesis}}\nglossary_reference: {{csdd_revision:glossary}}")
  await writeArtifact(root, "genesis", closed)
}

test("recuperación cierra con Genesis y Glossary sin Specs ni Roadmap", async t => {
  const { root, marker } = await fixture(t)
  await access(marker); await close(root)
  await assert.rejects(() => access(marker), { code: "ENOENT" })
  await assert.rejects(() => access(join(root, "docs/roadmap.md")), { code: "ENOENT" })
  await assert.rejects(() => access(join(root, "docs/specs.md")), { code: "ENOENT" })
  await markGenesisRecovery(root)
  const final = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  await writeArtifact(root, "genesis", final)
  await assert.rejects(() => access(marker), { code: "ENOENT" })
  await writeArtifact(root, "genesis", final + "\n" + next)
  await access(marker)
})

test("Glossary modificado tras cierre conserva la marca para aclarar divergencia", async t => {
  const { root, marker } = await fixture(t); await close(root)
  await markGenesisRecovery(root)
  await writeArtifact(root, "glossary", "# Cambio ajeno\n")
  await settleGenesisRecovery(root)
  await access(marker)
})

test("rechazo preserva propuesta; restauración pendiente conserva la marca", async t => {
  const { root, marker } = await fixture(t)
  const candidate = join(root, "docs/base/.glossary-candidate.json")
  await writeFile(candidate, "{}")
  const abandoned = draft.replace("status: pending", "status: rejected\nrejection_reference: human-test").replace("stage: pending", "stage: pending\ndisposition: abandoned")
  await writeArtifact(root, "genesis", abandoned)
  await access(marker)
  await rm(candidate); await settleGenesisRecovery(root)
  await assert.rejects(() => access(marker), { code: "ENOENT" })
  await assert.rejects(() => writeArtifact(root, "genesis", abandoned.replace("Uso personal.", "Otro.")), /rechazada y abandonada/)
  await writeArtifact(root, "genesis", abandoned + "\n" + next)
  await access(marker)
})
