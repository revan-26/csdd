import { writeFile } from "node:fs/promises"
import { join } from "node:path"

// Solo fixture: no forma parte de producción ni cambia los permisos del perfil.
export default { id: "csdd.test.focused-budget", async setup(ctx) {
  const maxCalls = ctx.options?.maxCalls ?? 8
  if (![8, 10].includes(maxCalls)) throw new Error("Presupuesto de fixture no admitido")
  let calls = 0, failure
  const stopIfFailed = () => {
    if (failure) throw new Error("Ensayo detenido ante el primer error de herramienta; no reparar")
  }
  const recordFailure = async (tool, context, error) => {
    if (failure) return
    failure = { tool, session_id: context.sessionID, message_id: context.messageID,
      error: { message: error?.message ?? String(error) } }
    await writeFile(join(ctx.location.directory, "first-tool-error.json"), JSON.stringify(failure))
  }
  await ctx.session.hook("title", event => { event.result = "Focused review" })
  await ctx.session.hook("retry", event => { event.decision = { retry: false } })
  await ctx.tool.hook("execute.after", async event => {
    if (event.status !== "error" || failure) return
    await recordFailure(event.tool, event, event.error)
  })
  await ctx.tool.hook("execute.before", stopIfFailed)
  // En 2.0.22 una excepción del executor Promise puede no llegar a execute.after
  // como error. Capturar en el executor, antes de cruzar ese adaptador del host.
  // Solo instrumentación de la fixture: conserva permisos, entradas y resultados.
  await ctx.tool.transform(editor => {
    for (const { id } of editor.list()) editor.update(id, tool => {
      const execute = tool.execute
      tool.execute = async (input, context) => {
        stopIfFailed()
        try { return await execute(input, context) }
        catch (error) { await recordFailure(id, context, error); throw error }
      }
    })
  })
  await ctx.session.hook("context", async event => {
    stopIfFailed()
    if (calls >= maxCalls) throw new Error(maxCalls === 8 ? "Límite de ocho llamadas del caso puntual" : "Límite de diez llamadas del caso puntual")
    calls++
    event.options.maxTokens = 3000
    await writeFile(join(ctx.location.directory, "call-count.json"), JSON.stringify({ calls }))
  })
} }
