import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { renderStructure } from "../../common/lib/structure.mjs"
import { parseStructure } from "../../common/lib/structured-write.mjs"
import { canonicalizeText } from "../../common/lib/revision.mjs"
import { parseReviewReport } from "../../common/lib/review-report.mjs"
import { toolParts, recordedReviewReports } from "./transcript.mjs"

export function digest(content) { return "sha256:" + createHash("sha256").update(canonicalizeText(content)).digest("hex") }
function merge(previous, patch) {
  const result = structuredClone(previous)
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete result[key]
    else if (value && typeof value === "object" && !Array.isArray(value)) result[key] = merge(result[key] ?? {}, value)
    else result[key] = structuredClone(value)
  }
  return result
}

export function roadmapVersions(family, seeds = []) {
  const observations = toolParts(family).filter(part => part.name === "csdd_revision" && part.state?.status === "completed")
    .flatMap(part => {
      try {
        const result = JSON.parse((part.state.content ?? []).filter(p => p.type === "text").map(p => p.text).join("\n"))
        return typeof result.artifact === "string" && /^sha256:[a-f0-9]{64}$/u.test(result.reference ?? "") ? [{ artifact: result.artifact, reference: result.reference, time: part.time.completed }] : []
      } catch { return [] }
    }).sort((a, b) => a.time - b.time)
  function resolve(value, time) {
    if (typeof value === "string") return value.replace(/\{\{csdd_revision:([a-z]+)\}\}/gu, (token, artifact) => observations.filter(o => o.artifact === artifact && o.time <= time).at(-1)?.reference ?? token)
    if (Array.isArray(value)) return value.map(item => resolve(item, time))
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, time)]))
    return value
  }
  const writes = toolParts(family).filter(part => part.name === "csdd_write" && part.state?.status === "completed" && part.state.input?.artifact === "roadmap")
    .concat(seeds.map(seed => ({ seed, time: { completed: seed.time } })))
    .concat(toolParts(family).filter(part => part.name === "csdd_review" && part.state?.status === "completed" && part.state.input?.operation === "begin").flatMap(part => {
      let result
      try { result = JSON.parse((part.state.content ?? []).filter(p => p.type === "text").map(p => p.text).join("\n")) } catch { return [] }
      if (result.status !== "prepared" || typeof result.snapshots?.roadmap !== "string") return []
      assert.equal(digest(result.snapshots.roadmap), result.artifact_references.roadmap, "Snapshot real de begin no corresponde a su referencia")
      return [{ seed: { data: parseStructure("roadmap", result.snapshots.roadmap), time: part.time.completed }, time: { completed: part.time.completed } }]
    }))
    .sort((a, b) => a.time.completed - b.time.completed)
  let data
  const versions = []
  for (const part of writes) {
    if (part.seed) {
      data = structuredClone(part.seed.data)
      versions.push({ data: structuredClone(data), reference: digest(renderStructure("roadmap", data).content), time: part.seed.time })
      continue
    }
    const output = (part.state.content ?? []).filter(p => p.type === "text").map(p => p.text).join("\n")
    let result
    try { result = JSON.parse(output) } catch { continue }
    if (result.status !== "written") continue
    const input = part.state.input
    const resolved = resolve(result.applied_data ?? input.data, part.time.completed)
    if (input.operation === "create") data = structuredClone(resolved)
    else if (input.operation === "update" && data) data = merge(data, resolved)
    else continue
    const rendered = renderStructure("roadmap", data)
    if (rendered.valid) versions.push({ data: structuredClone(data), reference: digest(rendered.content), time: part.time.completed })
  }
  return versions
}

export function reviewReports(family, parentID) {
  return family.filter(child => child.info.agent === "CSDD-Reviewer" && child.info.parentID === parentID && child.info.outcome === "succeeded")
    .flatMap(child => recordedReviewReports(child))
}

export function roadmapProduct(data) {
  const copy = structuredClone(data)
  for (const key of ["last_reviewed", "genesis_closure", "genesis_revision", "genesis_review_reference", "genesis_pending_revision"]) delete copy.metadata[key]
  // La sección de evidencia se adjudica por significado por el supervisor;
  // excluirla aquí NO acredita que todo cambio allí sea administrativo.
  delete copy.sections.evidence
  return copy
}

export function assertReviewChain({ family, parentID, references, roadmap, finalReviewReference, roadmapSeeds = [] }) {
  const reports = reviewReports(family, parentID)
  const final = reports.find(entry => entry.report.review_kind === "administrative" && entry.report.verdict === "conforming"
    && entry.report.review_reference === finalReviewReference
    && Object.entries(references).every(([key, value]) => entry.report.artifact_references[key] === value))
  assert.ok(final, "Falta comprobación administrative final de las versiones exactas")
  const semantic = reports.filter(entry => entry.report.review_kind === "semantic" && entry.report.verdict === "conforming"
    && entry.report.review_reference === final.report.semantic_review_reference && entry.time < final.time
    && ["genesis", "specs", "glossary"].every(key => entry.report.artifact_references[key] === references[key]))
    .sort((a, b) => b.time - a.time)[0]
  assert.ok(semantic, "La comprobación final no enlaza una revisión semantic anterior de las versiones protegidas")
  const versions = roadmapVersions(family, roadmapSeeds)
  const reviewed = versions.filter(v => v.reference === semantic.report.artifact_references.roadmap && v.time < semantic.time).at(-1)
  assert.ok(reviewed, "No hay snapshot reproducible de Roadmap para la evaluación semántica")
  const current = parseStructure("roadmap", roadmap)
  assert.equal(digest(roadmap), references.roadmap)
  assert.deepEqual(roadmapProduct(current), roadmapProduct(reviewed.data), "Roadmap cambió contenido no administrativo tras la evaluación semantic")
  for (const version of versions.filter(v => v.time > semantic.time)) assert.deepEqual(roadmapProduct(version.data), roadmapProduct(reviewed.data), "Cambio transitorio de significado tras semantic")
  return { semantic: semantic.report, administrative: final.report, reviewed_roadmap: reviewed.data, final_roadmap: current }
}
