"""Instala o actualiza CSDD en un proyecto.

Copia framework/ a <proyecto>/.csdd/, integration/claude-code/ a <proyecto>/.claude/
y las herramientas de tools/ a <proyecto>/.claude/csdd/scripts/. Agrega los hooks
de CSDD a <proyecto>/.claude/settings.json sin tocar el resto de la configuración.

Uso:
    python3 install.py RUTA_DEL_PROYECTO [--dry-run]

El manifiesto <proyecto>/.claude/csdd/install.json registra la huella de cada
archivo instalado. Una actualización reemplaza solo archivos instalados que no
fueron modificados en el proyecto; ante un archivo modificado o ajeno se detiene
sin escribir nada. Nunca toca docs/ ni .claude/csdd/state/.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import sys

MINIMUM_PYTHON = (3, 8)
SOURCE = pathlib.Path(__file__).resolve().parent
MANIFEST = ".claude/csdd/install.json"
SETTINGS = ".claude/settings.json"
INTEGRATION_SETTINGS = "settings.json"
HOOK_MARKER = ".claude/csdd/scripts/"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def plan_files(source):
    """Devuelve {ruta relativa en el proyecto: archivo fuente}."""
    files = {}
    for path in sorted((source / "framework").rglob("*")):
        if path.is_file():
            files[str(pathlib.PurePosixPath(".csdd", *path.relative_to(source / "framework").parts))] = path
    integration = source / "integration" / "claude-code"
    for path in sorted(integration.rglob("*")):
        relative = path.relative_to(integration)
        if path.is_file() and relative.parts != (INTEGRATION_SETTINGS,):
            files[str(pathlib.PurePosixPath(".claude", *relative.parts))] = path
    for path in sorted((source / "tools").glob("*.py")):
        files[f".claude/csdd/scripts/{path.name}"] = path
    return {k: v for k, v in files.items() if "__pycache__" not in k and not k.endswith(".DS_Store")}


def is_csdd_hook(entry):
    return any(HOOK_MARKER in hook.get("command", "") for hook in entry.get("hooks", []))


def merge_settings(current, csdd_hooks):
    """Quita los hooks de CSDD de la configuración y agrega los nuevos."""
    merged = json.loads(json.dumps(current))
    hooks = merged.get("hooks", {})
    for event in list(hooks):
        hooks[event] = [entry for entry in hooks[event] if not is_csdd_hook(entry)]
        if not hooks[event]:
            del hooks[event]
    for event, entries in csdd_hooks.items():
        hooks.setdefault(event, []).extend(entries)
    if hooks:
        merged["hooks"] = hooks
    else:
        merged.pop("hooks", None)
    return merged


def source_version(source):
    try:
        result = subprocess.run(["git", "-C", str(source), "rev-parse", "--short", "HEAD"],
                                capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "desconocida"


def plan(project, source=SOURCE):
    """Calcula las acciones sin escribir. Devuelve (acciones, conflictos, manifiesto nuevo, settings)."""
    actions, conflicts = [], []
    manifest_path = project / MANIFEST
    previous = {}
    if manifest_path.exists():
        try:
            previous = json.loads(manifest_path.read_text(encoding="utf-8"))["files"]
        except (ValueError, KeyError):
            conflicts.append(f"{MANIFEST}: manifiesto ilegible")
    files = plan_files(source)
    installed = {}
    for relative, src in files.items():
        data = src.read_bytes()
        installed[relative] = digest(data)
        target = project / relative
        if not target.exists():
            actions.append(("crear", relative, data))
            continue
        current = digest(target.read_bytes())
        if current == installed[relative]:
            continue
        if previous.get(relative) == current:
            actions.append(("actualizar", relative, data))
        elif relative in previous:
            conflicts.append(f"{relative}: modificado en el proyecto desde la última instalación")
        else:
            conflicts.append(f"{relative}: ya existe y no fue instalado por CSDD")
    for relative, recorded in previous.items():
        target = project / relative
        if relative in files or not target.exists():
            continue
        if digest(target.read_bytes()) == recorded:
            actions.append(("eliminar", relative, None))
        else:
            conflicts.append(f"{relative}: ya no forma parte de CSDD y fue modificado en el proyecto")
    settings = None
    integration_settings = source / "integration" / "claude-code" / INTEGRATION_SETTINGS
    csdd_hooks = {}
    if integration_settings.exists():
        csdd_hooks = json.loads(integration_settings.read_text(encoding="utf-8")).get("hooks", {})
    settings_path = project / SETTINGS
    current_settings = {}
    if settings_path.exists():
        try:
            current_settings = json.loads(settings_path.read_text(encoding="utf-8"))
        except ValueError:
            conflicts.append(f"{SETTINGS}: no es JSON válido")
    if not any(c.startswith(SETTINGS) for c in conflicts):
        merged = merge_settings(current_settings, csdd_hooks)
        if merged != current_settings and (merged or settings_path.exists()):
            settings = merged
            actions.append(("configurar", SETTINGS, None))
    manifest = {"version": source_version(source), "files": installed}
    return actions, conflicts, manifest, settings


def apply(project, actions, manifest, settings):
    for action, relative, data in actions:
        target = project / relative
        if action in ("crear", "actualizar"):
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        elif action == "eliminar":
            target.unlink()
    if settings is not None:
        path = project / SETTINGS
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(settings, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    path = project / MANIFEST
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main(argv=None):
    if sys.version_info < MINIMUM_PYTHON:
        print("CSDD requiere Python 3.8 o posterior.", file=sys.stderr)
        return 2
    parser = argparse.ArgumentParser(description="Instala o actualiza CSDD en un proyecto.")
    parser.add_argument("project", type=pathlib.Path, metavar="RUTA_DEL_PROYECTO")
    parser.add_argument("--dry-run", action="store_true", help="muestra las acciones sin escribir")
    args = parser.parse_args(argv)
    project = args.project.resolve()
    if not project.is_dir():
        print(f"{project}: no existe o no es una carpeta", file=sys.stderr)
        return 2
    if project == SOURCE or SOURCE in project.parents:
        print("No se instala CSDD dentro de su propio repositorio fuente.", file=sys.stderr)
        return 2
    actions, conflicts, manifest, settings = plan(project)
    if conflicts:
        print("No se instaló nada. Conflictos:", file=sys.stderr)
        for conflict in conflicts:
            print(f"  {conflict}", file=sys.stderr)
        return 1
    for action, relative, _ in actions:
        print(f"{action}: {relative}")
    if args.dry_run:
        return 0
    apply(project, actions, manifest, settings)
    state = "instalado en" if actions else "ya está al día en"
    print(f"CSDD {manifest['version']} {state} {project}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
