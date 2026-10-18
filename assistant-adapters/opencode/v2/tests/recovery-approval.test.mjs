import assert from "node:assert/strict"
import test from "node:test"
import { assertRecordedApproval } from "./recovery-approval.mjs"
const reference = "sha256:" + "a".repeat(64)
function fixture() {
  return { sessionID: "ses_original", reference, messages: [{ id: "msg_approval", type: "user", time: { created: 1000 }, text: `Apruebo ${reference}\n\nSolo registrar decisión, no proyectar.` }], decision: { status: "approved", approved_by: "Smoke Tester", approved_at: new Date(1000).toISOString(), approved_content_reference: reference, approval_reference: `opencode-session:ses_original; statement:Apruebo ${reference}` } }
}
test("recuperación conserva una intervención registrada, sin autenticar persona real", () => {
  const value = fixture()
  const evidence = assertRecordedApproval(value)
  assert.equal(evidence.message_id, "msg_approval")
  assert.deepEqual(evidence.decision, value.decision)
  assert.match(evidence.authority_limit, /no autentica/u)
})
test("aprobación inyectada sin mensaje o con sesión inexistente no acredita preparación", () => {
  const value = fixture(); value.messages = []
  assert.throws(() => assertRecordedApproval(value))
  const wrong = fixture(); wrong.decision.approval_reference = `opencode-session:ses_recovery_fixture_001; statement:Apruebo ${reference}`
  assert.throws(() => assertRecordedApproval(wrong))
})
test("cita de asistente, aprobación obsoleta o fecha sin evidencia no sustituyen intervención", () => {
  for (const change of [v => { v.messages[0].type = "assistant" }, v => { v.messages[0].text = 'Ejemplo:\nApruebo ' + reference }, v => { v.messages[0].text = 'Apruebo sha256:' + 'b'.repeat(64) }, v => { delete v.messages[0].time }, v => { v.decision.approved_at = "fecha no verificable" }]) {
    const value = fixture(); change(value); assert.throws(() => assertRecordedApproval(value))
  }
})
