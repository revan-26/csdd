import { Plugin } from "@opencode/plugin"
import { registerTools } from "../../lib/tools.mjs"

export default Plugin.define({
  id: "csdd.genesis",
  async setup(ctx) {
    await registerTools(ctx)
  },
})
