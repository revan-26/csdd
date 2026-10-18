import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { recordApprovalEvidence, readApprovalEvidence } from "../lib/approval-evidence.mjs"

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "csdd-approval-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, "docs/base"), { recursive: true })
  const reference = "sha256:" + "a".repeat(64)
  const decision = { status: "approved", approved_by: "Smoke Tester", approved_at: new Date(1000).toISOString(), approved_content_reference: reference, approval_reference: `opencode-session:ses_original; statement:Apruebo ${reference}` }
  const message = { type: "user", id: "msg_original", text: `Apruebo ${reference}\n\nSolo registrar, no proyectar.`, time: { created: 1000 } }
  const ctx = { session: { get: async ({ sessionID }) => ({ id: sessionID, location: { directory: root } }), context: async () => [message] } }
  return { root, reference, decision, message, ctx, signal: new AbortController().signal }
}
test("constancia del runtime es recuperable sin sesión original ni modelos", async t => {
  const f = await fixture(t)
  const recorded = await recordApprovalEvidence(f.ctx, f.root, f.decision, f.signal)
  f.ctx.session.context = () => { throw new Error("Sesión ya no disponible") }
  assert.deepEqual(await readApprovalEvidence(f.root, f.decision, f.reference), recorded)
  assert.equal(recorded.message_id, f.message.id)
  assert.equal(recorded.statement, f.message.text)
  assert.match(recorded.authority_limit, /no autentica/u)
})
test("ausencia, corrupción, decisión distinta y cuerpo distinto bloquean recuperación", async t => {
  const f = await fixture(t)
  await assert.rejects(() => readApprovalEvidence(f.root, f.decision, f.reference), { code: "ENOENT" })
  const result = await recordApprovalEvidence(f.ctx, f.root, f.decision, f.signal)
  await assert.rejects(() => readApprovalEvidence(f.root, f.decision, "sha256:" + "b".repeat(64)), /cuerpo vigente/)
  await assert.rejects(() => readApprovalEvidence(f.root, { ...f.decision, approved_by: "Otro" }, f.reference), /distinta/)
  const path = join(f.root, result.path)
  const envelope = JSON.parse(await readFile(path, "utf8")); envelope.record.message.text += "Cambio"
  await writeFile(path, JSON.stringify(envelope))
  await assert.rejects(() => readApprovalEvidence(f.root, f.decision, f.reference), /Integridad/)
})
test("cita de asistente, mensaje sintético o ajeno y cancelación no registran aprobación", async t => {
  const f = await fixture(t)
  for (const type of ["assistant", "synthetic"]) {
    f.message.type = type
    await assert.rejects(() => recordApprovalEvidence(f.ctx, f.root, f.decision, f.signal), /inválida/)
  }
  f.message.type = "user"; f.message.text = "Ejemplo:\nApruebo " + f.reference
  await assert.rejects(() => recordApprovalEvidence(f.ctx, f.root, f.decision, f.signal), /inválida/)
  const abort = new AbortController(); abort.abort()
  await assert.rejects(() => recordApprovalEvidence(f.ctx, f.root, f.decision, abort.signal), { name: "AbortError" })
})
test("fuente de otro workspace no se importa", async t => {
  const f = await fixture(t); const other = join(f.root, "otro"); await mkdir(other)
  f.ctx.session.get = async ({ sessionID }) => ({ id: sessionID, location: { directory: other } })
  await assert.rejects(() => recordApprovalEvidence(f.ctx, f.root, f.decision, f.signal), /otro workspace/)
})
test("constancia huérfana no aprueba decisión pending y su reuso es idempotente", async t => {
  const f = await fixture(t)
  const first = await recordApprovalEvidence(f.ctx, f.root, f.decision, f.signal)
  assert.deepEqual(await recordApprovalEvidence(f.ctx, f.root, f.decision, f.signal), first)
  assert.deepEqual(await readApprovalEvidence(f.root, { status: "pending" }, f.reference), { status: "not_approved" })
})
