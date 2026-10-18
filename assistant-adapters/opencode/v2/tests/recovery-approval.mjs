import assert from "node:assert/strict"

// Un mensaje real del ensayo no autentica una persona real, pero sí evita
// atribuir la aprobación de fixture a una sesión/transcript inexistente.
export function assertRecordedApproval({ sessionID, messages, decision, reference }) {
  assert.equal(decision.status, "approved")
  assert.equal(decision.approved_content_reference, reference)
  assert.equal(decision.approved_by, "Smoke Tester")
  assert.equal(decision.approval_reference, `opencode-session:${sessionID}; statement:Apruebo ${reference}`)
  const message = messages.find(message => message.type === "user" && typeof message.text === "string"
    && message.text.split(/\r?\n/u)[0] === `Apruebo ${reference}`)
  assert.ok(message?.id && Number.isFinite(message.time?.created), "No existe intervención de aprobación registrada e identificable")
  assert.ok(Number.isFinite(Date.parse(decision.approved_at)), "Fecha de aprobación no verificable")
  return { session_id: sessionID, message_id: message.id, statement: message.text, message_created: message.time.created, decision: structuredClone(decision), reference, authority_limit: "Intervención simulada registrada en el ensayo; no autentica autoridad humana real" }
}
