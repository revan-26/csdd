import assert from "node:assert/strict"
import { conformingCall, ruleCall } from "./review-support.mjs"
import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { calculateArtifactRevision } from "../../common/lib/revision.mjs"
import { writeArtifact } from "../../common/lib/write.mjs"
import { installFixture } from "../lib/install.mjs"
import { assertCompatibleRuntime, removeFixture, runOpenCode, sessionId, taskCalls } from "./smoke-support.mjs"

// Un caso pequeño, dos encargos y una aprobación. Cada invocación está limitada
// a diez minutos por smoke-support; no es una evaluación estadística.
assertCompatibleRuntime(process.cwd())
const root = await mkdtemp(join(tmpdir(), "csdd-genesis-history-smoke-"))
const keep = process.argv.includes("--keep")
let passed = false

function toolParts(exported) {
  const parts = []
  const pending = [exported]
  while (pending.length) {
    const value = pending.pop()
    if (!value || typeof value !== "object") continue
    if (value.type === "tool") parts.push(value)
    pending.push(...Object.values(value))
  }
  return parts
}

function transcriptTools(session, visited = new Set()) {
  if (visited.has(session)) return []
  visited.add(session)
  const exported = JSON.parse(runOpenCode(root, ["export", session]))
  const tools = toolParts(exported)
  for (const agent of ["CSDD-Canon", "CSDD-Reviewer", "CSDD-Explorer"]) {
    for (const call of taskCalls(exported, agent)) {
      const child = call.state.metadata?.sessionId
      assert.ok(child, `Falta sesión hija para auditar ${agent}`)
      tools.push(...transcriptTools(child, visited))
    }
  }
  return tools
}

function readsHistory(part) {
  const input = part.state?.input ?? {}
  const path = String(input.filePath ?? input.path ?? "").replaceAll("\\", "/")
  return (part.tool === "read" && /(?:docs\/base\/|GENESIS\.md$)/u.test(path))
    || (part.tool === "csdd_revision" && input.artifact === "genesis")
    || (part.tool === "grep" && /docs\/base/u.test(path))
}

