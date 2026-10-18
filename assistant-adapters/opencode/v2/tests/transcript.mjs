import { parseReviewReport } from "../../common/lib/review-report.mjs"

export function toolParts(value) {
  const result = []
  const pending = [value]
  while (pending.length) {
    const current = pending.pop()
    if (!current || typeof current !== "object") continue
    if (current.type === "tool") result.push(current)
    pending.push(...Object.values(current))
  }
  return result
}

export function textContent(value) {
  const result = []
  const pending = [value]
  while (pending.length) {
    const current = pending.pop()
    if (!current || typeof current !== "object") continue
    if (current.type === "text" && typeof current.text === "string") result.push(current.text)
    pending.push(...Object.values(current))
  }
  return result.join("\n")
}

export async function sessionFamily(server, sessionID) {
  const family = []
  const pending = [sessionID]
  const visited = new Set()
  while (pending.length) {
    const id = pending.pop()
    if (visited.has(id)) throw new Error("La familia de sesiones contiene un ciclo")
    visited.add(id)
    const info = await server.api(`/api/session/${id}`)
    const messages = []
    let cursor
    do {
      const query = new URLSearchParams(cursor ? { cursor } : { order: "asc", limit: "100" })
      const page = await server.api(`/api/session/${id}/message?${query}`, "GET", undefined, 60_000, true)
      messages.push(...page.data)
      const next = page.cursor?.next
      if (next && next === cursor) throw new Error("Cursor de mensajes repetido")
      cursor = next
    } while (cursor)
    family.push({ info, messages })
    let childCursor
    do {
      const query = new URLSearchParams({ parentID: id, limit: "100", ...(childCursor ? { cursor: childCursor } : {}) })
      const children = await server.api(`/api/session?${query}`, "GET", undefined, 60_000, true)
      if (children.data.some(child => child.parentID !== id)) throw new Error("La API devolvió una sesión ajena a la familia")
      pending.push(...children.data.map(child => child.id))
      if (pending.length + visited.size > 100) throw new Error("El smoke supera el límite de 100 sesiones; no se omite evidencia")
      const next = children.cursor?.next
      if (next && next === childCursor) throw new Error("Cursor de sesiones repetido")
      childCursor = next
    } while (childCursor)
  }
  return family
}

// Solo texto emitido por el asistente; no prompts, tool results ni citas
// extraídas recursivamente del contexto.
export function assistantResponses(messages) {
  return messages.filter(message => message.type === "assistant" && !message.error)
    .map(message => (message.content ?? []).filter(part => part.type === "text").map(part => part.text).join("\n"))
}

export function recordedReviewReports(child) {
  return child.messages.filter(message => message.type === "assistant" && !message.error).flatMap(message =>
    (message.content ?? []).filter(part => part.type === "tool" && part.name === "csdd_review"
      && part.state?.status === "completed" && part.state.input?.operation === "complete").flatMap(part => {
      try {
        const value = JSON.parse((part.state.content ?? []).filter(p => p.type === "text").map(p => p.text).join("\n"))
        const report = parseReviewReport(JSON.stringify(value))
        if (!report || report.review_reference !== `opencode-session:${child.info.id}` || value.review_message_id !== message.id) return []
        return [{ report, time: part.time?.completed ?? message.time?.completed ?? message.time?.created, snapshots: value.snapshots, message_id: message.id }]
      } catch { return [] }
    }))
}

export function conformingReview(child, parentID, references, genesisReference) {
  if (child.info.parentID !== parentID || child.info.agent !== "CSDD-Reviewer" || child.info.outcome !== "succeeded") return false
  const report = recordedReviewReports(child).at(-1)?.report
  return !!report && report.verdict === "conforming" && report.review_kind === "semantic"
    && report.review_reference === `opencode-session:${child.info.id}`
    && (!genesisReference || report.artifact_references.genesis === genesisReference)
    && references.every((reference, index) => report.artifact_references[["glossary"][index]] === reference)
}

export function semanticRuleReview(family, parentID, references) {
  return family.some(child => {
    if (child.info.parentID !== parentID || child.info.agent !== "CSDD-Reviewer" || child.info.outcome !== "succeeded") return false
    return recordedReviewReports(child).some(({ report }) => {
      return report?.verdict === "conforming" && report.review_kind === "semantic"
        && report.review_reference === `opencode-session:${child.info.id}`
        && ["genesis", "glossary"].every(key => report.artifact_references[key] === references[key])
        && report.semantic_checks.some(check => check.criterion === "preserved_rules" && check.verdict === "conforming")
    })
  })
}
