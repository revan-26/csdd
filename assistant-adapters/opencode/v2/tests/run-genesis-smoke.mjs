import assert from "node:assert/strict"
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { setTimeout as delay } from "node:timers/promises"
import { calculateArtifactRevision, genesisApprovedBody } from "../../common/lib/revision.mjs"
import { installDistribution } from "./install-distribution.mjs"
import { distributionArchive } from "../build/release.mjs"
import { requireV2, startServer } from "./runtime-support.mjs"
import { assistantResponses, conformingReview, sessionFamily, toolParts } from "./transcript.mjs"
import { runPostClosureScenario } from "./scenarios.mjs"
import { writeStructuredArtifact, parseStructure } from "../../common/lib/structured-write.mjs"
import { waitSession } from "./wait-session.mjs"
import { EVALUATOR_VERSION, CheckpointError, createSupervisor, documentSnapshot, assertPreserved, assertPending, activeGenesis, reachCheckpoint } from "./checkpoints.mjs"
import { FIXTURE_VERSION, RECOVERY_FIXTURE_VERSION, fixture, scenarioCriteria } from "./fixtures.mjs"
import { assertRecordedApproval } from "./recovery-approval.mjs"
import { readApprovalEvidence } from "../lib/approval-evidence.mjs"
import { reviewRecords } from "../lib/reviews.mjs"
import { recordedReviewReports } from "./transcript.mjs"
import { assertReviewChain, digest } from "./review-chain.mjs"
import { parseReviewReport } from "../../common/lib/review-report.mjs"

throw new Error("Evaluador histórico genesis-checkpoints-5 retirado del flujo vigente. No ejecutar siete simulaciones: usar suite determinista y conversación humana real sobre el candidato simplificado. Este archivo conserva el procedimiento anterior, no certifica el nuevo contrato.")

requireV2(process.cwd())
const keep = !process.argv.includes("--discard")
const scenarioIndex = process.argv.indexOf("--scenario")
const scenario = scenarioIndex >= 0 ? process.argv[scenarioIndex + 1] : "positive"
const runFixtureVersion = scenario === "recovery" ? RECOVERY_FIXTURE_VERSION : FIXTURE_VERSION
assert.ok(["positive", "guards", "recovery", "nested", "compatible", "fundamental", "rejection"].includes(scenario), "Escenario desconocido")
const modelIndex = process.argv.indexOf("--model")
const selectedModel = modelIndex >= 0 ? process.argv[modelIndex + 1] : undefined
if (!process.argv.includes("--supervised")) throw new Error("Este evaluador requiere --supervised: adjudicación explícita por checkpoint, sin simulador improvisado")
if (!selectedModel) throw new Error("Especificar --model provider/model para fijar modelo y estimar coste antes de ejecutar el smoke")
const callsIndex = process.argv.indexOf("--max-calls")
const maxCalls = callsIndex >= 0 ? Number(process.argv[callsIndex + 1]) : 48
const allowedCalls = ["fundamental", "rejection"].includes(scenario) ? 120 : 72
assert.ok(Number.isInteger(maxCalls) && maxCalls > 0 && maxCalls <= allowedCalls, `Límite permitido para ${scenario}: entre 1 y ${allowedCalls} llamadas`)
const container = await mkdtemp(join(tmpdir(), "csdd-v2-genesis-"))
const zipIndex = process.argv.indexOf("--zip")
const zip = zipIndex >= 0 ? process.argv[zipIndex + 1] : resolve(import.meta.dirname, "../../../../dist", distributionArchive)
let root = container
let distribution
let passed = false
let server
let session
const sessionRoots = []
let lastResponses = []
let checkpoint

