import { spawn, spawnSync } from "node:child_process"

export function runCommand(workspace, program, args, timeout = 120_000) {
  const windows = process.platform === "win32"
  const result = spawnSync(windows ? process.env.ComSpec : program, windows ? ["/d", "/s", "/c", program, ...args] : args, {
    cwd: workspace, encoding: "utf8", timeout, maxBuffer: 20 * 1024 * 1024,
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${program} ${args.slice(0, 3).join(" ")} falló:\n${result.stderr || result.stdout}`)
  return result.stdout
}

export function requireV2(workspace) {
  const version = runCommand(workspace, "opencode", ["--version"]).trim()
  if (!/(?:^|\s)v?2\.0\.22(?:\s|$)/u.test(version)) throw new Error(`Baseline de pruebas V2: 2.0.22; detectada: ${version}`)
  return version
}

export function installDependencies(workspace) {
  runCommand(workspace, "npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"])
}

export async function startServer(workspace, options = {}) {
  const windows = process.platform === "win32"
  const args = ["serve", "--hostname", "127.0.0.1", "--port", "0"]
  const program = options.program ?? (windows ? process.env.ComSpec : "opencode")
  const child = spawn(program, options.program || !windows ? args : ["/d", "/s", "/c", "opencode", ...args], { cwd: workspace, env: options.env ?? process.env, stdio: ["ignore", "pipe", "pipe"] })
  let output = ""
  const diagnostic = () => output.replace(/server password \S+/gu, "server password [redacted]")
  const stop = () => {
    if (windows && child.pid) spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { encoding: "utf8" })
    else child.kill("SIGTERM")
    child.stdout.destroy()
    child.stderr.destroy()
    child.unref()
  }
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { stop(); reject(new Error(`Servidor privado no inició: ${diagnostic()}`)) }, 30_000)
    const observe = (chunk) => {
      output += chunk.toString()
      const match = /http:\/\/127\.0\.0\.1:\d+/u.exec(output)
      if (match && /server password (\S+)/u.test(output)) { clearTimeout(timer); resolve(match[0]) }
    }
    child.stdout.on("data", observe)
    child.stderr.on("data", observe)
    child.once("error", (error) => { clearTimeout(timer); reject(error) })
    child.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Servidor privado terminó (${code}): ${diagnostic()}`)) })
  })
  return {
    stop,
    url,
    async api(path, method = "GET", body, timeout = 60_000, raw = false) {
      const query = new URLSearchParams({ "location[directory]": workspace })
      const password = /server password (\S+)/u.exec(output)[1]
      const headers = { Authorization: "Basic " + Buffer.from(`opencode:${password}`).toString("base64"), ...(body ? { "Content-Type": "application/json" } : {}) }
      const response = await fetch(`${url}${path}${path.includes("?") ? "&" : "?"}${query}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeout) })
      const text = await response.text()
      if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text}`)
      if (!text) return
      const result = JSON.parse(text)
      return raw ? result : result.data ?? result
    },
  }
}
