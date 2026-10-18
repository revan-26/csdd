import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { calculateArtifactRevision, genesisApprovedBody } from "../lib/revision.mjs"
import { writeArtifact } from "../lib/write.mjs"

const draft = "# Genesis\n\nUso personal.\n\n## Decisión Humana\n\nstatus: pending\n\n## Materialización\n\nstage: pending\n"
const revision = "# Revisión de GENESIS: teams_1\n\nAmpliar a equipos.\n\n## Decisión Humana\n\nstatus: pending\n\n## Materialización\n\nstage: pending\n"

async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), "csdd-history-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await writeArtifact(root, "genesis", draft)
  for (const artifact of ["specs", "roadmap", "glossary"]) await writeArtifact(root, artifact, `# ${artifact}\n`)
  const approved = draft.replace("status: pending", "status: approved\napproved_content_reference: {{csdd_revision:genesis}}\napproval_reference: human-fixture")
    .replace("stage: pending", "stage: closed\ngenesis_reference: {{csdd_revision:genesis}}\nspecs_reference: {{csdd_revision:specs}}\nroadmap_reference: {{csdd_revision:roadmap}}\nglossary_reference: {{csdd_revision:glossary}}")
  await writeArtifact(root, "genesis", approved)
  return { root, initial: await readFile(join(root, "docs/base/GENESIS.md"), "utf8") }
}

test("añadir una revisión identifica solo su cuerpo y preserva historia y fuentes evolucionadas", async (context) => {
  const { root, initial } = await fixture(context)
  const original = await calculateArtifactRevision(root, "genesis")
  await writeArtifact(root, "specs", "# Specs\n\nEvolución independiente.\n")
  await writeArtifact(root, "genesis", initial + "\n" + revision)
  const current = await calculateArtifactRevision(root, "genesis")
  assert.notEqual(current.reference, original.reference)
  assert.equal(genesisApprovedBody(initial + "\n" + revision), genesisApprovedBody(draft + "\n" + revision))
  assert.equal(await readFile(join(root, "docs/specs.md"), "utf8"), "# Specs\n\nEvolución independiente.\n")
  assert.ok((await readFile(join(root, "docs/base/GENESIS.md"), "utf8")).startsWith(initial))
  const approved = revision.replace("status: pending", "status: approved\napproved_content_reference: {{csdd_revision:genesis}}\napproval_reference: human-new")
  await writeArtifact(root, "genesis", initial + "\n" + approved)
  const beforeClose = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  await writeArtifact(root, "genesis", beforeClose.replace(/stage: pending$/mu, "stage: closed\ngenesis_reference: {{csdd_revision:genesis}}\nspecs_reference: {{csdd_revision:specs}}\nroadmap_reference: {{csdd_revision:roadmap}}\nglossary_reference: {{csdd_revision:glossary}}"))
})

test("rechaza reescritura del cuerpo, decisión y eliminación de historia aprobada", async (context) => {
  const { root, initial } = await fixture(context)
  await assert.rejects(() => writeArtifact(root, "genesis", initial.replace("Uso personal.", "Uso empresarial.")), /reescribir/)
  await assert.rejects(() => writeArtifact(root, "genesis", initial.replace("human-fixture", "otra-persona")), /reescribir/)
  await writeArtifact(root, "genesis", initial + "\n" + revision)
  await assert.rejects(() => writeArtifact(root, "genesis", revision), /retirar|registro inicial/)
  await assert.rejects(() => writeArtifact(root, "genesis", initial.replace("human-fixture", "otra-persona") + "\n" + revision), /preservarse/)
})

test("no permite nueva revisión antes de cierre ni IDs repetidos ni aprobación heredada", async (context) => {
  const { root, initial } = await fixture(context)
  await writeArtifact(root, "genesis", initial + "\n" + revision)
  await assert.rejects(() => writeArtifact(root, "genesis", initial + "\n" + revision + "\n" + revision.replace("teams_1", "teams_2")), /aprobada y cerrada/)
  assert.throws(() => genesisApprovedBody(initial + "\n" + revision + "\n" + revision), /ID único/)
  const inherited = revision.replace("status: pending", `status: approved\napproved_content_reference: ${(await calculateArtifactRevisionFromInitial(initial))}`)
  await assert.rejects(() => writeArtifact(root, "genesis", initial + "\n" + inherited), /referencia real/)
})

async function calculateArtifactRevisionFromInitial(initial) {
  const { createHash } = await import("node:crypto")
  return `sha256:${createHash("sha256").update(genesisApprovedBody(initial), "utf8").digest("hex")}`
}

test("no interpreta marcadores de revisión citados en fences", () => {
  const cited = draft.replace("Uso personal.", "```markdown\n# Revisión de GENESIS: fake\n## Decisión Humana\n```\nUso personal.")
  assert.match(genesisApprovedBody(cited), /fake/u)
})

test("una huella fuera del campo aprobado no autoriza el cuerpo ni el cierre pendiente", async (context) => {
  const { root, initial } = await fixture(context)
  await writeArtifact(root, "genesis", initial + "\n" + revision)
  const reference = (await calculateArtifactRevision(root, "genesis")).reference
  const falseApproval = revision.replace("status: pending", `status: approved\napproved_content_reference: sha256:${"0".repeat(64)}\nnotes: ${reference}`)
  await assert.rejects(() => writeArtifact(root, "genesis", initial + "\n" + falseApproval), /referencia real/)
  const pendingClosure = revision.replace("stage: pending", "stage: closed")
  await assert.rejects(() => writeArtifact(root, "genesis", initial + "\n" + pendingClosure), /sin aprobación/)
})

test("no escribe en framework ni crea arquitectura mediante selectores o rutas libres", async (context) => {
  const { root } = await fixture(context)
  for (const artifact of ["../.csdd/CSDD.md", "architecture", "docs/specs.md", "__proto__"]) {
    await assert.rejects(() => writeArtifact(root, artifact, "# Cambio\n"), /no permitido/)
  }
})

test("rechaza junction de docs/base aunque apunte dentro del workspace", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "csdd-base-junction-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, "docs"))
  await mkdir(join(root, "other"))
  await symlink(join(root, "other"), join(root, "docs/base"), "junction")
  await assert.rejects(() => writeArtifact(root, "genesis", draft), /enlace/)
  await assert.rejects(() => calculateArtifactRevision(root, "genesis"), /enlace/)
})
