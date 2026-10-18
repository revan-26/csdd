import assert from "node:assert/strict"
import test from "node:test"
import { mkdtemp, rm, readFile, writeFile, mkdir, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { writeDocument } from "../lib/documents.mjs"
import { registerTools } from "../lib/tools.mjs"

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "csdd-documents-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const context = { agent: "CSDD-Canon", sessionID: "ses_test", messageID: "msg_test", signal: new AbortController().signal }
  const data = { title: "Hallazgo", sections: [{ heading: "Propuesta", text: "Evaluar sin adoptar automáticamente." }], sources: ["fixture: intención humana"] }
  return { root, context, data }
}
test("aporte anticipado crea documentos pertinentes como pendientes, nunca aprobados", async t => {
  const { root, context, data } = await fixture(t)
  for (const path of ["docs/base/ONTOLOGY.md", "docs/base/TOPOLOGY.md", "docs/specs.md", "docs/roadmap.md", "docs/architecture.md", "docs/domains/tasks.md", "docs/adrs/storage.md", "docs/contracts/task/contract.md", "docs/mapping/tasks.md"]) {
    const result = await writeDocument(root, context, { operation: "contribute", path, expected_reference: "absent", data })
    assert.equal(result.state, "pending")
    assert.match(await readFile(join(root, path), "utf8"), /Estado del aporte: pending/u)
  }
})
test("continuidad conserva bytes ajenos y bloquea referencia obsoleta", async t => {
  const { root, context, data } = await fixture(t)
  await mkdir(join(root, "docs"))
  const path = "docs/architecture.md", original = "# Decisión vigente\r\n\r\nNo alterar.\r\n"
  await writeFile(join(root, path), original)
  const { reference } = await writeDocument(root, context, { operation: "inspect", path })
  await writeDocument(root, context, { operation: "contribute", path, expected_reference: reference, data })
  assert.ok((await readFile(join(root, path), "utf8")).startsWith(original))
  const after = await readFile(join(root, path))
  await assert.rejects(() => writeDocument(root, context, { operation: "contribute", path, expected_reference: reference, data }), /desactualizada/u)
  assert.deepEqual(await readFile(join(root, path)), after)
})
test("informe consultivo nuevo conserva fuente; no se sobrescribe ni se usa como propuesta normativa", async t => {
  const { root, context, data } = await fixture(t)
  const path = "docs/support/reference.md"
  const result = await writeDocument(root, context, { operation: "report", path, expected_reference: "absent", data })
  assert.equal(result.state, "consultative")
  await assert.rejects(() => writeDocument(root, context, { operation: "report", path, expected_reference: result.reference, data }), /histórico/u)
  await assert.rejects(() => writeDocument(root, context, { operation: "contribute", path, expected_reference: result.reference, data }), /support/u)
})
test("no permite rutas protegidas, escape, identidad inventada o agente distinto de Canon", async t => {
  const { root, context, data } = await fixture(t)
  for (const path of ["docs/base/GENESIS.md", "docs/glossary.md", "../other.md", "docs/../outside.md", "docs/support/a.md:stream", "D:/outside.md"]) {
    await assert.rejects(() => writeDocument(root, context, { operation: "contribute", path, expected_reference: "absent", data }), /Ruta/u)
  }
  await assert.rejects(() => writeDocument(root, { ...context, messageID: undefined }, { operation: "report", path: "docs/support/test.md", expected_reference: "absent", data }), /Identidad/u)
  const tools = new Map()
  await registerTools({ location: { directory: root }, session: { get: async () => ({ id: context.sessionID, location: { directory: root } }) }, tool: { transform: async fn => fn({ add: tool => tools.set(tool.name, tool) }) } })
  for (const agent of ["CSDD-Explorer", "CSDD-Orchestrator", "CSDD-Reviewer", "build"]) await assert.rejects(() => tools.get("csdd_document").execute({ operation: "inspect", path: "docs/specs.md" }, { ...context, agent }), /no autorizado/u)
})
test("no sigue junction de docs fuera del destino", async t => {
  const { root, context, data } = await fixture(t)
  const outside = await mkdtemp(join(tmpdir(), "csdd-documents-outside-"))
  t.after(() => rm(outside, { recursive: true, force: true }))
  await symlink(outside, join(root, "docs"), "junction")
  await assert.rejects(() => writeDocument(root, context, { operation: "contribute", path: "docs/specs.md", expected_reference: "absent", data }), /enlazada/u)
})
