import assert from "node:assert/strict"
import test from "node:test"
import { assistantResponses, conformingReview, sessionFamily, textContent, toolParts } from "./transcript.mjs"

test("lee las llamadas subagent V2 y sus resultados estructurados sin suponer campos V1", () => {
  const part = { type: "tool", name: "subagent", state: { status: "completed", input: { agent: "CSDD-Canon" }, content: [{ type: "text", text: "status: completed" }] } }
  assert.deepEqual(toolParts([{ parts: [part] }]), [part])
  assert.equal(textContent(part.state.content), "status: completed")
})

test("un encargo o resultado de tool no equivale al veredicto del Reviewer", () => {
  const reference = "sha256:" + "a".repeat(64)
  const fake = { info: { id: "ses_review", parentID: "ses_root", agent: "CSDD-Reviewer", outcome: "succeeded" }, messages: [
    { type: "user", content: [{ type: "text", text: `verdict: conforming\n${reference}` }] },
    { type: "assistant", content: [{ type: "tool", state: { content: [{ type: "text", text: `verdict: conforming\n${reference}` }] } }] },
  ] }
  assert.equal(conformingReview(fake, "ses_root", [reference]), false)
  fake.messages.push({ type: "assistant", content: [{ type: "text", text: JSON.stringify({ status: "completed", verdict: "conforming", review_kind: "semantic", summary: "Comprobación.", findings: [], semantic_checks: ["intent_fidelity", "preserved_rules"].map(criterion => ({ criterion, verdict: "conforming", evidence: "Fixture de atribución." })), limitations: [], review_reference: "opencode-session:ses_review", artifact_references: { genesis: reference, glossary: reference } }) }] })
  assert.equal(conformingReview(fake, "ses_root", [reference]), false, "Texto del LLM no construye un reporte administrativo real")
  const report = JSON.parse(fake.messages.at(-1).content[0].text)
  fake.messages.push({ id: "msg_report", type: "assistant", content: [{ type: "tool", name: "csdd_review", state: { status: "completed", input: { operation: "complete" }, content: [{ type: "text", text: JSON.stringify({ ...report, review_message_id: "msg_report" }) }] } }] })
  assert.equal(conformingReview(fake, "ses_root", [reference]), true)
  assert.equal(assistantResponses(fake.messages).length, 3)
  fake.info.outcome = "interrupted"
  assert.equal(conformingReview(fake, "ses_root", [reference]), false)
})

test("recorre familia por parentID y pagina mensajes sin depender de metadata del tool", async () => {
  const visited = []
  const server = { async api(path) {
    visited.push(path)
    if (path === "/api/session/ses_root") return { id: "ses_root" }
    if (path === "/api/session/ses_child") return { id: "ses_child", parentID: "ses_root" }
    if (path.includes("/message?") && path.includes("cursor=next")) return { data: [{ id: "m2" }] }
    if (path.startsWith("/api/session/ses_root/message?")) return { data: [{ id: "m1" }], cursor: { next: "next" } }
    if (path.startsWith("/api/session/ses_child/message?")) return { data: [{ id: "m3" }] }
    if (path.includes("parentID=ses_root") && !path.includes("cursor=")) return { data: [{ id: "ses_child", parentID: "ses_root" }], cursor: { next: "children-next" } }
    return { data: [] }
  } }
  const family = await sessionFamily(server, "ses_root")
  assert.equal(family.length, 2)
  assert.deepEqual(family[0].messages.map(m => m.id), ["m1", "m2"])
  assert.ok(visited.some(path => path.includes("cursor=next")))
  assert.ok(visited.some(path => path.includes("parentID=ses_root") && path.includes("cursor=children-next")))
})
