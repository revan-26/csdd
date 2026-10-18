import { access, rm } from "node:fs/promises"
import { spawnSync } from "node:child_process"

let runtimeChecked = false

export function assertCompatibleRuntime(workspace) {
  if (runtimeChecked) return
  const version = invokeOpenCode(workspace, ["--version"])
  if (!/\b1\.18\.29\b/u.test(version)) {
    throw new Error(`Estos smokes requieren el runtime validado OpenCode 1.18.29; detectado: ${version.trim()}. La compatibilidad V2 requiere validación separada; no se iniciaron llamadas al modelo.`)
  }
  runtimeChecked = true
}

export function runOpenCode(workspace, args) {
  assertCompatibleRuntime(workspace)
  return invokeOpenCode(workspace, args)
}

function invokeOpenCode(workspace, args) {
  const command = process.platform === "win32" ? process.env.ComSpec : "opencode"
  const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", "opencode", ...args] : args
  const result = spawnSync(command, commandArgs, {
    cwd: workspace,
    encoding: "utf8",
    timeout: 600_000,
    maxBuffer: 20 * 1024 * 1024,
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`OpenCode falló:\n${result.stderr || result.stdout}`)
  return result.stdout
}

export function sessionId(output) {
  for (const line of output.split(/\r?\n/u)) {
    try {
      const event = JSON.parse(line)
      const pending = [event]
      while (pending.length) {
        const value = pending.pop()
        if (!value || typeof value !== "object") continue
        if (typeof value.sessionID === "string") return value.sessionID
        if (typeof value.session_id === "string") return value.session_id
        pending.push(...Object.values(value))
      }
    } catch {
      // OpenCode may include non-JSON diagnostics around its JSON event stream.
    }
  }
  throw new Error("No se encontró sessionID en la salida de OpenCode")
}

export function taskCalls(exported, agent) {
  const calls = []
  const pending = [exported]
  while (pending.length) {
    const value = pending.pop()
    if (!value || typeof value !== "object") continue
    if (value.type === "tool" && value.tool === "task" && value.state?.status === "completed" && value.state?.input?.subagent_type === agent) {
      calls.push(value)
    }
    pending.push(...Object.values(value))
  }
  return calls
}

export async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function removeFixture(path) {
  await rm(path, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 })
}
