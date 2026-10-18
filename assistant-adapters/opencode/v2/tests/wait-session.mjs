export async function waitSession(server, sessionID, timeout = 600_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const requests = await server.api("/api/permission/request")
    if (requests.length) {
      const error = new Error(`Permiso pendiente; el ensayo no lo aprueba automáticamente: ${JSON.stringify(requests)}`)
      error.category = "execution_interrupted"
      throw error
    }
    try {
      await server.api(`/api/experimental/session/${sessionID}/wait`, "POST", undefined, Math.min(20_000, deadline - Date.now()))
      return
    } catch (error) {
      if (error.name !== "TimeoutError") throw error
    }
  }
  const error = new Error(`Tiempo de ejecución agotado para ${sessionID}: ${timeout} ms`)
  error.category = "execution_interrupted"
  throw error
}
