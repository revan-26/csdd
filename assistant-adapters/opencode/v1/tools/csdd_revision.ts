import { tool } from "@opencode-ai/plugin"
import { calculateArtifactRevision } from "../../common/lib/revision.mjs"

const ALLOWED_AGENTS = new Set(["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Reviewer"])

export default tool({
  description: "Calcula SHA-256 sin modificar archivos: el cuerpo del último bloque de docs/base/GENESIS.md o el documento vigente completo de Specs, Roadmap o glosario bajo docs/.",
  args: {
    artifact: tool.schema.enum(["genesis", "specs", "roadmap", "glossary"]),
  },
  async execute(args, context) {
    if (!ALLOWED_AGENTS.has(context.agent)) {
      throw new Error("csdd_revision solo está disponible para Orchestrator, Canon y Reviewer")
    }
    return JSON.stringify({
      ...await calculateArtifactRevision(context.directory, args.artifact),
      session_id: context.sessionID,
      observed_at: new Date().toISOString(),
    }, null, 2)
  },
})
