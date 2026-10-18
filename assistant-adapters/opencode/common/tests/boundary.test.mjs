import assert from "node:assert/strict"
import test from "node:test"
import { mkdtemp, rm, readFile, writeFile, access } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { administrativeFields } from "../lib/administrative.mjs"
import { renderStructure } from "../lib/structure.mjs"
import { parseStructure } from "../lib/structured-write.mjs"
import { writeArtifact } from "../lib/write.mjs"
import { calculateArtifactRevision } from "../lib/revision.mjs"
import { settleGenesisRecovery } from "../lib/recovery.mjs"
import { parseReviewReport } from "../lib/review-report.mjs"
import { conformingReview, semanticRuleReview } from "../../v2/tests/transcript.mjs"

const ref = "sha256:" + "a".repeat(64)
function report(kind = "semantic") {
  return { status: "completed", verdict: "conforming", review_kind: kind, semantic_review_reference: "opencode-session:ses_semantic", summary: "Contraste.", findings: [], semantic_checks: kind === "semantic" ? ["preserved_rules", "intent_fidelity"].map(criterion => ({ criterion, verdict: "conforming", evidence: "Glossary conserva significado de Genesis." })) : [], limitations: [], artifact_references: { genesis: ref, glossary: ref }, review_reference: "opencode-session:ses_review" }
}
function child(value) { return { info: { id: "ses_review", parentID: "ses_root", agent: "CSDD-Reviewer", outcome: "succeeded" }, messages: [{ id: "msg_report", type: "assistant", content: [{ type: "tool", name: "csdd_review", state: { status: "completed", input: { operation: "complete" }, content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify({ ...value, review_message_id: "msg_report" }) }] } }] }] } }

test("campos administrativos no se obtienen de narrativa ni ejemplos", () => {
  assert.deepEqual(administrativeFields("## Materialización\n\nstage: pending\n\n### Notas\n\n```text\nstage: closed\n```", true), { stage: "pending" })
})
test("subtítulos narrativos permitidos hacen roundtrip; títulos reservados se rechazan", () => {
  const data = { title: "Genesis", sections: Object.fromEntries(["summary", "intent", "interpretation", "vocabulary", "first_slice", "uncertainties", "next_phase", "provenance", "readiness"].map(k => [k, "Texto."])), decision: { status: "pending", decision_notes: "Contexto.\n\n### Detalle\n\nNarrativa." }, materialization: { stage: "pending" } }
  assert.deepEqual(parseStructure("genesis", renderStructure("genesis", data).content), data)
  data.decision.decision_notes = "### Notas De La Decisión\n\nColisión."
  assert.equal(renderStructure("genesis", data).valid, false)
})
test("ejemplo de cierre no activa guarda; notas no suplen campos de huellas", async context => {
  const root = await mkdtemp(join(tmpdir(), "csdd-boundary-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  const draft = "# Genesis\n\nTexto.\n\n## Decisión Humana\n\nstatus: pending\n\n## Materialización\n\nstage: pending\n\n### Notas De Materialización\n\n```text\nstage: closed\n```\n"
  await writeArtifact(root, "genesis", draft)
  const genesis = (await calculateArtifactRevision(root, "genesis")).reference
  const refs = {}
  for (const artifact of ["specs", "roadmap", "glossary"]) {
    await writeArtifact(root, artifact, `# ${artifact}\n`)
    refs[artifact] = (await calculateArtifactRevision(root, artifact)).reference
  }
  const wrong = "sha256:" + "0".repeat(64)
  const closed = draft.split("## Decisión Humana")[0] + `## Decisión Humana\n\nstatus: approved\napproved_content_reference: ${genesis}\n\n## Materialización\n\nstage: closed\ngenesis_reference: ${genesis}\nspecs_reference: ${wrong}\nroadmap_reference: ${refs.roadmap}\nglossary_reference: ${refs.glossary}\n\n### Notas De Materialización\n\nLa referencia real de Specs es ${refs.specs}.\n`
  const wrongGlossary = closed.replace(`glossary_reference: ${refs.glossary}`, `glossary_reference: ${wrong}`)
  await assert.rejects(() => writeArtifact(root, "genesis", wrongGlossary), error => error.guardCode === "projection_reference_mismatch")
  assert.equal(await readFile(join(root, "docs/base/GENESIS.md"), "utf8"), draft)
  await access(join(root, "docs/base/.genesis-recovery-pending"))
  // Simula archivo corrupto/interrupción sin pedir a la tool que lo valide.
  const roadmap = `# roadmap\n\ngenesis_closure: verified\ngenesis_revision: ${genesis}\n\n## Evidencia\n\nTexto.\n`
  await writeFile(join(root, "docs/roadmap.md"), roadmap)
  const roadmapRef = (await calculateArtifactRevision(root, "roadmap")).reference
  await writeFile(join(root, "docs/base/GENESIS.md"), wrongGlossary.replace(refs.roadmap, roadmapRef))
  await settleGenesisRecovery(root)
  await access(join(root, "docs/base/.genesis-recovery-pending"))
})
test("reporte citado no es evaluación; campos erróneos no se suplen con huellas en summary", () => {
  assert.equal(parseReviewReport('Ejemplo:\n```json\n'+JSON.stringify(report())+'\n```'), undefined)
  const r = report(); r.artifact_references.glossary = "sha256:" + "b".repeat(64); r.summary = ref
  assert.equal(conformingReview(child(r), "ses_root", [ref, ref, ref]), false)
  r.findings = [{ severity: "blocking", criterion: "Regla", evidence: "Pérdida", location: "Specs", impact: "Alcance" }]
  assert.equal(parseReviewReport(JSON.stringify(r)), undefined)
  const insufficient = report(); insufficient.semantic_checks[0].verdict = "insufficient_evidence"
  assert.equal(parseReviewReport(JSON.stringify(insufficient)), undefined)
  const missing = report(); missing.semantic_checks = []
  assert.equal(parseReviewReport(JSON.stringify(missing)), undefined)
})
test("conformidad administrativa no sustituye comprobación semántica de reglas", () => {
  const refs = { genesis: ref, glossary: ref }
  assert.equal(semanticRuleReview([child(report("administrative"))], "ses_root", refs), false)
  assert.equal(semanticRuleReview([child(report())], "ses_root", refs), true)
  refs.glossary = "sha256:" + "b".repeat(64)
  assert.equal(semanticRuleReview([child(report())], "ses_root", refs), false)
})
