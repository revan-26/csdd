import { createHash } from "node:crypto"
import { lstat, mkdir, open, readFile, realpath } from "node:fs/promises"
import { join, dirname } from "node:path"

const text = { type: "string", minLength: 1 }
const line = { ...text, pattern: "^[^\\r\\n]+$" }
const name = "[a-zA-Z0-9][a-zA-Z0-9_-]*"
const allowed = new RegExp(`^docs/(?:base/(?:ONTOLOGY|TOPOLOGY)\\.md|(?:architecture|specs|roadmap)\\.md|(?:domains|adrs|mapping|support)/${name}\\.md|contracts/${name}/contract\\.md)$`, "u")
export const documentSchema = {
  type: "object", additionalProperties: false,
  properties: {
    operation: { type: "string", enum: ["inspect", "contribute", "report"] },
    path: { ...line, pattern: allowed.source, description: "Ruta del workspace: docs/base/{ONTOLOGY,TOPOLOGY}.md, docs/{architecture,specs,roadmap}.md, docs/{domains,adrs,mapping,support}/<nombre>.md o docs/contracts/<nombre>/contract.md. Nombre: letra ASCII o dígito inicial, luego letras ASCII, dígitos, guion o guion bajo. La misma restricción aplica a inspect, contribute y report: Genesis/Glossary no se admiten ni para inspección. Sin enlaces, subcarpetas adicionales, archivos asociados ni rutas de otro repositorio. report solo crea support; contribute añade propuestas pendientes." },
    expected_reference: { type: "string", description: "Referencia devuelta por inspect, o absent para crear. Obligatoria al escribir." },
    data: { type: "object", additionalProperties: false, properties: {
      title: line,
      sections: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, properties: { heading: line, text }, required: ["heading", "text"] } },
      sources: { type: "array", minItems: 1, items: text, description: "Rutas/URL y ubicaciones/versiones consultadas, o referencia al encargo para una propuesta humana." },
    }, required: ["title", "sections", "sources"] },
  }, required: ["operation", "path"],
}
const hash = bytes => "sha256:" + createHash("sha256").update(bytes).digest("hex")
const pending = "Estado del aporte: pending. No constituye aprobación, cierre ni verificación ejecutada."
function clean(value, single = false) {
  if (typeof value !== "string" || !value.trim() || value.includes("\0") || (single && /[\r\n]/u.test(value))) throw new Error("Texto de documento inválido")
  return value
}
function exact(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) throw new Error("Campos de documento inválidos")
}
async function safePath(root, path, createParents) {
  if (!allowed.test(path)) throw new Error("Ruta no admitida para inspect, contribute ni report; Genesis/Glossary quedan fuera de csdd_document")
  let current = await realpath(root)
  const parts = path.split("/")
  for (let i = 0; i < parts.length; i++) {
    current = join(current, parts[i])
    let stat
    try { stat = await lstat(current) } catch (error) {
      if (error.code !== "ENOENT") throw error
      if (i < parts.length - 1 && createParents) { await mkdir(current); stat = await lstat(current) }
      else continue
    }
    if (stat.isSymbolicLink() || (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) throw new Error("Ruta enlazada o de tipo incorrecto; no seguir enlaces")
    if (i === parts.length - 1 && stat.nlink > 1) throw new Error("Archivo con enlaces múltiples; no escribir")
  }
  return current
}

// Un escritor por workspace; no promete protección frente a un proceso hostil que
// sustituya directorios durante la escritura. Cambios observados bloquean operación.
export async function writeDocument(root, context, input) {
  exact(input, ["operation", "path", "expected_reference", "data"])
  if (!["inspect", "contribute", "report"].includes(input.operation)) throw new Error("Operación desconocida")
  context.signal.throwIfAborted()
  const target = await safePath(root, input.path, false)
  let before
  try { before = await readFile(target) } catch (error) { if (error.code !== "ENOENT") throw error }
  const reference = before ? hash(before) : "absent"
  if (input.operation === "inspect") return { status: "observed", path: input.path, reference }
  if (input.expected_reference !== reference) throw new Error("Referencia desactualizada; inspeccionar y reconciliar sin sobrescribir")
  const support = input.path.startsWith("docs/support/")
  if ((input.operation === "report") !== support) throw new Error("support/ requiere report; los aportes pertenecen a documentos de producto")
  if (support && before !== undefined) throw new Error("Informe histórico existente; crear otro informe sin sobrescribir")
  exact(input.data, ["title", "sections", "sources"])
  const { title, sections, sources } = input.data
  clean(title, true)
  if (!Array.isArray(sections) || !sections.length || !Array.isArray(sources) || !sources.length) throw new Error("Se requieren secciones y fuentes")
  for (const section of sections) { exact(section, ["heading", "text"]); clean(section.heading, true); clean(section.text) }
  sources.forEach(source => clean(source))
  if (!/^ses_[\w-]+$/u.test(context.sessionID ?? "") || !/^msg_[\w-]+$/u.test(context.messageID ?? "")) throw new Error("Identidad de runtime incompleta")
  const stamp = new Date().toISOString()
  const record = `${before ? "\n\n" : ""}# ${title}\n\n${support ? "Informe de exploración: evidencia consultiva, sin autoridad normativa." : pending}\n\nProcedencia: ${context.sessionID}/${context.messageID}\nRegistrado: ${stamp}\n\n${sections.map(s => `## ${s.heading}\n\n${s.text}`).join("\n\n")}\n\n## Fuentes Del Aporte\n\n${sources.map(s => `- ${s}`).join("\n")}\n`
  await safePath(root, input.path, true)
  context.signal.throwIfAborted()
  const handle = await open(target, before === undefined ? "wx" : "r+")
  try {
    if (before !== undefined) {
      const actual = await handle.readFile()
      if (hash(actual) !== reference) throw new Error("Cambio concurrente; no escribir")
    }
    context.signal.throwIfAborted()
    const suffix = Buffer.from(record)
    let offset = 0
    while (offset < suffix.length) {
      const { bytesWritten } = await handle.write(suffix, offset, suffix.length - offset, (before?.length ?? 0) + offset)
      if (!bytesWritten) throw new Error("Escritura incompleta; conservar y revisar")
      offset += bytesWritten
    }
    await handle.sync()
  } finally { await handle.close() }
  const expected = Buffer.concat([before ?? Buffer.alloc(0), Buffer.from(record)])
  if (!(await readFile(target)).equals(expected)) throw new Error("Contenido cambió durante escritura; revisar")
  return { status: "written", path: input.path, reference: hash(expected), previous_reference: reference, state: support ? "consultative" : "pending", session_id: context.sessionID, message_id: context.messageID, written_at: stamp }
}
