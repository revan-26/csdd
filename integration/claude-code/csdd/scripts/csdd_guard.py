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
    from csdd_doc import GENESIS, GLOSSARY, document
    from csdd_hash import revision_start
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
REVISE = ("csdd_doc.py", "revise")
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


def open_block(genesis):
    """Bloque activo de Genesis si admite cambios, o el motivo por el que no los admite."""
    if not csdd_doc.has_block(genesis):
        return None, f"{GENESIS} no tiene Decisión Humana y Materialización en todos sus bloques: no se edita."
    block = csdd_doc.active(genesis)
    decision = csdd_doc.node_admin(block.decision).get("status")
    stage = csdd_doc.node_admin(block.materialization).get("stage")
    if decision != "pending" or stage != "pending":
        return None, ("Genesis ya tiene una decisión registrada: para cambiarlo, la persona pide una revisión "
                      "y se abre con python3 .claude/csdd/scripts/csdd_doc.py revise.")
    return block, None


def frozen_parts(genesis, block_id):
    """Lo que una edición no puede tocar: lo anterior al contenido del bloque y lo posterior."""
    if block_id is None:
        _, marker, tail = genesis.partition("\n## Decisión Humana")
        return None, marker + tail
    start = revision_start(genesis, block_id)
    heading_end = genesis.index("\n", start)
    _, marker, tail = genesis[heading_end:].partition("\n### Decisión Humana")
    return genesis[:heading_end], marker + tail


def check_genesis(project, before, after):
    block, problem = open_block(before)
    if problem:
        return problem
    head, tail = frozen_parts(before, block.id)
    if block.id is not None and not after.startswith(head):
        return f"Lo anterior a la revisión {block.id} no se edita: los cambios van en sus secciones."
    if not tail or not after.endswith(tail) or len(after) < len(head or "") + len(tail):
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


def entry_problem(entry_id, term, kept, revision):
    """Comprueba el cambio de una entrada existente; devuelve el problema o None."""
    label = f"«{term.title}» ({entry_id})"
    if kept is None:
        if term.strength == "acordado":
            hint = " ni se elimina; si su concepto cambió, trasládalo a Términos Deprecados" if revision else " y no se elimina"
            return f"{label} está acordado{hint}."
        return None
    if term.section == "Términos Deprecados" and kept.raw != term.raw:
        return f"{label} está deprecado y no se edita."
    deprecated = revision and term.section == "Términos" and kept.section == "Términos Deprecados"
    confirmed = (revision and term.strength == "supuesto" and kept.strength == "propuesto"
                 and kept.admin == term.admin.replace("· supuesto ·", "· propuesto ·"))
    if kept.title != term.title or (kept.section != term.section and not deprecated) or (
            kept.admin != term.admin and not confirmed):
        if revision:
            return (f"El título y el ID de {entry_id} no se cambian; dentro de una revisión su fuerza solo pasa "
                    "de supuesto a propuesto y solo se traslada a Términos Deprecados.")
        return f"El título, la sección y la línea administrativa de {entry_id} no se cambian."
    if term.strength == "acordado" and kept.raw != term.raw and not revision:
        return (f"{label} está acordado y no se edita: tras aprobar Genesis, un término cambia "
                "dentro de una revisión.")
    return None


def check_glossary(project, before, after):
    genesis_path = pathlib.Path(project) / GENESIS
    if not genesis_path.exists():
        return f"{GLOSSARY} se edita junto a {GENESIS}, que no existe."
    block, problem = open_block(genesis_path.read_text(encoding="utf-8"))
    if problem:
        return problem.replace("para cambiarlo", "para cambiar el glosario")
    if title_of(after) != title_of(before):
        return "El título del documento no se cambia."
    previous, _ = glossary_entries(before)
    current, unassigned = glossary_entries(after)
    for entry_id, term in previous.items():
        problem = entry_problem(entry_id, term, current.get(entry_id), block.id is not None)
        if problem:
            return problem
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
    if (script, arguments) == REVISE:
        return agent is None
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
