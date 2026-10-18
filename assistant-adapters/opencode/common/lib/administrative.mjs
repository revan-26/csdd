// Solo el bloque escalar inicial. Notas, subtítulos y ejemplos no son campos.
export function administrativeFields(text, heading = false) {
  const lines = text.replace(/\r\n?/gu, "\n").split("\n")
  if (heading) lines.shift()
  const result = {}
  let started = false
  for (const line of lines) {
    if (!line.trim()) { if (started) break; continue }
    const match = /^([a-z_]+): ([^\r\n]+)$/u.exec(line)
    if (!match) break
    started = true
    if (Object.hasOwn(result, match[1])) throw new Error("Campo administrativo duplicado")
    result[match[1]] = match[2]
  }
  return result
}

export class ArtifactGuardError extends Error {
  constructor(code, message) { super(message); this.name = "ArtifactGuardError"; this.guardCode = code }
}
