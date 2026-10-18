import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, writeFile, cp, rm, readdir } from "node:fs/promises"
import { join, resolve } from "node:path"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { installDistribution } from "./install-distribution.mjs"
import { distributionArchive } from "../build/release.mjs"
import { startServer } from "./runtime-support.mjs"
import { waitSession } from "./wait-session.mjs"
import { sessionFamily, toolParts } from "./transcript.mjs"
import { assertNoToolFailures } from "./focused-evaluator.mjs"

const cases = {
  luna: {
    files: {
      "reference/README.md": "# Referencia ficticia\nPublicar una colección requiere aprobación de un revisor. Cada ejemplar físico tiene un registro propio; dos figuras del mismo modelo comercial pueden compartir SKU. Los ejemplares archivados no aparecen en el inventario activo. Estas son reglas documentadas del legado, no decisiones del producto nuevo.\n",
      "reference/publication.js": "// Único punto de entrada de publicación de esta fixture; sin middleware ni triggers externos.\nexport function publish(collection, actor) {\n  if (!actor.canEdit) throw new Error('editor required');\n  collection.status = 'published';\n  return collection;\n}\n",
      "reference/schema.sql": "CREATE TABLE item (id INTEGER PRIMARY KEY, workspace_id INTEGER NOT NULL, sku TEXT NOT NULL, archived BOOLEAN NOT NULL DEFAULT FALSE);\nCREATE UNIQUE INDEX unique_active_sku ON item(workspace_id, sku) WHERE archived = FALSE;\n",
      "reference/inventory.js": "export function activeItems(items) {\n  return items.filter(item => item.archived === false);\n}\n",
      "reference/inventory.test.js": "import assert from 'node:assert/strict';\nimport { activeItems } from './inventory.js';\nassert.deepEqual(activeItems([{id:1,archived:false},{id:2,archived:true}]),[{id:1,archived:false}]);\n",
      "reference/evidence.md": "# Alcance de la evidencia\nSolo se dispone de estas fuentes. No hay registro de ejecución de pruebas, compilación ni despliegue. La fixture es autocontenida; no hay otra implementación de publicación.\n",
    },
    prompt: "Analiza la referencia ficticia en reference/ para distinguir qué está documentado, qué hace el código y qué problemas o límites debemos considerar antes de reutilizarla. Para el producto nuevo quiero registrar por separado varios ejemplares de la misma figura, aunque compartan SKU; todavía no he decidido adoptar las reglas de publicación del legado. En esta comprobación solo quiero el informe en la conversación: no escribas archivos, no ejecutes código ni consultes la web.",
    expected: ["Detectar ausencia de aprobación en publish frente a README y distinguir autorización de editor de aprobación de revisor", "Detectar que unique_active_sku impide varios ejemplares activos con mismo SKU en el workspace", "No afirmar pruebas pasadas ni ejecución: solo fuente de prueba", "Regla del legado no aprobada para el producto nuevo", "Reconocer que el filtro de archivados es coherente entre documentación/código/prueba fuente; no inventar contradicción", "Fuentes y consecuencias concretas para cada hallazgo esencial"],
    estimate: { input: "10000–35000", output: "1500–5000" },
  },
  conservation: {
    files: {
      "reference/informe.md": "# Informe de exploración completada\nProcedencia: fixture ficticia, investigación ya terminada.\n## Hallazgos\n1. Publicación: README exige revisión, pero publication.js solo comprueba permiso editor y publica. Falta aprobación en la implementación leída.\n2. Identidad: schema.sql exige SKU único entre items activos del workspace; impide duplicados físicos del mismo modelo.\n3. Archivado: inventory.js excluye archived=true, coherente con README y prueba fuente.\n4. Madurez: hay pruebas fuente, no resultados de ejecución; ningún despliegue verificado.\n## Fuentes\nreference/README.md; reference/publication.js; reference/schema.sql; reference/inventory.js; reference/inventory.test.js. Son ubicaciones de la exploración anterior, no fuentes disponibles para reexplorar en este encargo.\n## Límites y decisiones\nSin ejecución. La persona requiere ejemplares separados con SKU compartido, pero no ha adoptado reglas editoriales. Ninguna recomendación constituye aprobación.\n",
    },
    prompt: "Terminó una exploración sustancial del legado ficticio. El informe completo recibido está en reference/informe.md y será un antecedente para varias decisiones de producto. Resuelve su incorporación al trabajo de definición y dime qué decisión deberíamos tratar después. No vuelvas a explorar las fuentes ni adoptes sus reglas como decisiones mías.",
    expected: ["Orchestrator encarga a Canon conservar informe sin orden explícita del usuario de escribirlo", "Canon usa csdd_document report en docs/support/, preservando hallazgos, fuentes, procedencia y límites", "Confirma written y ruta antes de siguiente decisión; sin Genesis ni nueva exploración", "Orchestrator/Canon efectivamente ejecutados con Sol medium; sin override del modelo en delegación"],
    estimate: { input: "10000–35000", output: "1500–5000" },
  },
}
const name = process.argv[2], scenario = cases[name]
assert.ok(scenario, "Caso luna o conservation")
const isolated = name === "luna" && process.argv[3] === "isolated"
const preparedDestination = name === "conservation" && process.argv[3] === "prepared-destination"
const attempt = process.argv[4]
assert.ok(attempt === undefined || /^[a-z0-9-]+$/u.test(attempt), "Identificador de intento inválido")
const maxCalls = name === "conservation" && preparedDestination && attempt === "ten-calls" ? 10 : 8
const evidence = resolve(`tests/evidence/model-assignment-${name}${isolated ? "-isolated" : preparedDestination ? "-prepared" : ""}${attempt ? "-" + attempt : ""}`)
await mkdir(evidence)
const binary = process.env.CSDD_RUNTIME_BIN
assert.ok(binary)
assert.match(spawnSync(binary, ["--version"], { encoding: "utf8" }).stdout, /v2\.0\.22\b/u)
const zip = resolve("dist", distributionArchive)
const digest = createHash("sha256").update(await readFile(zip)).digest("hex")
assert.equal(digest, (await readFile(zip + ".sha256", "utf8")).trim().split(/\s/u)[0])
const container = await mkdtemp("C:/Users/Michael/AppData/Local/Temp/opencode/csdd-model-case-")
const { project: root } = await installDistribution(container, zip)
if (preparedDestination) await mkdir(join(root, "docs/support"), { recursive: true })
for (const [path, text] of Object.entries(scenario.files)) {
  await mkdir(join(root, path, ".."), { recursive: true })
  await writeFile(join(root, path), text)
}
await writeFile(join(evidence, "criteria.json"), JSON.stringify({ ...scenario, isolated, preparedDestination, archive_sha256: digest, max_calls: maxCalls, timeout_ms: 180000, no_retry_or_repair: true, essential_omission_or_material_unsupported_claim_fails: true, semantic_judge: "asistente de mantenimiento, no independiente; sin coincidencia literal" }, null, 2))
const configPath = join(root, ".opencode/opencode.json")
const config = JSON.parse(await readFile(configPath, "utf8"))
config.compaction = { auto: false }
config.plugins.push({ package: "./plugins/model-budget", options: { maxCalls } })
await mkdir(join(root, ".opencode/plugins/model-budget"))
await cp(new URL("./focused-controls.mjs", import.meta.url), join(root, ".opencode/plugins/model-budget/index.mjs"))
await writeFile(join(root, ".opencode/plugins/model-budget/package.json"), JSON.stringify({ name: "model-budget", type: "module", main: "index.mjs" }))
await writeFile(configPath, JSON.stringify(config))
let server, session, family, error, start, elapsed, timer
const cleanup = []
try {
  server = await startServer(root, { program: binary })
  let agents
  const deadline = Date.now() + 30000
  while (true) {
    agents = await server.api("/api/agent")
    const plugins = await server.api("/api/plugin")
    if (["CSDD-Orchestrator", "CSDD-Canon", "CSDD-Explorer", "CSDD-Reviewer"].every(id => agents.some(a => a.id === id)) && JSON.stringify(plugins).includes("csdd.test.focused-budget")) break
    if (Date.now() > deadline) throw new Error("Perfiles/controles no cargados; cero llamadas")
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  const profiles = agents.filter(a => a.id.startsWith("CSDD-")).map(a => ({ id: a.id, model: a.model }))
  for (const profile of profiles) {
    const model = JSON.stringify(profile.model)
    assert.ok(model.includes(profile.id === "CSDD-Explorer" ? "gpt-6-luna" : "gpt-6.1-sol"))
    assert.ok(model.includes(profile.id === "CSDD-Explorer" ? "high" : "medium"))
  }
  await writeFile(join(evidence, "preflight.json"), JSON.stringify({ runtime: "2.0.22", profiles, controls_loaded: true, zero_model_calls: true }, null, 2))
  session = await server.api("/api/session", "POST", { title: `CSDD model assignment ${name}${isolated ? " isolated" : ""}`, agent: isolated ? "CSDD-Explorer" : "CSDD-Orchestrator", model: { providerID: "openai", id: isolated ? "gpt-6-luna" : "gpt-6.1-sol", variant: isolated ? "high" : "medium" }, location: { directory: root } })
  start = Date.now()
  await Promise.race([(async () => {
    await server.api(`/api/session/${session.id}/prompt`, "POST", { text: scenario.prompt })
    await waitSession(server, session.id, Math.max(1, 180000 - (Date.now() - start)))
  })(), new Promise((_, reject) => { timer = setTimeout(() => { server.stop(); reject(new Error("Límite de tres minutos")) }, 180000) })])
  elapsed = Date.now() - start; clearTimeout(timer)
  family = await sessionFamily(server, session.id)
  assertNoToolFailures(family)
  assert.ok(family.every(s => s.info.outcome === "succeeded"))
  assert.equal(family.length, isolated ? 1 : 2)
  const child = isolated ? family[0] : family.find(s => s.info.id !== session.id)
  assert.equal(child.info.agent, name === "luna" ? "CSDD-Explorer" : "CSDD-Canon")
  for (const s of family) {
    const modelID = s.info.agent === "CSDD-Explorer" ? "gpt-6-luna" : "gpt-6.1-sol"
    const variant = s.info.agent === "CSDD-Explorer" ? "high" : "medium"
    assert.equal(s.info.model.id, modelID)
    assert.equal(s.info.model.variant, variant)
    for (const m of s.messages.filter(m => m.type === "assistant" && m.model)) {
      assert.equal(m.model.id, modelID)
      assert.equal(m.model.variant, variant)
    }
  }
  const delegations = toolParts(family[0].messages).filter(p => p.name === "subagent")
  assert.ok(delegations.every(p => !p.state.input.model), "Selección debe venir del perfil")
  for (const [path, text] of Object.entries(scenario.files)) assert.equal(await readFile(join(root, path), "utf8"), text)
  if (name === "luna") {
    const reads = toolParts(child.messages).filter(p => p.name === "read" && p.state.status === "completed")
    for (const path of Object.keys(scenario.files)) assert.ok(reads.some(p => p.state.input.path.replaceAll("\\", "/").endsWith(path)), `Fuente leída: ${path}`)
    await assert.rejects(() => readdir(join(root, "docs")), { code: "ENOENT" })
  } else {
    const tools = toolParts(child.messages)
    assert.ok(tools.some(p => p.name === "csdd_document" && p.state.input.operation === "report" && p.state.status === "completed"))
    assert.deepEqual(await readdir(join(root, "docs")), ["support"])
    const reports = await readdir(join(root, "docs/support"))
    assert.equal(reports.length, 1)
    assert.ok(tools.every(p => !["csdd_write", "subagent", "shell"].includes(p.name)))
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
  if (server && session) try { await server.api(`/api/session/${session.id}`, "DELETE"); cleanup.push("root_and_children_deleted") } catch (caught) { cleanup.push(String(caught)) }
  server?.stop()
  const result = { status: error ? "stopped" : "awaiting_semantic_adjudication", error, archive_sha256: digest, session_id: session?.id, calls, active_elapsed_ms: elapsed, usage: family?.map(s => ({ session_id: s.info.id, agent: s.info.agent, model: s.info.model, tokens: s.info.tokens, cost: s.info.cost })), cleanup }
  await writeFile(join(evidence, "result.json"), JSON.stringify(result, null, 2))
  await rm(container, { recursive: true, force: true })
  console.log(JSON.stringify(result, null, 2))
}
