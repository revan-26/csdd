import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import test from "node:test"
import { calculateArtifactRevision, canonicalizeText, genesisApprovedBody } from "../lib/revision.mjs"

async function workspace(context) {
  const root = await mkdtemp(join(tmpdir(), "csdd-revision-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, "docs", "base"), { recursive: true })
  return root
}

const genesis = `# Génesis De Fixture

## Resumen Ejecutivo

Contenido aprobado.

## Decisión Humana

status: pending
approved_content_reference:
approval_reference:

## Materialización
`

test("normaliza BOM, saltos de línea y final de archivo", () => {
  assert.equal(canonicalizeText("\uFEFFuno\r\n\r\ndos  \r\n\r\n"), "uno\n\ndos\n")
})

test("extrae únicamente el cuerpo aprobable de Genesis", () => {
  const body = genesisApprovedBody(genesis)
  assert.match(body, /Contenido aprobado\./)
  assert.doesNotMatch(body, /status: pending/)
})

test("rechaza Genesis sin una frontera administrativa inequívoca", () => {
  assert.throws(() => genesisApprovedBody("# Génesis\n"), /exactamente un encabezado/)
  assert.throws(() => genesisApprovedBody(`${genesis}\n## Decisión Humana\n`), /exactamente un encabezado/)
  assert.throws(() => genesisApprovedBody(genesis.replace("## Materialización", "## Otra")), /Materialización/)
  assert.throws(() => genesisApprovedBody("# Génesis\n\n## Materialización\n\n## Decisión Humana\n"), /después/)
})

test("ignora encabezados administrativos citados en bloques de código", () => {
  const cited = genesis.replace("Contenido aprobado.", "Contenido aprobado.\n\n```markdown\n```texto\n## Decisión Humana\n```")
  assert.match(genesisApprovedBody(cited), /```texto\n## Decisión Humana/u)
})

test("los metadatos administrativos no cambian la referencia de Genesis", async (context) => {
  const root = await workspace(context)
  const path = join(root, "docs", "base", "GENESIS.md")
  await writeFile(path, genesis)
  const before = await calculateArtifactRevision(root, "genesis")
  await writeFile(path, genesis.replace("status: pending", "status: approved").replace("approval_reference:", "approval_reference: human-message"))
  const after = await calculateArtifactRevision(root, "genesis")
  assert.equal(after.reference, before.reference)
})

test("cambiar el cuerpo aprobado cambia la referencia", async (context) => {
  const root = await workspace(context)
  const path = join(root, "docs", "base", "GENESIS.md")
  await writeFile(path, genesis)
  const before = await calculateArtifactRevision(root, "genesis")
  await writeFile(path, genesis.replace("Contenido aprobado.", "Contenido diferente."))
  const after = await calculateArtifactRevision(root, "genesis")
  assert.notEqual(after.reference, before.reference)
})

test("las proyecciones usan el documento completo", async (context) => {
  const root = await workspace(context)
  const path = join(root, "docs", "specs.md")
  await writeFile(path, "# Specs\r\n\r\nRegla.\r\n")
  const before = await calculateArtifactRevision(root, "specs")
  await writeFile(path, "# Specs\n\nRegla.\n")
  const normalized = await calculateArtifactRevision(root, "specs")
  assert.equal(normalized.reference, before.reference)
  await writeFile(path, "# Specs\n\nOtra regla.\n")
  const changed = await calculateArtifactRevision(root, "specs")
  assert.notEqual(changed.reference, before.reference)
})

test("rechaza artefactos no permitidos", async (context) => {
  const root = await workspace(context)
  await assert.rejects(() => calculateArtifactRevision(root, "ontology"), /no permitido/)
})

test("rechaza un enlace que escapa del workspace", async (context) => {
  const root = await workspace(context)
  const outside = join(dirname(root), `${Date.now()}-outside.md`)
  context.after(() => rm(outside, { force: true }))
  await writeFile(outside, "# Fuera\n")
  try {
    await symlink(outside, join(root, "docs", "specs.md"), "file")
  } catch (error) {
    if (error?.code === "EPERM") return context.skip("El entorno no permite crear symlinks")
    throw error
  }
  await assert.rejects(() => calculateArtifactRevision(root, "specs"), /fuera del workspace/)
})
