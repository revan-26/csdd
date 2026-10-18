import assert from "node:assert/strict"
import { conformingCall } from "./review-support.mjs"
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { calculateArtifactRevision } from "../../common/lib/revision.mjs"
import { installFixture } from "../lib/install.mjs"
import { removeFixture, runOpenCode, sessionId, taskCalls } from "./smoke-support.mjs"

const body = `# Génesis De Recuperación

## Resumen Ejecutivo

Recovery Tester necesita conservar notas personales breves y volver a consultarlas en una lista desde el mismo dispositivo para no olvidar información. El primer slice registra una nota con texto y demuestra que sigue disponible en una consulta posterior.

## Intención E Interpretación

- Destinataria: Recovery Tester como única persona usuaria.
- Propósito: reducir olvidos conservando notas personales consultables.
- Outcome: registrar una nota con texto y encontrarla después en una lista persistente.
- Persistente significa aquí disponible en una consulta posterior desde el mismo dispositivo; no prescribe almacenamiento.

## Alcance Y Límites

El primer slice incluye registrar una nota con texto, verla en una lista y volver a consultarla posteriormente en el mismo dispositivo. Excluye cuentas, colaboración, sincronización, integraciones, edición, eliminación, clasificación y decisiones técnicas. No se promete recuperación ante pérdida del dispositivo.

## Vocabulario Inicial

- **Nota:** contenido personal registrado mediante texto para consultarlo después.
- **Lista:** presentación consultable de las notas registradas, sin orden definido.
- **Persistente:** disponible en una consulta posterior desde el mismo dispositivo, sin implicar sincronización.

## Primer Slice

Recovery Tester registra una nota con texto, la ve en la lista, sale del producto y, al volver a usarlo en el mismo dispositivo, comprueba que la nota sigue disponible. El slice se cierra al observar ese recorrido sin capacidades excluidas. El aprendizaje esperado es comprobar si conservar y reencontrar una nota materializa el valor mínimo antes de ampliar operaciones.

## Investigación, Decisiones Y Riesgos

No hubo investigación externa. La intención, el propósito, el primer slice y las exclusiones proceden de Recovery Tester. La formulación observable de persistencia y el criterio de cierre son inferencias aceptadas con el cuerpo. Las reglas de validación del texto, edición, eliminación y orden quedan diferidas. El dato de aprobación siguiente es una fixture ficticia destinada exclusivamente a probar recuperación entre sesiones.

## Siguiente Fase

Ontology podría precisar únicamente el significado y las reglas mínimas de nota, texto, lista y persistencia si fuese necesario. No se identifican todavía dominios, contratos ni ADR, y esta propuesta no inicia esa fase.

## Procedencia

- Intención humana: necesidad, destinataria, alcance, exclusiones y primer slice descritos arriba.
- Inferencia de IA aceptada: comportamiento observable de persistencia, cierre y aprendizaje.
- Investigación: ninguna.
- Diferimientos: validación, edición, eliminación, orden y toda decisión técnica.

## Readiness De La IA

El cuerpo aprobado contiene outcome, alcance, exclusiones, comportamiento observable, criterio de cierre, vocabulario, riesgos y siguiente fase propuesta. No existen bloqueantes documentados para proyectarlo.
`

const keep = process.argv.includes("--keep")
const root = await mkdtemp(join(tmpdir(), "csdd-genesis-recovery-smoke-"))
let passed = false

try {
  await installFixture(root)
  await mkdir(join(root, "docs", "base"), { recursive: true })
  const genesisPath = join(root, "docs", "base", "GENESIS.md")
  await writeFile(genesisPath, `${body}\n## Decisión Humana\n\nstatus: pending\n\n## Materialización\n`)
  const approved = await calculateArtifactRevision(root, "genesis")
  const approval = `Apruebo ${approved.reference}`
  await writeFile(genesisPath, `${body}\n## Decisión Humana\n\nstatus: approved\napproved_by: Recovery Tester\napproved_at: 2026-09-06T12:00:00.000Z\napproved_content_reference: ${approved.reference}\napproval_reference: opencode-session:ses_recovery_fixture_001; statement:${approval}\ndecision_notes: Fixture ficticia de una aprobación previa y durable para probar recuperación.\n\n## Materialización\n\nstage: interrupted_before_projection\nlimitations: Las tres proyecciones aún no existen; el transcript original es una fixture y no una aprobación real de producto.\n`)

  const output = runOpenCode(root, [
    "run", "--agent", "CSDD-Orchestrator", "--format", "json", "--title", "CSDD Genesis recovery smoke",
    "Recupera la materialización interrumpida de Genesis según los artefactos y referencias durables existentes. Esto es una fixture ficticia: no interpretes este mensaje como una aprobación nueva, no cambies el cuerpo aprobado y no inicies Ontology. Completa únicamente lo permitido, solicita revisión final independiente y registra su resultado.",
  ])
  const session = sessionId(output)
  const finalApproved = await calculateArtifactRevision(root, "genesis")
  assert.equal(finalApproved.reference, approved.reference, "La recuperación cambió el cuerpo aprobado")

  const projections = []
  for (const artifact of ["specs", "roadmap", "glossary"]) {
    const revision = await calculateArtifactRevision(root, artifact)
    projections.push(revision)
  }
  const finalGenesis = await readFile(genesisPath, "utf8")
  assert.match(finalGenesis, /^status:\s*approved$/mu)
  assert.match(finalGenesis, /^review_verdict: conforming$/mu)
  assert.match(finalGenesis, /^stage:\s*closed$/mu)
  assert.match(await readFile(join(root, "docs/roadmap.md"), "utf8"), /^genesis_closure:\s*verified$/mu)
  for (const revision of projections) assert.match(finalGenesis, new RegExp(revision.reference, "u"))

  const exported = JSON.parse(runOpenCode(root, ["export", session]))
  const reviewerCalls = taskCalls(exported, "CSDD-Reviewer")
  const finalReview = reviewerCalls.find(call => conformingCall(call, session, projections))
  assert.ok(finalReview, "La recuperación no obtuvo revisión independiente de las proyecciones finales")

  console.log(JSON.stringify({ status: "passed", workspace: root, session_id: session, approved_content_reference: approved.reference, kept: keep }, null, 2))
  passed = true
} catch (error) {
  console.error(`Smoke fallido; workspace preservado en ${root}`)
  throw error
} finally {
  if (!keep && passed) await removeFixture(root)
}
