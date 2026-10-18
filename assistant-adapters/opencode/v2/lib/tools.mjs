import { realpath } from "node:fs/promises"
import { calculateArtifactRevision } from "../../common/lib/revision.mjs"
import { structuredWriter, structuredWriteSchema } from "../../common/lib/structured-write.mjs"
import { activeDecision, recordApprovalEvidence, readApprovalEvidence } from "./approval-evidence.mjs"
import { reviewController, reviewSchema } from "./reviews.mjs"
import { prepareAdministration } from "./administration.mjs"
import { currentReview } from "./reviews.mjs"
import { beginGlossaryCandidate, trackGlossaryCandidate, verifyGlossaryCandidate, settleGlossaryCandidate } from "./glossary-candidate.mjs"
import { settleGenesisRecovery } from "../../common/lib/recovery.mjs"
import { documentSchema, writeDocument } from "./documents.mjs"

const READERS = new Set(["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Reviewer"])
const artifactSchema = { type: "string", enum: ["genesis", "specs", "roadmap", "glossary"] }

async function invocationWorkspace(ctx, context, allowed) {
  context.signal.throwIfAborted()
  if (!allowed.has(context.agent)) throw new Error("Agente no autorizado para esta tool CSDD")
  const session = await ctx.session.get({ sessionID: context.sessionID })
  if (session.id !== context.sessionID || !session.location?.directory) throw new Error("La sesión no identifica un workspace válido")
  const directory = await realpath(session.location.directory)
  const pluginDirectory = await realpath(ctx.location.directory)
  if (directory !== pluginDirectory) throw new Error("La sesión ya no pertenece al workspace del plugin CSDD")
  context.signal.throwIfAborted()
  return directory
}

export async function registerTools(ctx) {
  const write = structuredWriter()
  const review = reviewController()
  return ctx.tool.transform((editor) => {
    editor.add({
      name: "csdd_document",
      description: "Canon: inspect obtiene referencia de una ruta admitida; contribute añade un aporte pending preservando texto previo; report conserva un informe nuevo en support/. Ninguna operación, tampoco inspect, admite Genesis/Glossary. Para leerlos usa read si existen; para sus referencias csdd_revision y para escribirlos csdd_write. No aprueba, cierra ni migra. Fuentes explícitas; expected_reference evita sobrescribir cambios externos.",
      input: documentSchema,
      options: { codemode: false, permission: "csdd_document" },
      async execute(input, context) {
        const directory = await invocationWorkspace(ctx, context, new Set(["CSDD-Canon"]))
        return { content: JSON.stringify(await writeDocument(directory, context, input)) }
      },
    })
    editor.add({
      name: "csdd_revision",
      description: "Calcula SHA-256 del cuerpo activo de Genesis o del documento vigente completo de Specs, Roadmap o glosario bajo docs/.",
      input: { type: "object", properties: { artifact: artifactSchema }, required: ["artifact"], additionalProperties: false },
      options: { codemode: false, permission: "csdd_revision" },
      async execute(input, context) {
        const directory = await invocationWorkspace(ctx, context, READERS)
        const result = {
          ...await calculateArtifactRevision(directory, input.artifact),
          session_id: context.sessionID,
          observed_at: new Date().toISOString(),
        }
        if (input.artifact === "genesis") {
          const decision = await activeDecision(directory)
          try { result.approval_evidence = await readApprovalEvidence(directory, decision, result.reference) }
          catch (error) { result.approval_evidence = { status: "unavailable", reason: error.message } }
        }
        return { content: JSON.stringify(result) }
      },
    })
    editor.add({
      name: "csdd_review",
      description: "Reviewer: begin devuelve snapshots y tipo de revisión calculado; complete recibe solo juicio semántico. Código genera identidad, huellas y vínculo temporal y persiste reporte real. No copiar ni construir metadatos.",
      input: reviewSchema,
      options: { codemode: false, permission: "csdd_review" },
      async execute(input, context) {
        const directory = await invocationWorkspace(ctx, context, input.operation === "latest" ? READERS : new Set(["CSDD-Reviewer"]))
        return { content: JSON.stringify(await review(directory, context, input)) }
      },
    })
    editor.add({
      name: "csdd_write",
      description: "Escribe entrada estructurada artifact/operation/data según .csdd/templates/genesis.contract.json. Genera Markdown; update aplica parche preservando lo omitido y zonas aprobadas. Hasta cuatro reparaciones; blocked requiere informar a Orchestrator. No acepta content ni aliases.",
      input: structuredWriteSchema,
      options: { codemode: false, permission: "csdd_write" },
      async execute(input, context) {
        const directory = await invocationWorkspace(ctx, context, new Set(["CSDD-Canon"]))
        if (!["genesis", "glossary"].includes(input.artifact)) throw new Error("Genesis solo escribe genesis y glossary; Specs y Roadmap pertenecen al cierre posterior a Mapping")
        let previous
        try { previous = await activeDecision(directory) }
        catch (error) { if (error.code !== "ENOENT") throw error }
        if (input.artifact === "glossary") {
          if (previous?.status !== "pending") throw new Error("Glossary candidato requiere Genesis pendiente; no cambiar vocabulario aprobado")
          await beginGlossaryCandidate(directory)
        }
        if (input.artifact === "genesis" && input.data?.materialization?.stage === "closed") await verifyGlossaryCandidate(directory)
        input = await prepareAdministration(ctx, directory, context, input, previous)
        if (input.artifact === "genesis" && input.data?.decision?.status === "approved" && previous?.status !== "approved") {
          if (input.operation !== "update") throw new Error("Registrar aprobación requiere un borrador vigente presentado")
          const decision = { ...previous, ...input.data.decision }
          const revision = await calculateArtifactRevision(directory, "genesis")
          if (decision.approved_content_reference !== revision.reference) throw new Error("La aprobación no coincide con el cuerpo vigente")
          await currentReview(directory, "semantic")
          await recordApprovalEvidence(ctx, directory, decision, context.signal)
        } else if (previous?.status === "approved") {
          const revision = await calculateArtifactRevision(directory, "genesis")
          await readApprovalEvidence(directory, previous, revision.reference)
        }
        context.signal.throwIfAborted()
        const result = {
          ...await write(directory, context.sessionID, input),
          session_id: context.sessionID,
          written_at: new Date().toISOString(),
          applied_data: input.data,
        }
        if (result.status === "written") {
          if (input.artifact === "glossary") await trackGlossaryCandidate(directory)
          if (input.artifact === "genesis" && input.data?.materialization?.disposition === "abandoned") await settleGlossaryCandidate(directory, true)
          if (input.artifact === "genesis" && input.data?.materialization?.stage === "closed") await settleGlossaryCandidate(directory)
          if (input.artifact === "genesis") await settleGenesisRecovery(directory)
        }
        return { content: JSON.stringify(result) }
      },
    })
  })
}
