import { tool } from "@opencode-ai/plugin"
import { structuredWriter } from "../../common/lib/structured-write.mjs"

const write = structuredWriter()

export default tool({
  description: "Escribe Genesis y Glossary; Specs/Roadmap pertenecen al cierre posterior a Mapping. Integración V1 conservada, no certificada por el ajuste V2.",
  args: {
    artifact: tool.schema.enum(["genesis", "glossary"]),
    operation: tool.schema.enum(["create", "update", "append"]),
    data: tool.schema.record(tool.schema.string(), tool.schema.unknown()).describe("Datos estructurados según genesis.contract.json. update: parche; null retira campo opcional. Sin content ni documento Markdown completo."),
  },
  async execute(args, context) {
    if (context.agent !== "CSDD-Canon") {
      throw new Error("csdd_write solo está disponible para CSDD-Canon")
    }
    if (!["genesis", "glossary"].includes(args.artifact)) throw new Error("Genesis solo escribe Genesis y Glossary")
    return JSON.stringify({
      ...await write(context.directory, context.sessionID, args),
      session_id: context.sessionID,
      written_at: new Date().toISOString(),
    }, null, 2)
  },
})
