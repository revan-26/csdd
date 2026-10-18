import assert from "node:assert/strict"
import test from "node:test"
import { waitSession } from "./wait-session.mjs"

test("espera en intervalos sin confundir timeout HTTP con fallo del agente", async () => {
  let waits = 0
  const server = { async api(path, method, body, timeout) {
    if (path === "/api/permission/request") return []
    assert.equal(timeout, 20_000)
    if (++waits === 1) throw Object.assign(new Error("interval"), { name: "TimeoutError" })
  } }
  await waitSession(server, "ses_test")
  assert.equal(waits, 2)
})

test("permiso pendiente detiene el ensayo sin responder por el humano", async () => {
  const paths = []
  await assert.rejects(() => waitSession({ async api(path) {
    paths.push(path)
    return [{ id: "per_test", action: "read", resource: "outside" }]
  } }, "ses_test"), /Permiso pendiente/)
  assert.deepEqual(paths, ["/api/permission/request"])
})
