import { build } from "esbuild"
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { dirname, join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { composeAgents } from "../../common/build/agents.mjs"
import { generateTemplates } from "../../common/build/generate-templates.mjs"
import { distributionVersion, opencodeBaseline, distributionName, distributionArchive } from "./release.mjs"

const versionRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const root = resolve(versionRoot, "../../..")

export async function prepareDistribution(destination) {
  await generateTemplates({ check: true })
  const payload = join(destination, distributionName)
  await mkdir(payload, { recursive: true })
  await cp(join(root, "framework"), join(payload, "framework"), { recursive: true })
  const adapter = join(payload, "assistant-adapters/opencode-v2")
  await composeAgents(versionRoot, resolve(versionRoot, "../common"), join(adapter, "agents"))
  await mkdir(join(adapter, "plugins/csdd"), { recursive: true })
  const result = await build({
    entryPoints: [join(versionRoot, "plugins/csdd/index.mjs")],
    outfile: join(adapter, "plugins/csdd/index.mjs"), bundle: true, platform: "node", format: "esm",
    target: "node24", metafile: true, legalComments: "eof", treeShaking: true,
  })
  for (const output of Object.values(result.metafile.outputs)) {
    for (const imported of output.imports) {
      if (!imported.path.startsWith("node:")) throw new Error(`Dependencia externa en la entrega: ${imported.path}`)
    }
  }
  const included = Object.values(result.metafile.outputs).flatMap(output => Object.entries(output.inputs)
    .filter(([, info]) => info.bytesInOutput > 0)
    .map(([path, info]) => ({ source: path.replaceAll("\\", "/").split("node_modules/").at(-1), bytes: info.bytesInOutput })))
  await writeFile(join(payload, "BUNDLE-REPORT.json"), JSON.stringify({ externalImports: Object.values(result.metafile.outputs).flatMap(output => output.imports.map(entry => entry.path)), included }, null, 2) + "\n")
  await writeFile(join(adapter, "opencode.json"), JSON.stringify({
    $schema: "https://opencode.ai/config.json", plugins: ["./plugins/csdd"], experimental: { subagent_depth: 2 },
  }, null, 2) + "\n")
  await writeFile(join(adapter, "plugins/csdd/package.json"), JSON.stringify({ name: "csdd-genesis-bundle", private: true, type: "module", main: "./index.mjs" }, null, 2) + "\n")
  await cp(join(versionRoot, "build/instalar.bat"), join(payload, "instalar.bat"))
  await cp(join(versionRoot, "build/LEEME.md"), join(payload, "LEEME.md"))
  await writeFile(join(payload, "VERSION"), `CSDD ${distributionVersion} candidate\nIntegration: OpenCode V2\nOpenCode baseline: ${opencodeBaseline}\n`)
  const license = await readFile(join(versionRoot, "build/OPENCODE-LICENSE.txt"), "utf8")
  const effectLicense = await readFile(join(versionRoot, "node_modules/effect/LICENSE"), "utf8")
  await writeFile(join(payload, "THIRD-PARTY-NOTICES.txt"), "@opencode/plugin and @opencode/schema 2.0.22\nSource license: https://github.com/anomalyco/opencode/blob/dev/LICENSE\n" + license + "\n\neffect (version pinned by package-lock.json)\n" + effectLicense)
  const files = {}
  async function inventory(directory, relative = "") {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name)
      const name = relative + entry.name
      if (entry.isDirectory()) await inventory(path, name + "/")
      else files[name] = createHash("sha256").update(await readFile(path)).digest("hex")
    }
  }
  await inventory(payload)
  await writeFile(join(payload, "MANIFEST.json"), JSON.stringify({ version: distributionVersion, status: "candidate", integration: "opencode2", opencode: opencodeBaseline, files }, null, 2) + "\n")
  return payload
}

export async function buildZip(outputDirectory = join(root, "dist")) {
  if (process.platform !== "win32") throw new Error("La construcción ZIP inicial requiere Windows PowerShell")
  const stage = await mkdtemp(join(tmpdir(), "csdd-dist-"))
  try {
    const payload = await prepareDistribution(stage)
    await mkdir(outputDirectory, { recursive: true })
    const zip = resolve(outputDirectory, distributionArchive)
    const command = `Compress-Archive -LiteralPath '${payload.replaceAll("'", "''")}' -DestinationPath '${zip.replaceAll("'", "''")}' -Force`
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8" })
    if (result.status !== 0) throw new Error(result.stderr || result.stdout)
    const digest = createHash("sha256").update(await readFile(zip)).digest("hex")
    await writeFile(zip + ".sha256", digest + "  " + distributionArchive + "\n")
    return { zip, sha256: digest }
  } finally { await rm(stage, { recursive: true, force: true }) }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildZip(), null, 2))
