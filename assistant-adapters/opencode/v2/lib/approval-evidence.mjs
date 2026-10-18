import { createHash } from "node:crypto"
import { lstat, open, readFile, unlink, realpath } from "node:fs/promises"
import { join } from "node:path"
import { artifactLocation } from "../../common/lib/artifacts.mjs"
import { genesisRecords } from "../../common/lib/revision.mjs"
import { parseStructure } from "../../common/lib/structured-write.mjs"

const hash = text => createHash("sha256").update(text).digest("hex")
const fields = ["approved_by", "approved_at", "approved_content_reference", "approval_reference"]
export async function activeDecision(directory) {
  return (await activeRecord(directory)).decision
}
export async function activeRecord(directory) {
  const { artifactPath } = await artifactLocation(directory, "genesis")
  const text = await readFile(artifactPath, "utf8")
  const records = genesisRecords(text)
  return parseStructure(records.length === 1 ? "genesis" : "genesis_revision", records.at(-1))
}

async function location(directory, decision) {
  const { directory: base } = await artifactLocation(directory, "genesis")
  return join(base, `.approval-${hash(decision.approval_reference)}.json`)
}

function validate(record, decision) {
  if (record.version !== "csdd-approval-1" || !record.message?.id || !Number.isFinite(record.message.time?.created)
    || record.message.type !== "user" || record.message.text?.split(/\r?\n/u)[0] !== `Apruebo ${decision.approved_content_reference}`
    || decision.approval_reference !== `opencode-session:${record.session_id}; statement:Apruebo ${decision.approved_content_reference}`
    || fields.some(key => record.decision?.[key] !== decision[key])) throw new Error("Constancia de aprobación inválida o distinta de la decisión")
}

export async function readApprovalEvidence(directory, decision, reference) {
  if (decision.status !== "approved") return { status: "not_approved" }
  if (decision.approved_content_reference !== reference) throw new Error("El cuerpo vigente difiere del aprobado")
  const path = await location(directory, decision)
  const stat = await lstat(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error("Constancia de aprobación no puede ser un enlace")
  const envelope = JSON.parse(await readFile(path, "utf8"))
  if (envelope.digest !== `sha256:${hash(JSON.stringify(envelope.record))}`) throw new Error("Integridad de constancia de aprobación inválida")
  validate(envelope.record, decision)
  return { status: "recorded", path: `docs/base/${path.split(/[\\/]/u).at(-1)}`, reference: envelope.digest,
    session_id: envelope.record.session_id, message_id: envelope.record.message.id,
    statement: envelope.record.message.text, decision: envelope.record.decision,
    authority_limit: "Mensaje de usuario registrado por el runtime; no autentica identidad humana ni resiste manipulación hostil del workspace" }
}

// Persistir antes de la decisión: una interrupción puede dejar constancia huérfana,
// nunca una decisión approved nueva cuya evidencia aún no se haya escrito.
export async function recordApprovalEvidence(ctx, directory, decision, signal) {
  signal.throwIfAborted()
  const match = /^opencode-session:([^;\s]+); statement:(Apruebo sha256:[a-f0-9]{64})$/u.exec(decision.approval_reference ?? "")
  if (!match || match[2] !== `Apruebo ${decision.approved_content_reference}`) throw new Error("Referencia de aprobación no identifica intervención exacta")
  const source = await ctx.session.get({ sessionID: match[1] })
  if (source.id !== match[1] || !source.location?.directory || await realpath(source.location.directory) !== directory) throw new Error("La aprobación procede de otro workspace")
  const messages = await ctx.session.context({ sessionID: source.id })
  const message = messages.findLast(m => m.type === "user" && m.text?.split(/\r?\n/u)[0] === match[2])
  const record = { version: "csdd-approval-1", session_id: source.id,
    message: message && { id: message.id, type: message.type, text: message.text, time: { created: message.time?.created } },
    decision: Object.fromEntries(fields.map(key => [key, decision[key]])) }
  validate(record, decision)
  signal.throwIfAborted()
  const path = await location(directory, decision)
  try {
    const existing = await readApprovalEvidence(directory, decision, decision.approved_content_reference)
    if (existing.message_id !== message.id) throw new Error("La constancia existente identifica otra intervención")
    return existing
  } catch (error) { if (error.code !== "ENOENT") throw error }
  const envelope = JSON.stringify({ record, digest: `sha256:${hash(JSON.stringify(record))}` }, null, 2) + "\n"
  const handle = await open(path, "wx", 0o600)
  try { await handle.writeFile(envelope); await handle.sync() }
  catch (error) { await handle.close(); await unlink(path); throw error }
  await handle.close()
  return readApprovalEvidence(directory, decision, decision.approved_content_reference)
}
