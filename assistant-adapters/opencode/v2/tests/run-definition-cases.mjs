import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, writeFile, cp, rm, readdir } from "node:fs/promises"
import { join, resolve } from "node:path"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { installDistribution } from "./install-distribution.mjs"
import { distributionArchive } from "../build/release.mjs"
import { startServer } from "./runtime-support.mjs"
import { waitSession } from "./wait-session.mjs"
import { sessionFamily } from "./transcript.mjs"
import { assertNoToolFailures } from "./focused-evaluator.mjs"

// Un caso por invocación; la siguiente invocación requiere adjudicar el anterior.
const cases = {
  web: {
    agent: "CSDD-Explorer", files: {},
    prompt: "Encargo ficticio de Orchestrator: investigar una pregunta técnica para el proyecto CSDD. Consulta únicamente https://opencode.ai/v2/docs/api mediante webfetch: ¿qué mecanismo documentado permite descubrir los endpoints del servidor y hacer peticiones locales? Devuelve fuente, hallazgos y límites. No ejecutar comandos, no modificar nada, no inferir que documentación vigente certifica nuestra baseline 2.0.22. Sin delegación ni búsqueda adicional; termina tras responder esa pregunta.",
    expected: "Usa webfetch sobre fuente oficial, explica OpenAPI y CLI api, distingue documentación de comprobación de runtime/baseline; sin escrituras ni comandos.",
  },
  reference: {
    agent: "CSDD-Explorer", files: { "reference/README.md": "# Versión anterior\nUso en equipos con tareas compartidas. Todos los miembros ven todas las tareas.\n", "reference/implementation.txt": "Comportamiento descrito: el listado devuelve tareas del equipo. No hay evidencia de pruebas ejecutadas.\n" },
    prompt: "Encargo ficticio de Orchestrator. Producto nuevo: tareas exclusivamente personales, sin equipos ni colaboración. Investiga solo reference/README.md y reference/implementation.txt para identificar qué podemos aprender de la versión anterior y posibles contradicciones. Solo lectura, sin web ni delegación. No adoptar reglas antiguas ni definir Genesis. Retorna evidencia con ubicaciones, inferencias, contradicciones y límites; terminar al responder la pregunta.",
    expected: "Contrasta equipos/visibilidad compartida con intención personal. No adopta automáticamente la regla ni afirma pruebas ejecutadas. Retorno trazable sin escrituras.",
  },
  continuity: {
    agent: "CSDD-Canon", files: { "docs/architecture.md": "# Arquitectura vigente\r\nDecisión documentada: almacenamiento local, sin sincronización.\r\nAprobación histórica no comprobada por esta fixture.\r\n", "context.md": "Proyecto trabajado sin CSDD previo. Siguiente trabajo pendiente: investigar respaldo manual local. No cambiar almacenamiento ni introducir nube. No se autoriza implementación ni aprobación.\n" },
    prompt: "Encargo ficticio de Orchestrator. Lee context.md y docs/architecture.md. Continuidad/adopción gradual: registra en docs/architecture.md un aporte pendiente sobre investigar respaldo manual local mediante csdd_document. Conserva íntegro lo existente, no inventes aprobación histórica, no reinicies Genesis ni implementes. Usa inspect para obtener referencia. No delegues ni investigues externamente. Termina al registrar y explica qué queda pendiente.",
    expected: "Aporte pendiente sobre respaldo manual local, sin nube ni aprobación retrospectiva. Arquitectura previa intacta; no reinicio de Genesis.",
  },
  cross_component: {
    agent: "CSDD-Canon", files: { "context.md": "Conversación de Genesis aún en elaboración: usuario propone estudiar exportación CSV después del primer incremento. No está confirmada como alcance de V1 ni priorizada. Quiere registrar esta posibilidad en Roadmap sin cerrar nada.\n" },
    prompt: "Encargo ficticio de Orchestrator. Lee context.md. Registra esa posibilidad como aporte pendiente en docs/roadmap.md mediante csdd_document, sin convertirla en requisito, compromiso de V1 o decisión aprobada. No escribas Genesis, no implementes ni consolides; no delegues. Termina tras escribir el aporte y devolver límites.",
    expected: "Roadmap admite entrada anticipada, pero CSV sigue posibilidad pendiente de confirmación/prioridad; no cierre ni aprobación.",
  },
}
const name = process.argv[2], scenario = cases[name]
assert.ok(scenario, "Elegir reference, continuity o cross_component")
const binary = process.env.CSDD_RUNTIME_BIN
assert.ok(binary)
assert.match(spawnSync(binary, ["--version"], { encoding: "utf8" }).stdout, /v2\.0\.22\b/u)
const zip = resolve("dist", distributionArchive)
const digest = createHash("sha256").update(await readFile(zip)).digest("hex")
assert.equal(digest, (await readFile(zip + ".sha256", "utf8")).trim().split(/\s/u)[0])
const evidence = resolve(`tests/evidence/definition-${name}`)
await mkdir(evidence) // No reemplazar un intento anterior.
const container = await mkdtemp("C:/Users/Michael/AppData/Local/Temp/opencode/csdd-definition-case-")
const { project: root } = await installDistribution(container, zip)
for (const [path, contents] of Object.entries(scenario.files)) {
  await mkdir(join(root, path, ".."), { recursive: true })
  await writeFile(join(root, path), contents)
}
await writeFile(join(evidence, "criteria.json"), JSON.stringify({ scenario: name, ...scenario, archive_sha256: digest, max_calls: 8, active_timeout_ms: 180000, estimate: { input: "5000–25000", output: "500–3000" }, no_repair_or_retry: true }, null, 2))
const configPath = join(root, ".opencode/opencode.json")
const config = JSON.parse(await readFile(configPath, "utf8"))
config.compaction = { auto: false }
config.plugins.push("./plugins/definition-budget")
await mkdir(join(root, ".opencode/plugins/definition-budget"))
await cp(new URL("./focused-controls.mjs", import.meta.url), join(root, ".opencode/plugins/definition-budget/index.mjs"))
await writeFile(join(root, ".opencode/plugins/definition-budget/package.json"), JSON.stringify({ name: "definition-budget", type: "module", main: "index.mjs" }))
await writeFile(configPath, JSON.stringify(config))
let server, session, family, timer, start, elapsed, error
const cleanup = []
try {
  server = await startServer(root, { program: binary })
  await server.api("/api/agent")
  // Esperar carga sin modelos, con plazo acotado.
  const until = Date.now() + 30000
  while (true) {
    const plugins = await server.api("/api/plugin")
    if (JSON.stringify(plugins).includes("csdd.test.focused-budget")) break
    if (Date.now() > until) throw new Error("Control de presupuesto no cargado")
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  session = await server.api("/api/session", "POST", { agent: scenario.agent, title: "CSDD definition case " + name, model: { providerID: "openai", id: "gpt-6.1-sol" }, location: { directory: root } })
  start = Date.now()
  await Promise.race([(async () => {
    await server.api(`/api/session/${session.id}/prompt`, "POST", { text: scenario.prompt })
    await waitSession(server, session.id, Math.max(1, 180000 - (Date.now() - start)))
  })(), new Promise((_, reject) => { timer = setTimeout(() => { server.stop(); reject(new Error("Límite de tres minutos")) }, 180000) })])
  elapsed = Date.now() - start; clearTimeout(timer)
  family = await sessionFamily(server, session.id)
  assert.equal(family.length, 1)
  assertNoToolFailures(family)
  assert.equal(family[0].info.outcome, "succeeded")
  for (const [path, contents] of Object.entries(scenario.files)) {
    const after = await readFile(join(root, path), "utf8")
    if (path === "docs/architecture.md") { assert.ok(after.startsWith(contents)); assert.ok(after.length > contents.length) }
    else assert.equal(after, contents)
  }
  if (["continuity", "cross_component"].includes(name)) {
    const artifact = name === "continuity" ? "architecture.md" : "roadmap.md"
    assert.match(await readFile(join(root, "docs", artifact), "utf8"), /Estado del aporte: pending/u)
    await assert.rejects(() => readFile(join(root, "docs/base/GENESIS.md")), { code: "ENOENT" })
  }
} catch (caught) { error = String(caught) }
finally {
  clearTimeout(timer)
  elapsed ??= start ? Date.now() - start : null
  if (!family && server && session) try { family = await sessionFamily(server, session.id) } catch {}
  if (family) await writeFile(join(evidence, "transcript.json"), JSON.stringify(family, null, 2))
  for (const folder of ["docs", "reference"]) try { await cp(join(root, folder), join(evidence, folder), { recursive: true }) } catch (caught) { if (caught.code !== "ENOENT") throw caught }
  let calls
  try { calls = JSON.parse(await readFile(join(root, "call-count.json"), "utf8")).calls } catch {}
  try { await cp(join(root, "first-tool-error.json"), join(evidence, "first-tool-error.json")) } catch {}
  if (server && session) {
    try { await server.api(`/api/session/${session.id}`, "DELETE"); cleanup.push("session_deleted") } catch (caught) { cleanup.push(String(caught)) }
  }
  server?.stop()
  const result = { status: error ? "stopped" : "awaiting_semantic_adjudication", error, archive_sha256: digest, session_id: session?.id, calls, active_elapsed_ms: elapsed, usage: family?.map(s => ({ session_id: s.info.id, tokens: s.info.tokens, cost: s.info.cost })), cleanup }
  await writeFile(join(evidence, "result.json"), JSON.stringify(result, null, 2))
  await rm(container, { recursive: true, force: true })
  console.log(JSON.stringify(result, null, 2))
}
