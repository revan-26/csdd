"""Guarda de escritura de CSDD (hook PreToolUse).

Sale con 2 y explica el motivo para rechazar la herramienta; con 0 la deja seguir su
permiso normal. Ante un error propio rechaza: una guarda rota no autoriza escrituras.

Sobre Genesis y Glossary simula el resultado de la edición. Sobre Bash es una defensa
parcial: busca rutas protegidas en el texto del comando y no detecta una ruta construida
de otra forma.
"""
import collections
import json
import os
import pathlib
import re
import sys

sys.dont_write_bytecode = True

try:
    import csdd_check
    import csdd_doc
    from csdd_doc import DECISION, GENESIS, GLOSSARY, MATERIALIZATION, document
    IMPORT_ERROR = None
except Exception as error:  # el arranque también debe rechazar, no dejar pasar
    IMPORT_ERROR = error

CANON, REVIEWER, EXPLORER = "csdd-canon", "csdd-reviewer", "csdd-explorer"
RESERVED = (".csdd/", ".claude/csdd/", ".claude/skills/csdd-", ".claude/agents/csdd-",
            ".claude/settings.json", ".claude/settings.local.json")
BASH_PROTECTED = ("docs/base", "genesis.md", "glossary.md", ".csdd", ".claude/csdd",
                  ".claude/skills/csdd-", ".claude/agents/csdd-", ".claude/settings", "csdd_doc")
SCRIPT = re.compile(r"^python3? (?:\.claude/csdd/scripts/)(\S+\.py)(?: (.*))?$")
SHELL_SYNTAX = re.compile(r"[;&|<>$`\\\n()]")
READ_SCRIPTS = {
    "csdd_hash.py": re.compile(r"^$"),
    "human_messages.py": re.compile(r"^$"),
    "csdd_check.py": re.compile(r"^.+$"),
    "csdd_review.py": re.compile(r"^(status|diff)$"),
    "csdd_doc.py": re.compile(r"^(status|recover|new .+)$"),
}
RECORD_REVIEW = re.compile(r"^record (conforming|non_conforming|insufficient_evidence)$")
NEW_STRENGTHS = ("propuesto", "supuesto", "diferido")
UNASSIGNED_LINE = re.compile(r"^\[G-NNN · (\S+) · .+\]$")
Term = collections.namedtuple("Term", "title section admin strength raw")


# Escritura

def simulate(tool, tool_input, text):
    """Devuelve el archivo tras la herramienta, o None si la herramienta fallará por sí sola."""
    if tool == "Write":
        return tool_input.get("content", "")
    edits = tool_input.get("edits") if tool == "MultiEdit" else [tool_input]
    for edit in edits or []:
        old, new = edit.get("old_string", ""), edit.get("new_string", "")
        count = text.count(old) if old else 0
        if count == 0 or (count > 1 and not edit.get("replace_all")):
            return None
        text = text.replace(old, new)
    return text


def title_of(text):
    node = document(text)
    return node.title if node is not None else None


def check_genesis(project, before, after):
    if not csdd_doc.has_block(before):
        return f"{GENESIS} no tiene Decisión Humana y Materialización: no se edita."
    decision = csdd_doc.admin_values(before, DECISION).get("status")
    stage = csdd_doc.admin_values(before, MATERIALIZATION).get("stage")
    if decision != "pending" or stage != "pending":
        return "Genesis ya tiene una decisión registrada: su contenido no se edita."
    marker = "\n## Decisión Humana"
    if marker not in after or after.partition(marker)[2] != before.partition(marker)[2]:
        return "Decisión Humana y Materialización las escribe solo el código."
    if title_of(after) != title_of(before):
        return "El título del documento no se cambia."
    return structure_problem(project, GENESIS, after, "genesis")


def structure_problem(project, path, text, doc_type):
    errors = csdd_doc.check(project, path, text, doc_type)
    if errors:
        return "El resultado no respeta la estructura; no se escribió nada:\n" + "\n".join(errors)
    return None


def glossary_entries(text):
    """Separa las entradas con ID de las nuevas, que llevan el literal G-NNN."""
    assigned, unassigned = {}, []
    lines = text.split("\n")
    title = document(text)
    for section_name in ("Términos", "Términos Deprecados"):
        section = title.child(section_name) if title else None
        for entry in section.children if section else []:
            found = entry.text_lines()[:1]
            line = found[0][1].strip() if found else ""
            raw = "\n".join(lines[entry.line - 1:entry.end - 1]).rstrip()
            match = csdd_check.GLOSSARY_ENTRY.match(line)
            literal = UNASSIGNED_LINE.match(line)
            if match:
                assigned[match.group(1)] = Term(entry.title, section_name, line, match.group(2), raw)
            elif literal:
                unassigned.append((entry.title, section_name, literal.group(1)))
    return assigned, unassigned


