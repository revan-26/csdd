import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { genesisRecords } from "../../common/lib/revision.mjs"
import { parseStructure } from "../../common/lib/structured-write.mjs"

export const EVALUATOR_VERSION = "genesis-checkpoints-5"
export class CheckpointError extends Error {
  constructor(category, message) { super(message); this.category = category }
}

// Incluye todos los documentos, no solo los tres derivados conocidos.
export async function documentSnapshot(root) {
  const result = {}
  async function visit(directory, prefix) {
    let entries
    try { entries = await readdir(directory, { withFileTypes: true }) } catch (error) {
      if (error.code === "ENOENT") return
      throw error
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      assert.equal(entry.isSymbolicLink(), false, "Snapshot no admite enlaces")
      const relative = `${prefix}${entry.name}`
      if (entry.isDirectory()) await visit(join(directory, entry.name), relative + "/")
      else if (entry.isFile()) result[relative] = await readFile(join(directory, entry.name), "utf8")
    }
  }
  await visit(join(root, "docs"), "docs/")
  return result
}

export function assertPreserved(before, after, allowed = []) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const key of keys) if (!allowed.includes(key)) assert.equal(after[key], before[key], `Cambio no autorizado: ${key}`)
}

export function activeGenesis(snapshot) {
  const records = genesisRecords(snapshot["docs/base/GENESIS.md"])
  return parseStructure(records.length === 1 ? "genesis" : "genesis_revision", records.at(-1))
}

export function assertPending(snapshot, reviewPaths = []) {
  assert.equal(activeGenesis(snapshot).decision.status, "pending", "Una respuesta inválida registró decisión")
  assert.equal(activeGenesis(snapshot).materialization.stage, "pending")
  for (const key of ["docs/specs.md", "docs/roadmap.md", "docs/glossary.md"]) assert.equal(snapshot[key], undefined, "Proyección prematura")
  for (const key of Object.keys(snapshot)) assert.ok(["docs/base/GENESIS.md", "docs/base/.genesis-recovery-pending", ...reviewPaths].includes(key), `Artefacto prematuro: ${key}`)
}

// Abrir una revisión permite SOLO su indicador administrativo en Roadmap;
// no obliga a conservar idénticos los bytes de ese campo autorizado.
export function assertProposalPreserved(before, after) {
  assertPreserved(before, after, ["docs/base/GENESIS.md", "docs/base/.genesis-recovery-pending", "docs/roadmap.md"])
  const previous = parseStructure("roadmap", before["docs/roadmap.md"])
  const current = parseStructure("roadmap", after["docs/roadmap.md"])
  delete previous.metadata.genesis_pending_revision
  delete current.metadata.genesis_pending_revision
  assert.deepEqual(current, previous, "La propuesta cambió Roadmap fuera del indicador autorizado")
}

// El supervisor juzga significado. El código valida alcance y evidencia,
// nunca clasifica preguntas por palabras ni acepta respuestas libres.
export function validateAdjudication(request, decision) {
  if (decision?.checkpoint !== request.checkpoint || decision?.request_digest !== request.request_digest
    || typeof decision.evidence !== "string" || !decision.evidence.trim()
    || !Object.hasOwn(request.actions, decision.action)) {
    throw new CheckpointError("experiment_unresolved", "Adjudicación inválida, ajena al checkpoint o sin evidencia")
  }
  return decision
}

export function createSupervisor(root, { timeout = 600_000 } = {}) {
  let sequence = 0
  return async function adjudicate(context) {
    const checkpoint = String(++sequence).padStart(3, "0")
    const directory = join(root, "supervision")
    await mkdir(directory, { recursive: true })
    const request = { evaluator_version: EVALUATOR_VERSION, checkpoint, ...context }
    request.request_digest = createHash("sha256").update(JSON.stringify(request)).digest("hex")
    await writeFile(join(directory, `${checkpoint}.request.json`), JSON.stringify(request, null, 2), { flag: "wx" })
    console.log(`Adjudicación pendiente: ${join(directory, checkpoint + ".request.json")}`)
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      try {
        const decision = validateAdjudication(request, JSON.parse(await readFile(join(directory, `${checkpoint}.decision.json`), "utf8")))
        await writeFile(join(directory, `${checkpoint}.adjudication.json`), JSON.stringify({ ...decision, observed_at: new Date().toISOString() }, null, 2), { flag: "wx" })
        if (decision.action === "stop") throw new CheckpointError("experiment_unresolved", decision.evidence)
        if (decision.action === "violation") throw new CheckpointError("product_violation", decision.evidence)
        return decision
      } catch (error) {
        if (error.code !== "ENOENT") throw error
      }
      await delay(250)
    }
    throw new CheckpointError("experiment_unresolved", "Sin adjudicación: no se inventó una decisión ni se reintentó")
  }
}

// Revalida el estado tras cada aclaración; como máximo dos intervenciones
// predefinidas por checkpoint, dentro del presupuesto global de la corrida.
export async function reachCheckpoint({ name, observe, ready, invariant, adjudicate, prompt, clarifications = {} }) {
  const used = new Set()
  for (;;) {
    const state = await observe()
    invariant(state)
    const complete = ready(state)
    const actions = { ...(complete ? { accept: "Confirmar con evidencia que el punto de control se alcanzó" } : {}), ...Object.fromEntries(Object.entries(clarifications).filter(([key]) => !used.has(key))), violation: "Incumplimiento semántico del producto demostrado con criterio, ubicación y evidencia", stop: "Situación no prevista o decisión abierta: no atribuir fallo de producto sin evidencia" }
    const decision = await adjudicate({ name, state, actions })
    if (decision.action === "accept" && complete) return state
    if (decision.action === "stop") throw new CheckpointError("experiment_unresolved", decision.evidence)
    if (decision.action === "violation") throw new CheckpointError("product_violation", decision.evidence)
    if (!Object.hasOwn(clarifications, decision.action) || used.has(decision.action) || used.size >= 2) throw new CheckpointError("experiment_unresolved", "Aclaración no definida o límite del checkpoint")
    used.add(decision.action)
    await prompt(clarifications[decision.action])
  }
}
