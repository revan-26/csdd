import assert from "node:assert/strict"
import { access, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { calculateArtifactRevision, genesisRecords, genesisApprovedBody } from "../../common/lib/revision.mjs"
import { parseStructure, writeStructuredArtifact } from "../../common/lib/structured-write.mjs"
import { documentSnapshot, assertPreserved, assertProposalPreserved, activeGenesis } from "./checkpoints.mjs"
import { fixture } from "./fixtures.mjs"
import { assertReviewChain, digest } from "./review-chain.mjs"
import { conformingReview, sessionFamily, toolParts } from "./transcript.mjs"
import { waitSession } from "./wait-session.mjs"

function readsHistory(part) {
  const path = String(part.state?.input?.path ?? part.state?.input?.filePath ?? "").replaceAll("\\", "/")
  return (part.name === "read" && /docs\/base\/|GENESIS\.md$/u.test(path))
    || (part.name === "csdd_revision" && part.state?.input?.artifact === "genesis")
    || (part.name === "grep" && /docs\/base/u.test(path))
}

export async function runPostClosureScenario({ scenario, root, server, session, model, prompt, sessionRoots, checkpoint, adjudicate }) {
  if (!["compatible", "fundamental", "rejection"].includes(scenario)) return []
  const initial = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  const specs = await readFile(join(root, "docs/specs.md"), "utf8")
  let baseline = await documentSnapshot(root)
  if (scenario === "compatible") {
    const evaluation = await server.api("/api/session", "POST", { title: "Compatible feature", agent: "CSDD-Orchestrator", model, location: { directory: root } })
    sessionRoots.push(evaluation.id)
    await server.api(`/api/session/${evaluation.id}/prompt`, "POST", { text: "Soy Smoke Tester. Evalúa añadir marcar mis tareas personales como completadas. Solo propuesta y dudas, sin escritura ni implementación. No cambian propósito, destinatarios ni límites; parte de fuentes vigentes y delega en Canon." })
    await waitSession(server, evaluation.id)
    const family = await sessionFamily(server, evaluation.id)
    assert.equal(family[0].info.outcome, "succeeded")
    assert.ok(family.some(child => child.info.agent === "CSDD-Canon"))
    assert.equal(toolParts(family).some(readsHistory), false, "Feature compatible leyó históricos")
    assert.equal(await readFile(join(root, "docs/base/GENESIS.md"), "utf8"), initial)
    assert.equal(await readFile(join(root, "docs/specs.md"), "utf8"), specs)
    assertPreserved(baseline, await documentSnapshot(root))
    const decision = await adjudicate({ name: "compatible_assessment", state: { snapshot: baseline, family }, actions: { accept: "Evaluación fiel desde fuentes vigentes, sin escritura ni implementación; propuesta o dudas justificadas", violation: "Incumplimiento semántico demostrado con criterio, ubicación y evidencia", stop: "Incompatibilidad alegada o decisión no prevista: adjudicar fuera de la corrida" } })
    assert.equal(decision.action, "accept")
    // Preservar esta familia que no desciende de la sesión inicial.
    await writeFile(join(root, "compatible-transcript.json"), JSON.stringify(family, null, 2))
    return []
  }
  const previousRoadmap = parseStructure("roadmap", baseline["docs/roadmap.md"])
  await writeStructuredArtifact(root, { artifact: "roadmap", operation: "update", data: { sections: { evidence: previousRoadmap.sections.evidence + "\n\n" + fixture.unrelatedEvidence } } })
  baseline = await documentSnapshot(root)
  const evolved = { data: parseStructure("roadmap", baseline["docs/roadmap.md"]), time: Date.now() }
  const lifecycle = parseStructure("roadmap", baseline["docs/roadmap.md"]).metadata.lifecycle_state
  await writeFile(join(root, "evolved-source-fixture.json"), JSON.stringify({ before: previousRoadmap, after: evolved, authority: "Fixture predefinida, no evolución humana real", protected_evidence: fixture.unrelatedEvidence }, null, 2))
  await prompt(fixture.teamChange)
  await checkpoint("fundamental_proposal", state => {
    if (genesisRecords(state.snapshot["docs/base/GENESIS.md"]).length < 2) return false
    const active = activeGenesis(state.snapshot)
    return active.decision.status === "pending" && parseStructure("roadmap", state.snapshot["docs/roadmap.md"]).metadata.genesis_pending_revision === active.revision_id
  }, state => {
    assertProposalPreserved(baseline, state.snapshot)
    assert.ok(state.snapshot["docs/base/GENESIS.md"].startsWith(initial))
  }, { restate_change: fixture.teamChange })
  let proposed = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  assert.ok(proposed.startsWith(initial))
  assert.match(proposed.slice(initial.length), /^# Revisión de GENESIS: [A-Za-z0-9_-]+$/mu)
  assert.equal(await readFile(join(root, "docs/specs.md"), "utf8"), specs)
  if (scenario === "rejection") {
    const rejectedBodyReference = (await calculateArtifactRevision(root, "genesis")).reference
    await prompt("Rechazo explícitamente esta propuesta de revisión. Abandónala y conserva el producto individual vigente, sin proyecciones. Registra mi rechazo y su disposición.")
    await checkpoint("abandoned_proposal", state => activeGenesis(state.snapshot).decision.status === "rejected" && activeGenesis(state.snapshot).materialization.disposition === "abandoned"
      && !parseStructure("roadmap", state.snapshot["docs/roadmap.md"]).metadata.genesis_pending_revision
      && !Object.hasOwn(state.snapshot, "docs/base/.genesis-recovery-pending"), state => {
      assertProposalPreserved(baseline, state.snapshot)
      assert.ok(state.snapshot["docs/base/GENESIS.md"].startsWith(initial))
      assert.equal(state.genesis_reference, rejectedBodyReference)
    })
    const rejected = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
    const rejection = parseStructure("genesis_revision", genesisRecords(rejected).at(-1))
    assert.equal(rejection.decision.status, "rejected")
    assert.equal(rejection.materialization.disposition, "abandoned")
    assert.equal(await readFile(join(root, "docs/specs.md"), "utf8"), specs)
    await assert.rejects(() => access(join(root, "docs/base/.genesis-recovery-pending")), { code: "ENOENT" })
    await prompt("Ahora autorizo redactar solo una nueva propuesta de uso por equipos con los mismos límites expuestos, incluidos un único dispositivo compartido y las exclusiones de cuentas y sincronización, preservando completa la propuesta rechazada y usando otro ID. No materialices sin mi nueva aprobación.")
    await checkpoint("new_proposal_after_rejection", state => genesisRecords(state.snapshot["docs/base/GENESIS.md"]).length === 3 && activeGenesis(state.snapshot).decision.status === "pending"
      && parseStructure("roadmap", state.snapshot["docs/roadmap.md"]).metadata.genesis_pending_revision === activeGenesis(state.snapshot).revision_id, state => {
      assertProposalPreserved(baseline, state.snapshot)
      assert.ok(state.snapshot["docs/base/GENESIS.md"].startsWith(rejected))
    }, { restate_change: fixture.teamChange })
    proposed = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
    assert.ok(proposed.startsWith(rejected))
  }
  const reference = (await calculateArtifactRevision(root, "genesis")).reference
  await checkpoint("present_fundamental_body", state => state.genesis_reference === reference && state.responses.some(text => text.includes(reference)), state => {
    assertProposalPreserved(baseline, state.snapshot)
    assert.equal(activeGenesis(state.snapshot).decision.status, "pending")
    assert.equal(digest(genesisApprovedBody(state.snapshot["docs/base/GENESIS.md"])), reference)
  }, { request_presentation: fixture.present }, { expected_reference: reference, semantic_requirement: "Propuesta nueva presentada como aprobable, fiel al cambio por equipos y fuentes evolucionadas; no mera cita de huella." })
  await prompt(`Apruebo ${reference}\n\nAutorizo aplicar únicamente esta revisión aprobada sobre Specs, Roadmap y glosario actuales, verificarla independientemente y cerrarla si resulta conforme. Levanto para ello la restricción previa de solo redactar, sin regenerar las fuentes ni cambiar el lifecycle. No autorizo Ontology, selección tecnológica ni implementación.`)
  await checkpoint("fundamental_closure", state => activeGenesis(state.snapshot).materialization.stage === "closed", state => {
    assert.ok(state.snapshot["docs/base/GENESIS.md"].startsWith(proposed.slice(0, proposed.lastIndexOf("# Revisión de GENESIS:"))))
    assert.equal(parseStructure("roadmap", state.snapshot["docs/roadmap.md"]).metadata.lifecycle_state, lifecycle)
    assert.ok(parseStructure("roadmap", state.snapshot["docs/roadmap.md"]).sections.evidence.includes(fixture.unrelatedEvidence), "Se perdió evidencia protegida ajena al cambio")
  }, { clarify_authorized_scope: fixture.completeAuthorized }, { baseline, semantic_requirement: "Aplicación únicamente del cambio aprobado; conservación semántica de todo contenido vigente ajeno, sin regeneración ni decisiones técnicas." })
  const final = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  assert.ok(final.startsWith(initial))
  assert.equal((await calculateArtifactRevision(root, "genesis")).reference, reference)
  const tail = parseStructure("genesis_revision", genesisRecords(final).at(-1))
  assert.equal(tail.materialization.stage, "closed")
  const roadmap = await readFile(join(root, "docs/roadmap.md"), "utf8")
  const roadmapData = parseStructure("roadmap", roadmap)
  assert.equal(roadmapData.metadata.lifecycle_state, lifecycle)
  assert.equal(roadmapData.metadata.genesis_pending_revision, undefined)
  const refs = []
  for (const artifact of ["specs", "roadmap", "glossary"]) {
    const ref = (await calculateArtifactRevision(root, artifact)).reference
    assert.equal(tail.materialization[`${artifact}_reference`], ref); refs.push(ref)
  }
  const finalFamily = await sessionFamily(server, session.id)
  assert.ok(finalFamily.some(child => conformingReview(child, session.id, refs, reference)))
  const chain = assertReviewChain({ family: finalFamily, parentID: session.id, references: { genesis: reference, specs: refs[0], roadmap: refs[1], glossary: refs[2] }, roadmap, finalReviewReference: tail.materialization.review_reference, roadmapSeeds: [evolved] })
  await checkpoint("fundamental_review_chain", () => true, () => {}, {}, { chain, baseline, semantic_requirement: "Reportes realmente sustentados; cambios de evidencia administrativos, reglas y contenido ajeno preservados por significado." })
  await assert.rejects(() => access(join(root, "docs/base/.genesis-recovery-pending")), { code: "ENOENT" })
  return []
}