try {
  distribution = await installDistribution(container, zip)
  root = distribution.project
  const configPath = join(root, ".opencode/opencode.json")
  const config = JSON.parse(await readFile(configPath, "utf8"))
  config.compaction = { auto: false }
  config.agents = Object.fromEntries(["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Reviewer", "CSDD-Explorer"].map(name => [name, { steps: 16 }]))
  config.plugins.push("./plugins/budget")
  await writeFile(configPath, JSON.stringify(config))
  await mkdir(join(root, ".opencode/plugins/budget"))
  await writeFile(join(root, ".opencode/plugins/budget/package.json"), JSON.stringify({ name: "csdd-budget", type: "module", main: "./index.mjs" }))
  await writeFile(join(root, ".opencode/plugins/budget/index.mjs"), `export default { id: "csdd.test.budget", async setup(ctx) {
  let calls = 0
  await ctx.session.hook("title", event => { event.result = "CSDD Genesis smoke V2" })
  await ctx.session.hook("context", event => {
    if (++calls > ${maxCalls}) throw new Error("Límite del smoke: ${maxCalls} llamadas al modelo")
    event.options.maxTokens = 6000
  })
}}
`)
  server = await startServer(root)
  // Confirmar que el límite del harness está activo antes de admitir prompts.
  const activationDeadline = Date.now() + 30_000
  let ready = false
  while (Date.now() < activationDeadline) {
    const plugins = await server.api("/api/plugin")
    const agents = await server.api("/api/agent")
    ready = JSON.stringify(plugins).includes("csdd.test.budget") && agents.some(agent => agent.id === "CSDD-Orchestrator")
    if (ready) break
    await delay(100)
  }
  assert.ok(ready, "No se confirmó activación del plugin de presupuesto y perfiles")
  const modelSplit = selectedModel.indexOf("/")
  assert.ok(modelSplit > 0, "Modelo debe tener provider/model")
  const [modelID, variant] = selectedModel.slice(modelSplit + 1).split("#")
  const model = { providerID: selectedModel.slice(0, modelSplit), id: modelID, ...(variant ? { variant } : {}) }
  session = await server.api("/api/session", "POST", { title: "CSDD Genesis smoke V2", agent: "CSDD-Orchestrator", model, location: { directory: root } })
  sessionRoots.push(session.id)
  const adjudicate = createSupervisor(root)
  async function prompt(text) {
    const previous = await sessionFamily(server, session.id)
    const previousIDs = new Set(previous[0].messages.map(message => message.id))
    await server.api(`/api/session/${session.id}/prompt`, "POST", { text })
    await waitSession(server, session.id)
    const info = await server.api(`/api/session/${session.id}`)
    if (info.outcome !== "succeeded") throw new CheckpointError("execution_interrupted", `La sesión terminó con outcome ${info.outcome}; no acredita fallo de producto por sí solo`)
    const family = await sessionFamily(server, session.id)
    lastResponses = assistantResponses(family[0].messages.filter(message => !previousIDs.has(message.id)))
  }
  checkpoint = async (name, ready, invariant, clarifications = {}, extra = {}) => reachCheckpoint({ name, prompt, adjudicate,
    observe: async () => {
      const snapshot = await documentSnapshot(root)
      const reference = snapshot["docs/base/GENESIS.md"] ? digest(genesisApprovedBody(snapshot["docs/base/GENESIS.md"])) : undefined
      const approval_evidence = reference ? await readApprovalEvidence(root, activeGenesis(snapshot).decision, reference) : undefined
      const review_records = reference ? await reviewRecords(root) : []
      return { snapshot, genesis_reference: reference, approval_evidence, review_records, responses: lastResponses, family: await sessionFamily(server, session.id), ...extra }
    }, ready, invariant, clarifications })
  await writeFile(join(root, "fixture.json"), JSON.stringify({ version: runFixtureVersion, evaluator_version: EVALUATOR_VERSION, scenario, decisions: fixture, criteria: scenarioCriteria[scenario] }, null, 2))
  await prompt(fixture.initial + (scenario === "rejection" ? fixture.rejectionDetails : "") + (scenario === "nested" ? fixture.nested : ""))
  await checkpoint("initial_draft", state => !!state.snapshot["docs/base/GENESIS.md"], state => {
    if (state.snapshot["docs/base/GENESIS.md"]) assertPending(state.snapshot, state.review_records.filter(r => r.report.review_kind === "draft").map(r => r.path))
    else assert.deepEqual(Object.keys(state.snapshot), [])
  }, { restate_scope: fixture.initial + (scenario === "rejection" ? fixture.rejectionDetails : "") })
  for (const file of ["specs.md", "roadmap.md", "glossary.md"]) await assert.rejects(() => access(join(root, "docs", file)))
  await prompt(fixture.present)
  for (const file of ["specs.md", "roadmap.md", "glossary.md"]) await assert.rejects(() => access(join(root, "docs", file)))
  let approved = await calculateArtifactRevision(root, "genesis")
  await checkpoint("present_current_body", state => state.genesis_reference === approved.reference && state.responses.some(text => text.includes(approved.reference)), state => assertPending(state.snapshot, state.review_records.filter(r => r.report.review_kind === "draft").map(r => r.path)), { request_presentation: fixture.present }, { expected_reference: approved.reference, semantic_requirement: "Informe vigente presentado como propuesta aprobable; no cita, ejemplo ni solo huella. Confirmar fidelidad a decisiones de fixture." })
  if (scenario === "guards") {
    for (const response of ["Me parece bien", `Apruebo sha256:${"0".repeat(64)}`]) {
      const before = await documentSnapshot(root)
      await prompt(response)
      for (const artifact of ["specs", "roadmap", "glossary"]) await assert.rejects(() => access(join(root, `docs/${artifact}.md`)), { code: "ENOENT" })
      const after = await documentSnapshot(root)
      assertPending(after)
      assertPreserved(before, after, ["docs/base/GENESIS.md"])
      assert.equal(genesisApprovedBody(before["docs/base/GENESIS.md"]), genesisApprovedBody(after["docs/base/GENESIS.md"]))
    }
    const genesisPath = join(root, "docs/base/GENESIS.md")
    const draft = await readFile(genesisPath, "utf8")
    const structure = parseStructure("genesis", draft)
    await writeStructuredArtifact(root, { artifact: "genesis", operation: "update", data: { sections: { first_slice: structure.sections.first_slice + "\n\n### Aclaración De Prueba\n\nNo habrá notificaciones en este slice." } } })
    const changed = await documentSnapshot(root)
    await prompt(`Apruebo ${approved.reference}`)
    for (const artifact of ["specs", "roadmap", "glossary"]) await assert.rejects(() => access(join(root, `docs/${artifact}.md`)), { code: "ENOENT" })
    assertPending(await documentSnapshot(root))
    assertPreserved(changed, await documentSnapshot(root), ["docs/base/GENESIS.md"])
    assert.equal(genesisApprovedBody(changed["docs/base/GENESIS.md"]), genesisApprovedBody((await documentSnapshot(root))["docs/base/GENESIS.md"]))
    approved = await calculateArtifactRevision(root, "genesis")
    // Resolución fijada en la fixture ANTES de ejecutar; no se deriva del
    // texto que haya producido el modelo ni convierte la aprobación obsoleta.
    await prompt(fixture.changedByHuman)
    await checkpoint("present_changed_body", state => state.genesis_reference === approved.reference && state.responses.some(text => text.includes(approved.reference)), state => {
      assertPending(state.snapshot); assertPreserved(changed, state.snapshot, ["docs/base/GENESIS.md"])
      assert.equal(genesisApprovedBody(changed["docs/base/GENESIS.md"]), genesisApprovedBody(state.snapshot["docs/base/GENESIS.md"]))
    }, { request_presentation: fixture.present }, { expected_reference: approved.reference, semantic_requirement: "Presentación actualizada y aprobable; identidad/procedencia del cambio explícitas, sin aprobación todavía." })
  }
  let recoverySnapshot
  if (scenario === "recovery") {
    const originalSessionID = session.id
    const before = await documentSnapshot(root)
    await prompt(`Apruebo ${approved.reference}\n\n${fixture.recoveryRecordOnly}`)
    await checkpoint("recorded_approval_before_recovery", state => activeGenesis(state.snapshot).decision.status === "approved", state => {
      const data = activeGenesis(state.snapshot)
      assert.equal(state.genesis_reference, approved.reference)
      assert.equal(data.materialization.stage, "pending")
      assertPreserved(before, state.snapshot, ["docs/base/GENESIS.md", ...(state.approval_evidence?.status === "recorded" ? [state.approval_evidence.path] : [])])
      if (data.decision.status === "approved") assertRecordedApproval({ sessionID: originalSessionID, messages: state.family[0].messages, decision: data.decision, reference: approved.reference })
    }, {}, { semantic_requirement: "Aprobación simulada realmente registrada e identificable, no sesión inventada; decisión persistida y ninguna proyección/cierre. No autentica autoridad humana real." })
    recoverySnapshot = activeGenesis(await documentSnapshot(root))
    const originalFamily = await sessionFamily(server, originalSessionID)
    const evidence = assertRecordedApproval({ sessionID: originalSessionID, messages: originalFamily[0].messages, decision: recoverySnapshot.decision, reference: approved.reference })
    await writeFile(join(root, "recovery-approval-evidence.json"), JSON.stringify(evidence, null, 2))
    session = await server.api("/api/session", "POST", { title: "CSDD recovery fixture", agent: "CSDD-Orchestrator", model, location: { directory: root } })
    sessionRoots.push(session.id)
    await prompt(`Soy Smoke Tester. Autorizo continuar la materialización y cierre del registro aprobado de esta fixture. La aprobación simulada ya fue registrada en opencode-session:${originalSessionID}, mensaje ${evidence.message_id}; su referencia está en la decisión durable. La restricción de no materializar era exclusivamente para detener la preparación anterior y queda levantada para completar Genesis. Conserva cuerpo y decisión; no solicites aprobación duplicada. Comprueba esa procedencia y declara que el ensayo no autentica autoridad humana real. No inicies Ontology, selección tecnológica ni implementación.`)
  } else await prompt(`Apruebo ${approved.reference}\n\nCon esta aprobación autorizo materializar Specs, Roadmap y glosario, realizar la revisión independiente y cerrar Genesis si resulta conforme. La restricción anterior de no proyectar era para la preparación y presentación previas a mi aprobación; queda levantada exclusivamente para completar Genesis. No autorizo Ontology, selección tecnológica ni implementación.`)
  await checkpoint("initial_closure", state => activeGenesis(state.snapshot).materialization.stage === "closed", state => {
    const data = activeGenesis(state.snapshot)
    if (data.decision.status === "approved") assert.equal(data.decision.approved_content_reference, approved.reference)
    if (recoverySnapshot) { assert.deepEqual(data.sections, recoverySnapshot.sections); assert.deepEqual(data.decision, recoverySnapshot.decision) }
    for (const key of Object.keys(state.snapshot)) assert.ok(["docs/base/GENESIS.md", "docs/base/.genesis-recovery-pending", "docs/specs.md", "docs/roadmap.md", "docs/glossary.md", ...state.review_records.map(r => r.path), ...(state.approval_evidence?.status === "recorded" ? [state.approval_evidence.path] : [])].includes(key), `Artefacto prematuro: ${key}`)
  }, { clarify_authorized_scope: fixture.completeAuthorized }, { semantic_requirement: "Conformidad documental y limitaciones visibles. Pregunta que requiera nueva decisión: stop. Recovery conserva aprobación simulada realmente registrada sin autenticar autoridad humana real." })
  const final = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  const finalData = parseStructure("genesis", final)
  assert.equal((await calculateArtifactRevision(root, "genesis")).reference, approved.reference)
  assert.equal(finalData.decision.status, "approved")
  assert.equal(finalData.materialization.stage, "closed")
  assert.ok(finalData.decision.approval_reference.endsWith(`statement:Apruebo ${approved.reference}`))
  const references = []
  for (const artifact of ["specs", "roadmap", "glossary"]) {
    const result = await calculateArtifactRevision(root, artifact)
    assert.equal(finalData.materialization[`${artifact}_reference`], result.reference)
    references.push(result.reference)
  }
  const roadmap = await readFile(join(root, "docs/roadmap.md"), "utf8")
  const roadmapData = parseStructure("roadmap", roadmap)
  assert.equal(roadmapData.metadata.genesis_closure, "verified")
  assert.equal(roadmapData.metadata.lifecycle_state, "pre_fr")
  for (const artifact of ["ONTOLOGY.md", "TOPOLOGY.md"]) await assert.rejects(() => access(join(root, "docs/base", artifact)))
  const family = await sessionFamily(server, session.id)
  await writeFile(join(root, "transcript.json"), JSON.stringify(family, null, 2))
  assert.ok(family.some(child => child.info.agent === "CSDD-Canon"))
  assert.ok(toolParts(family).some(part => part.name === "csdd_write" && part.state.status === "completed"))
  assert.ok(family.some(child => conformingReview(child, session.id, references, approved.reference)), "Falta respuesta independiente del Reviewer con las huellas finales")
  const chain = assertReviewChain({ family, parentID: session.id, references: { genesis: approved.reference, specs: references[0], roadmap: references[1], glossary: references[2] }, roadmap, finalReviewReference: finalData.materialization.review_reference })
  await checkpoint("initial_review_chain", () => true, () => {}, {}, { chain, semantic_requirement: "Contrastar reportes con fuentes reales: fidelidad completa y cambios de Procedencia Y Evidencia exclusivamente administrativos. No aceptar por verdict genérico." })
  await assert.rejects(() => access(join(root, "docs/base/.genesis-recovery-pending")), { code: "ENOENT" })
  if (scenario === "nested") {
    assert.ok(family.some(child => child.info.agent === "CSDD-Reviewer" && child.info.outcome === "succeeded"
      && family.some(parent => parent.info.id === child.info.parentID && parent.info.agent === "CSDD-Canon")
      && recordedReviewReports(child).some(({ report }) => {
        return report?.review_kind === "draft" && report.review_reference === `opencode-session:${child.info.id}`
      })), "Falta crítica draft real de segundo nivel; una sesión sin reporte no basta")
    await checkpoint("provisional_draft_review", () => true, () => {}, {}, { family, semantic_requirement: "Crítica draft anterior a aprobación; defectos materiales resueltos antes de presentar. No sustituye revisión final independiente." })
  }
  const additionalFamily = await runPostClosureScenario({ scenario, root, server, session, model, prompt, sessionRoots, checkpoint, adjudicate })
  const finalFamily = (await Promise.all(sessionRoots.map(id => sessionFamily(server, id)))).flat().concat(additionalFamily)
  await writeFile(join(root, "transcript.json"), JSON.stringify(finalFamily, null, 2))
  passed = true
  const report = { status: "passed", evaluator_version: EVALUATOR_VERSION, fixture_version: runFixtureVersion, supervised: true, scenario, max_calls: maxCalls, workspace: root, distribution, opencode: "2.0.22", session_id: session.id, model: selectedModel, approved_reference: approved.reference, usage: finalFamily.map(child => ({ id: child.info.id, tokens: child.info.tokens, cost: child.info.cost })), kept: keep }
  await writeFile(join(root, "smoke-result.json"), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  let family = []
  let evidenceError
  if (server && session) {
    await server.api(`/api/session/${session.id}/interrupt`, "POST").catch(() => {})
    try {
      family = (await Promise.all(sessionRoots.map(id => sessionFamily(server, id)))).flat()
      await writeFile(join(root, "transcript.json"), JSON.stringify(family, null, 2))
    } catch (failure) { evidenceError = String(failure) }
  }
  await writeFile(join(root, "smoke-result.json"), JSON.stringify({ status: error.category === "experiment_unresolved" ? "unresolved" : error.category === "execution_interrupted" ? "interrupted" : "failed", failure_category: error.category ?? "unattributed", evaluator_version: EVALUATOR_VERSION, fixture_version: runFixtureVersion, supervised: true, scenario, max_calls: maxCalls, error: String(error), evidence_error: evidenceError, distribution, model: selectedModel, opencode: "2.0.22", usage: family.map(child => ({ id: child.info.id, tokens: child.info.tokens, cost: child.info.cost })) }, null, 2))
  console.error(`Smoke detenido (${error.category ?? "unattributed"}); fixture preservada: ${root}`)
  throw error
} finally {
  server?.stop()
  if (passed && !keep) await rm(container, { recursive: true, force: true })
}
