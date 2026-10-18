import assert from "node:assert/strict"
import { conformingCall } from "./review-support.mjs"
import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { calculateArtifactRevision } from "../../common/lib/revision.mjs"
import { installFixture } from "../lib/install.mjs"
import { exists, removeFixture, runOpenCode, sessionId, taskCalls } from "./smoke-support.mjs"

const keep = process.argv.includes("--keep")
const root = await mkdtemp(join(tmpdir(), "csdd-genesis-smoke-"))
let passed = false

try {
  await installFixture(root)
  const first = runOpenCode(root, [
    "run",
    "--agent", "CSDD-Orchestrator",
    "--format", "json",
    "--title", "CSDD Genesis smoke",
    [
      "Este es un ensayo smoke de Genesis con datos ficticios. La persona responsable se identifica como Smoke Tester.",
      "Quiere un producto personal para registrar tareas, consultarlas y marcarlas como completadas desde un único dispositivo.",
      "El valor es no olvidar pendientes. No habrá cuentas, colaboración, sincronización ni integraciones.",
      "El primer slice debe permitir registrar una tarea con descripción y verla en una lista persistente; completar tareas puede quedar para después.",
       "Prepara docs/base/GENESIS.md. No existe aprobación todavía y no debes crear docs/specs.md, docs/roadmap.md ni docs/glossary.md.",
      "No investigues externamente salvo que detectes una incertidumbre capaz de cambiar este slice.",
    ].join(" "),
  ])

  const session = sessionId(first)
  const genesisPath = join(root, "docs", "base", "GENESIS.md")
  assert.equal(await exists(genesisPath), true, "Canon no creó GENESIS.md")
  for (const file of ["specs.md", "roadmap.md", "glossary.md"]) {
    assert.equal(await exists(join(root, "docs", file)), false, `${file} apareció antes de la aprobación`)
  }

  const approved = await calculateArtifactRevision(root, "genesis")
  const approval = `Apruebo ${approved.reference}`
  const second = runOpenCode(root, [
    "run",
    "--session", session,
    "--agent", "CSDD-Orchestrator",
    "--format", "json",
    approval,
  ])

  const projections = {}
  for (const [artifact, file] of [["specs", "specs.md"], ["roadmap", "roadmap.md"], ["glossary", "glossary.md"]]) {
    const path = join(root, "docs", file)
    assert.equal(await exists(path), true, `${file} no fue materializado`)
    const content = await readFile(path, "utf8")
    assert.ok(content.length > 100, `${file} está vacío o es trivial`)
    projections[artifact] = await calculateArtifactRevision(root, artifact)
  }
  const finalGenesis = await readFile(genesisPath, "utf8")
  const finalApproved = await calculateArtifactRevision(root, "genesis")
  assert.equal(finalApproved.reference, approved.reference, "El cuerpo de Genesis cambió después de aprobarse")
  assert.match(finalGenesis, /status: approved/u)
  assert.match(finalGenesis, /^approved_by:\s*Smoke Tester$/mu)
  assert.match(finalGenesis, /^approved_at:\s*\d{4}-\d{2}-\d{2}T\S+$/mu)
  assert.match(finalGenesis, new RegExp(`approved_content_reference:\\s*${approved.reference}`, "u"))
  assert.match(finalGenesis, new RegExp(`approval_reference:.*${session}`, "u"))
  assert.match(finalGenesis, new RegExp(`statement:${approval}`, "u"))
  assert.match(finalGenesis, /^review_verdict: conforming$/mu)
  for (const revision of Object.values(projections)) {
    assert.match(finalGenesis, new RegExp(revision.reference, "u"), `${revision.artifact} no tiene referencia en Materialización`)
  }

  const roadmap = await readFile(join(root, "docs", "roadmap.md"), "utf8")
  assert.equal((roadmap.match(/^lifecycle_state: pre_fr$/gmu) ?? []).length, 1)
  assert.match(roadmap, /^genesis_closure:\s*verified$/mu)
  assert.match(roadmap, new RegExp(`^genesis_revision:\\s*${approved.reference}$`, "mu"))
  assert.match(finalGenesis, /^stage:\s*closed$/mu)
  for (const forbidden of ["ONTOLOGY.md", "TOPOLOGY.md"]) {
    assert.equal(await exists(join(root, "docs", "base", forbidden)), false, `${forbidden} fue creado prematuramente`)
  }

  const exported = JSON.parse(runOpenCode(root, ["export", session]))
  const canonCalls = taskCalls(exported, "CSDD-Canon")
  const reviewerCalls = taskCalls(exported, "CSDD-Reviewer")
  assert.ok(canonCalls.length >= 2, "No hay llamadas reales suficientes a Canon")
  assert.ok(reviewerCalls.length >= 1, "No hay una llamada real a Reviewer")
  const reviewedReferences = Object.values(projections).map((revision) => revision.reference)
  const finalReview = reviewerCalls.find(call => conformingCall(call, session, Object.values(projections)))
  assert.ok(finalReview, "Reviewer no verificó en una sesión independiente las huellas de la materialización final")

  console.log(JSON.stringify({
    status: "passed",
    workspace: root,
    session_id: session,
    approved_content_reference: approved.reference,
    kept: keep,
  }, null, 2))
  passed = true
} catch (error) {
  console.error(`Smoke fallido; workspace preservado en ${root}`)
  throw error
} finally {
  if (!keep && passed) {
    await removeFixture(root)
  }
}
