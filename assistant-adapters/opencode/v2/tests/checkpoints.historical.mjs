// Evaluador histórico genesis-checkpoints-5; no pertenece a la suite vigente.
import assert from "node:assert/strict"
import test from "node:test"
import { mkdtemp, rm, mkdir, writeFile, readdir, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { renderStructure } from "../../common/lib/structure.mjs"
import { parseReviewReport } from "../../common/lib/review-report.mjs"
import { CheckpointError, assertPreserved, assertProposalPreserved, documentSnapshot, validateAdjudication, reachCheckpoint, createSupervisor } from "./checkpoints.mjs"
import { assertReviewChain, digest, roadmapVersions } from "./review-chain.mjs"
import { conformingReview, semanticRuleReview } from "./transcript.mjs"

const ref = "sha256:" + "a".repeat(64)
const roadmap = { title: "Roadmap", metadata: { lifecycle_state: "pre_fr", genesis_closure: "pending" }, sections: { direction: "Conservar pendientes.", now: "Registro y consulta.", evidence: "Aprobación ficticia." } }
const markdown = data => renderStructure("roadmap", data).content
const refs = data => ({ genesis: ref, specs: ref, roadmap: digest(markdown(data)), glossary: ref })
function report(kind, references, id) {
  return { status: "completed", verdict: "conforming", review_kind: kind, summary: "Evaluación.", findings: [], semantic_checks: kind === "semantic" ? [{ criterion: "preserved_rules", verdict: "conforming", evidence: "Contraste de alcance y condición de registro en Genesis y Specs." }] : [], limitations: [], artifact_references: references, review_reference: `opencode-session:${id}`, ...(kind === "administrative" ? { semantic_review_reference: "opencode-session:ses_semantic" } : {}) }
}
function child(r, time) { return { info: { id: r.review_reference.slice("opencode-session:".length), parentID: "ses_root", agent: "CSDD-Reviewer", outcome: "succeeded" }, messages: [{ id: `msg_${time}`, type: "assistant", time: { created: time }, content: [{ type: "tool", name: "csdd_review", state: { status: "completed", input: { operation: "complete" }, content: [{ type: "text", text: JSON.stringify({ ...r, review_message_id: `msg_${time}` }) }] } }] }] } }
function write(data, time, operation = "create") {
  return { type: "tool", name: "csdd_write", time: { completed: time }, state: { status: "completed", input: { artifact: "roadmap", operation, data }, content: [{ type: "text", text: JSON.stringify({ status: "written" }) }] } }
}
function chain() {
  const current = structuredClone(roadmap)
  current.metadata.genesis_closure = "verified"
  current.metadata.genesis_revision = ref
  current.metadata.genesis_review_reference = "opencode-session:ses_semantic"
  current.sections.evidence += "\n\nReporte y límites disponibles."
  return { family: [{ info: { id: "ses_canon", agent: "CSDD-Canon" }, messages: [write(roadmap, 1), write(current, 20, "update")] }, child(report("semantic", refs(roadmap), "ses_semantic"), 10), child(report("administrative", refs(current), "ses_admin"), 30)], parentID: "ses_root", references: refs(current), roadmap: markdown(current), finalReviewReference: "opencode-session:ses_admin" }
}

test("snapshot protege Glossary, Roadmap, historia y nuevos archivos", async context => {
  const root = await mkdtemp(join(tmpdir(), "csdd-checkpoints-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, "docs/base"), { recursive: true })
  await writeFile(join(root, "docs/glossary.md"), "Términos.")
  await writeFile(join(root, "docs/base/GENESIS.md"), "Historia.")
  const before = await documentSnapshot(root)
  await writeFile(join(root, "docs/glossary.md"), "Otro significado.")
  assert.throws(() => assertPreserved(before, { ...before, "docs/roadmap.md": "Nuevo" }))
  const removed = { ...before }; delete removed["docs/glossary.md"]
  assert.throws(() => assertPreserved(before, removed))
  assert.throws(() => assertPreserved(before, { ...before, "docs/base/GENESIS.md": "Historia distinta" }))
  assert.throws(() => assertPreserved(before, { ...before, "docs/glossary.md": "Otro significado." }))
  assert.notDeepEqual(await documentSnapshot(root), before)
})

test("adjudicación exige identidad del checkpoint, digest, acción autorizada y evidencia", () => {
  const request = { checkpoint: "001", request_digest: "digest", actions: { accept: "Presentación actual", stop: "No previsto" } }
  const decision = { checkpoint: "001", request_digest: "digest", action: "accept", evidence: "Informe vigente presentado; no es una cita." }
  assert.equal(validateAdjudication(request, decision), decision)
  for (const patch of [{ checkpoint: "002" }, { request_digest: "old" }, { action: "invent_new_requirement" }, { evidence: "" }]) assert.throws(() => validateAdjudication(request, { ...decision, ...patch }), CheckpointError)
})

test("paráfrasis y órdenes diferentes se resuelven por estado y adjudicación, no palabras", async () => {
  for (const responses of [["¿Mantienes el cambio?", "Versión actual disponible."], ["El contenido difiere.", "¿Cuál prefieres?", "Presento la propuesta vigente."]]) {
    let ready = false
    let sent = 0
    await reachCheckpoint({ name: "present", observe: async () => ({ ready, responses }), ready: s => s.ready,
      invariant: () => {}, clarifications: { retain_change: "Decisión fijada: conservar el cambio, aún sin aprobar." },
      prompt: async text => { assert.equal(text, "Decisión fijada: conservar el cambio, aún sin aprobar."); sent++; ready = true },
      adjudicate: async request => ({ action: request.state.ready ? "accept" : "retain_change", evidence: "Pregunta pertinente; decisión ya definida en fixture." }) })
    assert.equal(sent, 1)
  }
})

test("pregunta fuera de fixture detiene sin inventar respuesta", async () => {
  let sent = false
  await assert.rejects(() => reachCheckpoint({ name: "unknown", observe: async () => ({ question: "Decisión abierta" }), ready: () => false,
    invariant: () => {}, prompt: async () => { sent = true }, adjudicate: async () => ({ action: "stop", evidence: "No hay decisión previa." }) }), CheckpointError)
  assert.equal(sent, false)
})

test("incumplimiento de invariante no se salva mediante aclaración o veredicto", async () => {
  let judged = false
  await assert.rejects(() => reachCheckpoint({ name: "guard", observe: async () => ({ premature: true }), ready: () => true,
    invariant: s => assert.equal(s.premature, false), adjudicate: async () => { judged = true; return { action: "accept" } }, prompt: async () => {} }))
  assert.equal(judged, false)
})

test("repetición de aclaración se detiene y no reinicia presupuesto", async () => {
  let sent = 0
  await assert.rejects(() => reachCheckpoint({ name: "stalled", observe: async () => ({}), ready: () => false, invariant: () => {},
    clarifications: { explain: "Alcance ya fijado" }, prompt: async () => { sent++ }, adjudicate: async () => ({ action: "explain" }) }), CheckpointError)
  assert.equal(sent, 1)
})

test("draft no requiere salidas inexistentes y no acredita revisión de cierre", () => {
  const draft = { ...report("semantic", { genesis: ref }, "ses_draft"), review_kind: "draft", semantic_checks: [{ criterion: "intent_fidelity", verdict: "conforming", evidence: "Borrador fiel a intención explícita." }] }
  assert.ok(parseReviewReport(JSON.stringify(draft)))
  assert.equal(conformingReview(child(draft, 1), "ses_root", [ref, ref, ref], ref), false)
  assert.equal(semanticRuleReview([child(draft, 1)], "ses_root", { genesis: ref, specs: ref, roadmap: ref, glossary: ref }), false)
  draft.artifact_references.specs = ref
  assert.equal(parseReviewReport(JSON.stringify(draft)), undefined)
})

test("semantic genérico no satisface comprobación administrative final", () => {
  const semantic = report("semantic", { genesis: ref, specs: ref, roadmap: ref, glossary: ref }, "ses_semantic")
  assert.equal(conformingReview(child(semantic, 10), "ses_root", [ref, ref, ref], ref), false)
  assert.equal(semanticRuleReview([child(semantic, 10)], "ses_root", { genesis: ref, specs: ref, roadmap: digest("Otro"), glossary: ref }), false)
})

test("cadena vincula semantic anterior con versión final y snapshot Roadmap", () => {
  const evidence = assertReviewChain(chain())
  assert.equal(evidence.semantic.review_kind, "semantic")
  assert.equal(evidence.administrative.review_kind, "administrative")
})

test("referencia a sesión distinta, futura o snapshot ausente no acredita cadena", () => {
  for (const mutate of [c => { c.family[2].messages[0].time.created = 5 }, c => { c.finalReviewReference = "opencode-session:ses_other" }, c => { c.family[0].messages.shift() }]) {
    const c = chain(); mutate(c); assert.throws(() => assertReviewChain(c))
  }
})

test("Roadmap no puede cambiar significado o lifecycle después de semantic", () => {
  for (const change of [data => { data.sections.now = "Otro alcance." }, data => { data.metadata.lifecycle_state = "post_fr" }]) {
    const c = chain()
    const changed = structuredClone(roadmap); change(changed)
    c.family[0].messages.splice(1, 0, write(changed, 15, "update"))
    assert.throws(() => assertReviewChain(c))
  }
})

test("snapshot de evolución externa requiere evidencia explícita y fecha anterior", () => {
  const c = chain()
  c.family[0].messages.shift()
  c.roadmapSeeds = [{ data: roadmap, time: 1 }]
  assert.ok(assertReviewChain(c))
  c.roadmapSeeds[0].time = 11
  assert.throws(() => assertReviewChain(c))
})

test("reconstrucción resuelve referencias solo con observaciones estructuradas anteriores", () => {
  const data = structuredClone(roadmap)
  data.metadata.genesis_revision = "{{csdd_revision:genesis}}"
  data.sections.evidence = "Cuerpo: {{csdd_revision:genesis}}"
  const observation = { type: "tool", name: "csdd_revision", time: { completed: 1 }, state: { status: "completed", content: [{ type: "text", text: JSON.stringify({ artifact: "genesis", reference: ref }) }] } }
  const family = [{ messages: [observation, write(data, 2)] }]
  family[0].messages[1].state.content[0].text = JSON.stringify({ status: "written", applied_data: data })
  const versions = roadmapVersions(family)
  assert.equal(versions[0].data.metadata.genesis_revision, ref)
  assert.equal(versions[0].data.sections.evidence, `Cuerpo: ${ref}`)
  observation.time.completed = 3
  assert.equal(roadmapVersions(family).length, 0)
})

test("snapshot real de begin conserva versión revisada sin reconstruir datos del LLM", () => {
  const snapshot = markdown(roadmap)
  const begin = { type: "tool", name: "csdd_review", time: { completed: 2 }, state: { status: "completed", input: { operation: "begin" }, content: [{ type: "text", text: JSON.stringify({ status: "prepared", snapshots: { roadmap: snapshot }, artifact_references: { roadmap: digest(snapshot) } }) }] } }
  assert.equal(roadmapVersions([{ messages: [begin] }])[0].reference, digest(snapshot))
  begin.state.content[0].text = JSON.stringify({ status: "prepared", snapshots: { roadmap: snapshot }, artifact_references: { roadmap: ref } })
  assert.throws(() => roadmapVersions([{ messages: [begin] }]), /Snapshot real/)
})

test("supervisión sin respuesta conserva request y se detiene como experimento no resuelto", async context => {
  const root = await mkdtemp(join(tmpdir(), "csdd-supervision-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  const supervise = createSupervisor(root, { timeout: 1 })
  await assert.rejects(() => supervise({ name: "present", state: { responses: ["¿Quién cambió esto?"] }, actions: { stop: "Decisión no prevista" } }), error => error.category === "experiment_unresolved")
  assert.deepEqual(await readdir(join(root, "supervision")), ["001.request.json"])
  const request = JSON.parse(await readFile(join(root, "supervision/001.request.json"), "utf8"))
  assert.equal(request.checkpoint, "001")
  assert.match(request.request_digest, /^[a-f0-9]{64}$/u)
})

test("adjudicación distingue defecto semántico demostrado de decisión abierta", async () => {
  await assert.rejects(() => reachCheckpoint({ name: "fidelity", observe: async () => ({ outcome: "Omitió una regla" }), ready: () => true,
    invariant: () => {}, prompt: async () => {}, adjudicate: async () => ({ action: "violation", evidence: "Criterio: fidelidad; ubicación: Specs; evidencia: regla de registro perdida." }) }), error => error.category === "product_violation")
})

test("propuesta admite indicador pendiente sin permitir cambios de producto", () => {
  const before = { "docs/roadmap.md": markdown(roadmap), "docs/specs.md": "Specs", "docs/glossary.md": "Glossary", "docs/base/GENESIS.md": "Historia" }
  const pending = structuredClone(roadmap)
  pending.metadata.genesis_pending_revision = "revision_1"
  const after = { ...before, "docs/roadmap.md": markdown(pending), "docs/base/GENESIS.md": "Historia y propuesta" }
  assertProposalPreserved(before, after)
  pending.sections.now = "Nuevo alcance sin aprobar"
  assert.throws(() => assertProposalPreserved(before, { ...after, "docs/roadmap.md": markdown(pending) }))
  assert.throws(() => assertProposalPreserved(before, { ...after, "docs/glossary.md": "Otro significado" }))
})

test("supervisión registra exactamente la decisión validada que utilizó", async context => {
  const root = await mkdtemp(join(tmpdir(), "csdd-supervision-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  const supervise = createSupervisor(root, { timeout: 5000 })
  const pending = supervise({ name: "present", state: { responses: ["Informe vigente."] }, actions: { accept: "Presentación aprobable", stop: "No previsto" } })
  let request
  for (let attempt = 0; attempt < 100; attempt++) {
    try { request = JSON.parse(await readFile(join(root, "supervision/001.request.json"), "utf8")); break }
    catch (error) { if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error }
    await delay(20)
  }
  assert.ok(request)
  const decision = { checkpoint: request.checkpoint, request_digest: request.request_digest, action: "accept", evidence: "Criterio de presentación: informe vigente completo, no cita." }
  await writeFile(join(root, "supervision/001.decision.json"), JSON.stringify(decision))
  assert.deepEqual(await pending, decision)
  const recorded = JSON.parse(await readFile(join(root, "supervision/001.adjudication.json"), "utf8"))
  assert.equal(recorded.request_digest, request.request_digest)
  assert.equal(recorded.evidence, decision.evidence)
  assert.ok(recorded.observed_at)
})
