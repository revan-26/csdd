import assert from "node:assert/strict"
import { parseReviewReport } from "../../common/lib/review-report.mjs"

export function assertReviewReturn(record, returned) {
  // Juicio e identidad se contrastan por separado; no se ignoran los metadatos.
  const { report_path, review_message_id, ...report } = returned
  assert.ok(parseReviewReport(JSON.stringify(report)), "Reporte estructural válido requerido")
  assert.deepEqual(report, record.report)
  assert.equal(report_path, record.path)
  assert.equal(review_message_id, record.message_id)
  assert.equal(report.review_reference, `opencode-session:${record.session_id}`)
}

export function assertNoToolFailures(family) {
  for (const child of family) for (const message of child.messages) {
    for (const part of message.content ?? []) if (part.type === "tool") {
      assert.equal(part.state?.status, "completed", `Herramienta ${part.name} no completada: parada, sin reparación`)
    }
  }
}
