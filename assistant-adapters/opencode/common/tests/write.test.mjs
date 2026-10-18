import assert from "node:assert/strict"
import { link, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import test from "node:test"
import { writeArtifact } from "../lib/write.mjs"

async function workspace(context) {
  const root = await mkdtemp(join(tmpdir(), "csdd-write-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, "docs", "base"), { recursive: true })
  return root
}

test("escribe solo el artefacto seleccionado en docs", async (context) => {
  const root = await workspace(context)
  const result = await writeArtifact(root, "specs", "# Specs\r\n")
  assert.equal(result.path, "docs/specs.md")
  assert.equal(await readFile(join(root, "docs", "specs.md"), "utf8"), "# Specs\n")
  await assert.rejects(() => writeArtifact(root, "ontology", "# Ontology\n"), /no permitido/)
})

test("rechaza un destino que sea enlace simbólico", async (context) => {
  const root = await workspace(context)
  const outside = join(dirname(root), `${Date.now()}-outside.md`)
  context.after(() => rm(outside, { force: true }))
  await writeFile(outside, "# Fuera\n")
  try {
    await symlink(outside, join(root, "docs", "base", "GENESIS.md"), "file")
  } catch (error) {
    if (error?.code === "EPERM") return context.skip("El entorno no permite crear symlinks")
    throw error
  }
  await assert.rejects(() => writeArtifact(root, "genesis", "# Cambio\n"), /enlace simbólico/)
  assert.equal(await readFile(outside, "utf8"), "# Fuera\n")
})

test("reemplaza un hard link sin modificar su otro destino", async (context) => {
  const root = await workspace(context)
  const outside = join(dirname(root), `${Date.now()}-hardlink.md`)
  context.after(() => rm(outside, { force: true }))
  await writeFile(outside, "# Fuera\n")
  await link(outside, join(root, "docs", "specs.md"))
  await writeArtifact(root, "specs", "# Dentro\n")
  assert.equal(await readFile(outside, "utf8"), "# Fuera\n")
  assert.equal(await readFile(join(root, "docs", "specs.md"), "utf8"), "# Dentro\n")
})

test("inserta referencias actuales y rechaza un cierre con referencias corruptas", async (context) => {
  const root = await workspace(context)
  const approvedBody = "# Genesis\n\nContenido aprobado.\n"
  const draft = `${approvedBody}\n## Decisión Humana\n\nstatus: pending\n\n## Materialización\n`
  await writeFile(join(root, "docs", "base", "GENESIS.md"), draft)
  for (const [file, text] of [["specs.md", "# Specs\n"], ["roadmap.md", "# Roadmap\n"], ["glossary.md", "# Glossary\n"]]) {
    await writeFile(join(root, "docs", file), text)
  }

  const closed = `${approvedBody}\n## Decisión Humana\n\nstatus: approved\napproved_content_reference: {{csdd_revision:genesis}}\n\n## Materialización\n\nstage: closed\ngenesis_reference: {{csdd_revision:genesis}}\nspecs_reference: {{csdd_revision:specs}}\nroadmap_reference: {{csdd_revision:roadmap}}\nglossary_reference: {{csdd_revision:glossary}}\n`
  await writeArtifact(root, "genesis", closed)
  const written = await readFile(join(root, "docs", "base", "GENESIS.md"), "utf8")
  assert.doesNotMatch(written, /\{\{csdd_revision:/u)

  await assert.rejects(
    () => writeArtifact(root, "genesis", written.replace(/^glossary_reference: sha256:[a-f0-9]{64}$/mu, `glossary_reference: sha256:${"0".repeat(64)}`)),
    /referencia real de glossary/,
  )
})

test("rechaza una carpeta docs que resuelva fuera del workspace", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "csdd-write-root-"))
  const outside = await mkdtemp(join(tmpdir(), "csdd-write-outside-"))
  context.after(() => rm(root, { recursive: true, force: true }))
  context.after(() => rm(outside, { recursive: true, force: true }))
  try {
    await symlink(outside, join(root, "docs"), "junction")
  } catch (error) {
    if (error?.code === "EPERM") return context.skip("El entorno no permite crear symlinks")
    throw error
  }
  await assert.rejects(() => writeArtifact(root, "specs", "# Specs\n"), /fuera del workspace/)
})