def check_glossary(project, before, after):
    if title_of(after) != title_of(before):
        return "El título del documento no se cambia."
    previous, _ = glossary_entries(before)
    current, unassigned = glossary_entries(after)
    for entry_id, term in previous.items():
        kept = current.get(entry_id)
        if kept is None:
            if term.strength == "acordado":
                return f"«{term.title}» ({entry_id}) está acordado y no se elimina."
            continue
        if (kept.title, kept.section, kept.admin) != (term.title, term.section, term.admin):
            return f"El título, la sección y la línea administrativa de {entry_id} no se cambian."
        if term.strength == "acordado" and kept.raw != term.raw:
            return f"«{term.title}» ({entry_id}) está acordado y no se edita."
    for entry_id in current:
        if entry_id not in previous:
            return f"{entry_id} no existe: una entrada nueva lleva [G-NNN · propuesto · categoría] y el código asigna el ID."
    for title, section, strength in unassigned:
        if section != "Términos":
            return f"La entrada nueva «{title}» va en Términos."
        if strength not in NEW_STRENGTHS:
            return f"La entrada nueva «{title}» admite la fuerza {', '.join(NEW_STRENGTHS)}; la aprobación escribe acordado."
    numbered, _ = csdd_doc.number_terms(after, csdd_doc.last_assigned_id(project))
    return structure_problem(project, GLOSSARY, numbered, "glossary")


def check_document(project, tool, tool_input, relative, path):
    if tool == "NotebookEdit":
        return "Esta herramienta no edita documentos CSDD."
    if not path.exists():
        return f"{relative} se crea solo con csdd_doc.py new."
    if csdd_doc.pending_id(project) is not None:
        return "Hay una decisión interrumpida: complétala con csdd_doc.py recover."
    before = path.read_text(encoding="utf-8")
    after = simulate(tool, tool_input, before)
    if after is None:
        return None
    check = check_genesis if relative == str(GENESIS) else check_glossary
    return check(project, before, after)


def check_write(project, tool, tool_input, agent, cwd):
    raw = tool_input.get("file_path") or tool_input.get("notebook_path")
    if not raw:
        return None
    relative = csdd_doc.project_relative(project, raw, cwd)
    if agent == REVIEWER:
        return "Reviewer no escribe archivos."
    folded = relative.casefold() if relative is not None else None
    if agent == EXPLORER:
        path = pathlib.Path(project) / (relative or "")
        if relative is None or not folded.startswith("docs/support/") or tool != "Write" or path.exists():
            return "Explorer solo crea informes nuevos en docs/support/."
        return None
    if relative is None:
        return None
    if any(folded.startswith(prefix) for prefix in RESERVED):
        return f"{relative} pertenece a la instalación de CSDD: no se edita con herramientas del agente."
    in_docs = folded.startswith("docs/")
    if agent == CANON and not in_docs:
        return "Canon solo edita docs/."
    if in_docs and agent != CANON:
        return "Solo Canon edita docs/: encárgale el cambio."
    if folded in (str(GENESIS).casefold(), str(GLOSSARY).casefold()):
        canonical = str(GENESIS) if folded == str(GENESIS).casefold() else str(GLOSSARY)
        return check_document(project, tool, tool_input, canonical, pathlib.Path(project) / canonical)
    return None


# Bash

def allowed_script(command, agent, project):
    """Indica si el comando es exactamente un script permitido, sin sintaxis de shell."""
    command = " ".join(command.replace(f"{pathlib.Path(project).resolve()}/", "").split())
    if SHELL_SYNTAX.search(command):
        return False
    match = SCRIPT.match(command)
    if not match:
        return False
    script, arguments = match.group(1), match.group(2) or ""
    if script == "csdd_review.py" and RECORD_REVIEW.match(arguments):
        return agent == REVIEWER
    allowed = READ_SCRIPTS.get(script)
    return bool(allowed and allowed.match(arguments))


def check_bash(project, command, agent):
    if allowed_script(command, agent, project):
        return None
    if agent in (CANON, REVIEWER, EXPLORER):
        return f"{agent} solo ejecuta los scripts de CSDD, como un único comando python3 .claude/csdd/scripts/<script>.py."
    if "record" in command and "csdd_review" in command:
        return "Solo Reviewer registra veredictos."
    folded = command.casefold()
    if any(token in folded for token in BASH_PROTECTED):
        return ("Este comando menciona una ruta protegida de CSDD. Lee con Read y encarga los cambios a Canon; "
                "los scripts de CSDD se ejecutan como un único comando python3 .claude/csdd/scripts/<script>.py.")
    return None


def decide(project, payload):
    """Devuelve el motivo del rechazo, o None si la guarda no objeta."""
    tool = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}
    agent = payload.get("agent_type")
    if tool == "Bash":
        return check_bash(project, tool_input.get("command", ""), agent)
    if tool in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        return check_write(project, tool, tool_input, agent, payload.get("cwd"))
    return None


def main():
    try:
        if IMPORT_ERROR is not None:
            raise IMPORT_ERROR
        payload = json.load(sys.stdin)
        project = pathlib.Path(os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or ".")
        reason = decide(project, payload)
    except Exception as error:
        reason = f"La guarda de CSDD falló y rechaza por seguridad: {error!r}"
    if reason:
        print(f"CSDD: {reason}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
