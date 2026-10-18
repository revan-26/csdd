import { parseReviewReport } from "../../common/lib/review-report.mjs"

export function conformingCall(call, parentID, references) {
  const report = parseReviewReport(call.state.output)
  return !!report && report.verdict === "conforming"
    && call.state.metadata?.parentSessionId === parentID
    && call.state.metadata?.sessionId !== parentID
    && report.review_reference === `opencode-session:${call.state.metadata?.sessionId}`
    && references.every(revision => report.artifact_references[revision.artifact] === revision.reference)
}
export function ruleCall(call, references) {
  const report = parseReviewReport(call.state.output)
  return !!report && report.verdict === "conforming" && report.review_kind === "semantic"
    && Object.entries(references).every(([artifact, reference]) => report.artifact_references[artifact] === reference)
    && report.semantic_checks.some(c => c.criterion === "preserved_rules" && c.verdict === "conforming")
}
