export const verdictSchema = { type: "string", enum: ["conforming", "non_conforming", "insufficient_evidence"] }
const VERDICTS = new Set(verdictSchema.enum)
const textSchema = { type: "string", minLength: 1, pattern: "\\S" }
export const findingSchema = {
  type: "object", additionalProperties: false,
  properties: {
    severity: { type: "string", enum: ["blocking", "major", "minor"] },
    criterion: textSchema, evidence: textSchema, location: textSchema, impact: textSchema,
  }, required: ["severity", "criterion", "evidence", "location", "impact"],
}
export const semanticCheckSchema = {
  type: "object", additionalProperties: false,
  properties: { criterion: textSchema, verdict: verdictSchema, evidence: textSchema },
  required: ["criterion", "verdict", "evidence"],
}
function validEntry(value, schema) {
  return !!value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).every(key => Object.hasOwn(schema.properties, key))
    && schema.required.every(key => {
      const field = schema.properties[key], entry = value[key]
      return typeof entry === "string" && (!field.enum || field.enum.includes(entry))
        && (!field.minLength || entry.trim().length >= field.minLength)
        && (!field.pattern || new RegExp(field.pattern, "u").test(entry))
    })
}
const ARTIFACTS = ["genesis", "glossary"]
export function parseReviewReport(text) {
  let report
  try { report = JSON.parse(text) } catch { return undefined }
  if (!report || Array.isArray(report) || report.status !== "completed" || !VERDICTS.has(report.verdict)) return undefined
  if (!["draft", "semantic", "administrative"].includes(report.review_kind) || typeof report.summary !== "string") return undefined
  if (!Array.isArray(report.findings) || !Array.isArray(report.semantic_checks) || !Array.isArray(report.limitations)) return undefined
  if (report.limitations.some(value => typeof value !== "string")) return undefined
  const required = report.review_kind === "draft" ? ["genesis"] : ARTIFACTS
  if (!required.every(key => /^sha256:[a-f0-9]{64}$/u.test(report.artifact_references?.[key] ?? ""))) return undefined
  if (!report.artifact_references || Object.keys(report.artifact_references).some(key => !required.includes(key))) return undefined
  if (!/^opencode-session:ses_[A-Za-z0-9_-]+$/u.test(report.review_reference ?? "")) return undefined
  if (report.findings.some(f => !validEntry(f, findingSchema))) return undefined
  if (report.semantic_checks.some(c => !validEntry(c, semanticCheckSchema))) return undefined
  if (new Set(report.semantic_checks.map(c => c.criterion)).size !== report.semantic_checks.length) return undefined
  if (report.review_kind === "administrative" && report.semantic_checks.length) return undefined
  if (report.review_kind === "semantic" && !["preserved_rules", "intent_fidelity"].every(criterion => report.semantic_checks.some(c => c.criterion === criterion))) return undefined
  if (report.review_kind === "draft" && !report.semantic_checks.some(c => c.criterion === "intent_fidelity")) return undefined
  if (report.review_kind === "administrative" && !/^opencode-session:ses_[A-Za-z0-9_-]+$/u.test(report.semantic_review_reference ?? "")) return undefined
  if (report.verdict === "conforming" && (report.findings.some(f => f.severity !== "minor") || report.semantic_checks.some(c => c.verdict !== "conforming"))) return undefined
  return report
}
