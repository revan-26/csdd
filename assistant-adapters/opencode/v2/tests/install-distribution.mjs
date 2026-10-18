import { mkdir, readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { distributionName } from "../build/release.mjs"

export async function installDistribution(workspace, zip) {
  if (process.platform !== "win32") throw new Error("El smoke de distribución inicial requiere Windows")
  const archive = resolve(zip)
  const destination = resolve(workspace)
  const extracted = join(destination, "distribution")
  const ps = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `Expand-Archive -LiteralPath '${archive.replaceAll("'", "''")}' -DestinationPath '${extracted.replaceAll("'", "''")}'`], { encoding: "utf8" })
  if (ps.status !== 0) throw new Error(ps.stderr || ps.stdout)
  const project = join(destination, "project")
  await mkdir(project)
  const bat = join(extracted, distributionName, "instalar.bat")
  const installed = spawnSync(process.env.ComSpec, ["/d", "/c", `""${bat}" "${project}""`], { cwd: destination, encoding: "utf8", timeout: 30_000, windowsVerbatimArguments: true })
  if (installed.status !== 0) throw new Error(installed.stderr + installed.stdout)
  return { project, archive, sha256: createHash("sha256").update(await readFile(archive)).digest("hex") }
}