try {
  await installFixture(root)
  const body = "# Genesis De Fixture\n\nHistory Tester quiere conservar tareas personales y consultarlas después en el mismo dispositivo. Solo una persona usa el producto. Se excluyen cuentas, equipos, colaboración, sincronización e integraciones. Tarea significa un pendiente personal con descripción. El primer slice registra una tarea y la encuentra tras salir y volver al producto. No hay decisiones técnicas.\n"
  const draft = `${body}\n## Decisión Humana\n\nstatus: pending\n\n## Materialización\n\nstage: pending\n`
  await writeArtifact(root, "genesis", draft)
  const initialReference = (await calculateArtifactRevision(root, "genesis")).reference
  await writeArtifact(root, "specs", "# Specs\n\nProducto personal de History Tester para registrar tareas con descripción y encontrarlas después en el mismo dispositivo. Solo una persona; sin cuentas, colaboración, sincronización o integraciones.\n")
  await writeArtifact(root, "glossary", "# Glosario\n\nTarea: pendiente personal registrado con descripción para consultarlo posteriormente. Persistente: disponible tras salir y volver desde el mismo dispositivo; no promete recuperación ante pérdida del dispositivo.\n")
  await writeArtifact(root, "roadmap", `# Roadmap\n\nlifecycle_state: pre_fr\ngenesis_closure: verified\ngenesis_revision: ${initialReference}\ngenesis_review_reference: fixture-review-conforming\n\nPrimer slice aprobado: registrar una tarea y encontrarla posteriormente. La verificación de esta fixture es ficticia, no una aprobación real de producto.\n`)
  await writeArtifact(root, "genesis", draft.replace("status: pending", `status: approved\napproved_by: History Tester\napproved_at: 2026-09-06T12:00:00.000Z\napproved_content_reference: {{csdd_revision:genesis}}\napproval_reference: opencode-session:ses_history_fixture; statement:Apruebo ${initialReference}`)
    .replace("stage: pending", "stage: closed\nreview_verdict: conforming\nreview_reference: fixture-review-conforming\ngenesis_reference: {{csdd_revision:genesis}}\nspecs_reference: {{csdd_revision:specs}}\nroadmap_reference: {{csdd_revision:roadmap}}\nglossary_reference: {{csdd_revision:glossary}}"))
  const initial = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  const originalSpecs = await readFile(join(root, "docs/specs.md"), "utf8")
  await writeArtifact(root, "specs", originalSpecs + "\nRegla vigente posterior aprobada en esta fixture: la descripción debe contener texto no vacío.\n")
  const initialSpecs = await readFile(join(root, "docs/specs.md"), "utf8")

  const compatible = sessionId(runOpenCode(root, ["run", "--agent", "CSDD-Orchestrator", "--format", "json",
    "Ensayo ficticio. Soy History Tester. Evalúa añadir marcar tareas personales como completadas. Solo quiero la propuesta y sus dudas, no autorizo escritura ni implementación. Parte de las fuentes vigentes y delega la interpretación en Canon. No cambian propósito, destinatarios ni límites."]))
  const compatibleTools = transcriptTools(compatible)
  assert.ok(compatibleTools.some((part) => part.tool === "task" && part.state?.input?.subagent_type === "CSDD-Canon"))
  assert.equal(compatibleTools.some(readsHistory), false, "Una feature compatible leyó históricos")
  assert.equal(await readFile(join(root, "docs/specs.md"), "utf8"), initialSpecs)
  assert.equal(await readFile(join(root, "docs/base/GENESIS.md"), "utf8"), initial)

  const fundamental = sessionId(runOpenCode(root, ["run", "--agent", "CSDD-Orchestrator", "--format", "json",
    "Ensayo ficticio. Soy History Tester. Quiero cambiar el fundamento de uso individual: ahora varios miembros de un equipo pueden registrar y consultar tareas del mismo equipo, aisladas de otros equipos. Autorizo evaluar y redactar la revisión fundamental de Genesis, no materializarla todavía. El primer incremento de esta revisión es registrar una tarea del equipo y que otro miembro del mismo equipo la consulte; no añade asignaciones ni notificaciones. Conserva la regla vigente de descripción no vacía. Pregunta si falta una decisión bloqueante; no elijas tecnología ni implementes Ontology."]))
  assert.ok(transcriptTools(fundamental).some(readsHistory), "La revisión fundamental no consultó el histórico")
  const proposed = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  assert.ok(proposed.startsWith(initial), "La propuesta reescribió historia")
  assert.match(proposed, /^# Revisión de GENESIS: [A-Za-z0-9_-]+$/mu)
  const approved = await calculateArtifactRevision(root, "genesis")
  assert.notEqual(approved.reference, initialReference)
  runOpenCode(root, ["run", "--session", fundamental, "--agent", "CSDD-Orchestrator", "--format", "json", `Apruebo ${approved.reference}`])
  const final = await readFile(join(root, "docs/base/GENESIS.md"), "utf8")
  assert.ok(final.startsWith(initial))
  assert.match(final.slice(initial.length), /^stage: closed$/mu)
  assert.match(await readFile(join(root, "docs/roadmap.md"), "utf8"), /^lifecycle_state: pre_fr$/mu)
  assert.doesNotMatch(await readFile(join(root, "docs/roadmap.md"), "utf8"), /^genesis_pending_revision:[ \t]*\S+/mu)
  for (const artifact of ["specs", "roadmap", "glossary"]) {
    const reference = (await calculateArtifactRevision(root, artifact)).reference
    assert.ok(final.slice(initial.length).includes(reference))
  }
  const reviews = taskCalls(JSON.parse(runOpenCode(root, ["export", fundamental])), "CSDD-Reviewer")
  const references = await Promise.all(["specs", "roadmap", "glossary"].map(artifact => calculateArtifactRevision(root, artifact)))
  assert.ok(reviews.some(call => conformingCall(call, fundamental, references)))
  assert.ok(reviews.some(call => ruleCall(call, { genesis: approved.reference, specs: references[0].reference, glossary: references[2].reference })))
  passed = true
  console.log(JSON.stringify({ status: "passed", workspace: root, compatible_session: compatible, fundamental_session: fundamental, reference: approved.reference, kept: keep }, null, 2))
} catch (error) {
  console.error(`Smoke fallido; fixture preservada en ${root}`)
  throw error
} finally {
  if (passed && !keep) await removeFixture(root)
}
