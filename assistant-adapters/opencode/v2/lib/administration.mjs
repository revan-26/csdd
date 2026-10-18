import { realpath } from "node:fs/promises"
import { calculateArtifactRevision } from "../../common/lib/revision.mjs"
import { currentReview } from "./reviews.mjs"

export const generatedFields = {
  decision: ["approved_at", "approved_content_reference", "approval_reference", "rejected_at", "rejection_reference"],
  materialization: ["genesis_reference", "specs_reference", "roadmap_reference", "glossary_reference", "review_reference", "review_verdict", "checks", "limitations"],
  metadata: ["genesis_revision", "genesis_review_reference", "last_reviewed", "genesis_pending_revision"],
}

export async function sourceUser(ctx, directory, sessionID) {
  const seen = new Set()
  let messages
  while (sessionID) {
    if (seen.has(sessionID)) throw new Error("Ciclo de procedencia de sesiones")
    seen.add(sessionID)
    const session = await ctx.session.get({ sessionID })
    if (session.id !== sessionID || !session.location?.directory || await realpath(session.location.directory) !== directory) throw new Error("Procedencia fuera del workspace")
    messages = await ctx.session.context({ sessionID })
    if (!session.parentID) {
      const message = messages.findLast(message => message.type === "user")
      if (!message?.id || !Number.isFinite(message.time?.created)) throw new Error("No existe intervención de usuario identificable")
      return { sessionID, message }
    }
    sessionID = session.parentID
  }
  throw new Error("No existe raíz de procedencia")
}

export async function prepareAdministration(ctx, directory, context, input, previous) {
  const value = structuredClone(input), data = value.data
  if (!data || typeof data !== "object" || Array.isArray(data)) return value
  for (const [section, keys] of Object.entries(generatedFields)) {
    for (const key of keys) if (Object.hasOwn(data[section] ?? {}, key)) throw new Error(`Campo generado por código, no admitido en entrada: ${section}.${key}`)
  }
  if (input.artifact === "genesis" && input.operation === "append") {
    if (Object.hasOwn(data, "revision_id")) throw new Error("revision_id se obtiene del runtime al añadir un bloque")
    const source = await sourceUser(ctx, directory, context.sessionID)
    data.revision_id = `rev_${source.message.id}`
  }
  if (input.artifact === "genesis" && data.decision?.status === "approved" && previous?.status !== "approved") {
    const source = await sourceUser(ctx, directory, context.sessionID)
    const reference = (await calculateArtifactRevision(directory, "genesis")).reference
    if (source.message.text?.split(/\r?\n/u)[0] !== `Apruebo ${reference}`) throw new Error("La última intervención humana no aprueba explícitamente el cuerpo vigente")
    Object.assign(data.decision, { approved_at: new Date(source.message.time.created).toISOString(),
      approved_content_reference: reference, approval_reference: `opencode-session:${source.sessionID}; statement:Apruebo ${reference}` })
  }
  if (input.artifact === "genesis" && data.decision?.status === "rejected") {
    const source = await sourceUser(ctx, directory, context.sessionID)
    Object.assign(data.decision, { rejected_at: new Date(source.message.time.created).toISOString(),
      rejection_reference: `opencode-session:${source.sessionID}; message:${source.message.id}` })
  }
  if (input.artifact === "genesis" && data.materialization?.stage === "closed") {
    const final = await currentReview(directory, "semantic")
    Object.assign(data.materialization, Object.fromEntries(Object.entries(final.report.artifact_references).map(([key, reference]) => [`${key}_reference`, reference])))
    Object.assign(data.materialization, { review_reference: final.report.review_reference, review_verdict: final.report.verdict,
       checks: JSON.stringify({ semantic: final.report }, null, 2),
       limitations: final.report.limitations.join("\n") || "Evaluación documental; no acredita implementación ni autoridad humana real." })
  }
  return value
}
