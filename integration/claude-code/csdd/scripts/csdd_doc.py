"""Operaciones de código sobre Genesis y Glossary: creación, decisión, cierre y recuperación.

new NOMBRE  crea docs/base/GENESIS.md y docs/glossary.md desde sus plantillas.
revise      abre al final de un Genesis cerrado un bloque «Revisión De GENESIS» nuevo y
            conserva el glosario vigente para restaurarlo si la revisión se rechaza.
status      muestra el estado del bloque activo y comprueba las constancias.
recover     completa una decisión interrumpida a partir de su constancia.

approve() y reject() no tienen línea de comandos: los invoca el hook que recibe
/csdd-approve o /csdd-reject, porque la decisión debe venir de una intervención humana.
Actúan sobre el bloque activo: el cuerpo inicial o la última revisión. El cuerpo inicial
no se rechaza; se corrige en la conversación hasta aprobarlo.

Una decisión primero guarda su constancia en .claude/csdd/state/decisions/ y la señal
.claude/csdd/state/pending, luego escribe los documentos y al final retira la señal.
"""
import collections
import datetime
import json
import os
import pathlib
import re
import sys

sys.dont_write_bytecode = True

import csdd_check
from csdd_hash import GENESIS, GLOSSARY, block_body, prefix_of, sha
from csdd_review import REVISIONS, empty_sections, snapshot_path
from csdd_review import load as load_review

STATE = pathlib.Path(".claude/csdd/state")
TEMPLATES = pathlib.Path(".csdd/templates")
GENESIS_TITLE = re.compile(r"^Genesis De (.+)$")
DECISION, MATERIALIZATION = "Decisión Humana", "Materialización"
UNASSIGNED_ENTRY = re.compile(r"^\[G-NNN · (.+\])$", re.MULTILINE)
ASSIGNED_ID = re.compile(r"^\[G-(\d{3}) · ", re.MULTILINE)
IDS_STATE = STATE / "glossary_ids.json"
REVISION_TITLE = re.compile(r"^Revisión De GENESIS: (\S+)$")
INITIAL_NOT_REJECTED = ("El Genesis inicial no se rechaza: pide los ajustes en la conversación "
                        "hasta aprobarlo.")
Block = collections.namedtuple("Block", "id node decision materialization")


class DocError(Exception):
    """Una operación no puede continuar; el mensaje se muestra a la persona."""


def write_atomic(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(text, encoding="utf-8")
    os.replace(temporary, path)


def template(project, name):
    path = project / TEMPLATES / name
    if not path.exists():
        raise DocError(f"No existe {TEMPLATES / name}: instala CSDD en este proyecto.")
    return path.read_text(encoding="utf-8")


def project_relative(project, raw, cwd=None):
    """Ruta relativa al proyecto en formato POSIX, o None si queda fuera de él."""
    root = pathlib.Path(project).resolve()
    path = pathlib.Path(raw)
    if not path.is_absolute():
        path = pathlib.Path(cwd or root) / path
    try:
        return path.resolve().relative_to(root).as_posix()
    except ValueError:
        return None


def one_line(value):
    return " ".join(value.split())


def document(text):
    children = csdd_check.parse(text).children
    return children[0] if children else None


def check(project, path, text, doc_type):
    errors = csdd_check.check_text(str(path), text, doc_type, project / TEMPLATES)
    return [f"{p}:{line}: {message}" for p, line, message in errors]


def require_valid(project, path, text, doc_type):
    errors = check(project, path, text, doc_type)
    if errors:
        raise DocError("Hay errores de estructura:\n" + "\n".join(errors))


# Creación

def new(project, name):
    name = one_line(name)
    if not name or "<" in name or ">" in name:
        raise DocError("Indica un nombre de proyecto en una línea, sin < ni >.")
    existing = [str(p) for p in (GENESIS, GLOSSARY) if (project / p).exists()]
    if existing:
        raise DocError(f"Ya existe {', '.join(existing)}: no se crea de nuevo.")
    texts = {}
    for path, doc_type in ((GENESIS, "genesis"), (GLOSSARY, "glossary")):
        texts[path] = csdd_check.skeleton(template(project, csdd_check.TEMPLATES[doc_type]), name)
        require_valid(project, path, texts[path], doc_type)
    for path, text in texts.items():
        write_atomic(project / path, text)
    return f"Creados {GENESIS} y {GLOSSARY} para {name}."


# Bloques de Genesis

def blocks(genesis):
    """Bloques con decisión propia: el cuerpo inicial (id None) y cada revisión, en orden."""
    title = document(genesis)
    if title is None:
        return []
    found = [Block(None, title, title.child(DECISION), title.child(MATERIALIZATION))]
    for child in title.children:
        match = REVISION_TITLE.match(child.title)
        if match:
            found.append(Block(match.group(1), child, child.child(DECISION), child.child(MATERIALIZATION)))
    return found


def block_of(genesis, block_id):
    found = next((b for b in blocks(genesis) if b.id == block_id), None)
    if found is None or found.decision is None or found.materialization is None:
        raise DocError(f"{GENESIS} no tiene el bloque {block_label(block_id)} completo.")
    return found


def active(genesis):
    found = blocks(genesis)
    return found[-1] if found else None


def block_label(block_id):
    return f"la revisión {block_id}" if block_id else "inicial"


def body_or_none(genesis, block_id):
    try:
        return block_body(genesis, block_id)
    except SystemExit:
        return None


def node_admin(node):
    found = (csdd_check.ADMIN_LINE.match(line.strip()) for _, line in node.body)
    return {m.group(1): m.group(2).strip() for m in found if m}


def admin_values(text, section):
    """Administración de una sección del bloque activo."""
    block = active(text)
    return node_admin(block.decision if section == DECISION else block.materialization)


def has_block(genesis):
    """Todos los bloques tienen Decisión Humana y Materialización."""
    found = blocks(genesis)
    return (bool(found) and "\n## Decisión Humana" in genesis
            and all(b.decision is not None and b.materialization is not None for b in found))


# Edición de administración

def set_admin(text, block_id, part, values):
    lines = text.split("\n")
    for number, line in getattr(block_of(text, block_id), part).body:
        match = csdd_check.ADMIN_LINE.match(line.strip())
        if match and match.group(1) in values:
            lines[number - 1] = f"{match.group(1)}: {values[match.group(1)]}"
    return "\n".join(lines)


def fill_section(text, block_id, section, content):
    lines = text.split("\n")
    node = block_of(text, block_id).materialization.child(section)
    lines[node.line:node.end - 1] = ["", content, ""]
    return "\n".join(lines)


def add_decision_note(text, block_id, content):
    block = block_of(text, block_id)
    lines = text.split("\n")
    at = block.materialization.line - 1
    heading = "#" * (block.decision.level + 1)
    lines[at:at] = [f"{heading} Notas De La Decisión", "", content, ""]
    return "\n".join(lines)


def glossary_terms(text):
    """Devuelve las entradas vigentes como (número de línea, ID, fuerza, categoría)."""
    title = document(text)
    section = title.child("Términos") if title else None
    for entry in section.children if section else []:
        for number, line in entry.text_lines()[:1]:
            match = csdd_check.GLOSSARY_ENTRY.match(line.strip())
            if match:
                yield (number, *match.groups())


def promote_terms(text):
    """Pasa a acordado los términos propuestos; no cambia ninguna otra línea."""
    lines = text.split("\n")
    for number, entry_id, strength, category in glossary_terms(text):
        if strength == "propuesto":
            lines[number - 1] = f"[{entry_id} · acordado · {category}]"
    return "\n".join(lines)


def restored_glossary(project, genesis, block_id):
    """Glosario de un rechazo: el conservado al abrir la revisión."""
    if block_id is None:  # rechazos del cuerpo inicial anteriores a las revisiones
        name = GENESIS_TITLE.match(document(genesis).title).group(1)
        return csdd_check.skeleton(template(project, csdd_check.TEMPLATES["glossary"]), name)
    path = project / snapshot_path(block_id)
    if not path.exists():
        raise DocError(f"Falta el glosario conservado al abrir {block_id}: no se puede restaurar.")
    return path.read_text(encoding="utf-8")


# IDs del glosario

def number_terms(text, last):
    """Numera las entradas [G-NNN · …] desde el mayor ID conocido. Devuelve (texto, IDs nuevos)."""
    used = [int(found) for found in ASSIGNED_ID.findall(text)]
    counter = [max([last, *used])]
    assigned = []

    def assign(match):
        counter[0] += 1
        assigned.append(f"G-{counter[0]:03d}")
        return f"[{assigned[-1]} · {match.group(1)}"
    return UNASSIGNED_ENTRY.sub(assign, text), assigned


def last_assigned_id(project):
    try:
        return int(json.loads((project / IDS_STATE).read_text(encoding="utf-8"))["last"])
    except (OSError, ValueError, KeyError, TypeError):
        return 0


def assign_ids(project):
    """Asigna IDs a las entradas nuevas del glosario; un ID asignado no se reutiliza."""
    text = (project / GLOSSARY).read_text(encoding="utf-8")
    numbered, assigned = number_terms(text, last_assigned_id(project))
    if assigned:
        write_atomic(project / IDS_STATE, json.dumps({"last": int(assigned[-1][2:])}) + "\n")
        write_atomic(project / GLOSSARY, numbered)
    return assigned


# Estado

def read_documents(project):
    for path in (GENESIS, GLOSSARY):
        if not (project / path).exists():
            raise DocError(f"No existe {path}.")
    return ((project / GENESIS).read_text(encoding="utf-8"),
            (project / GLOSSARY).read_text(encoding="utf-8"))


def revision_meta_path(project, block_id):
    return project / REVISIONS / f"{block_id}.json"


def prefix_problem(project, genesis, block_id):
    """Comprueba que lo anterior a una revisión sigue como al abrirla; devuelve el problema o None."""
    if block_id is None:
        return None
    try:
        meta = json.loads(revision_meta_path(project, block_id).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return f"La constancia de apertura de {block_id} falta o está corrupta."
    if sha(prefix_of(genesis, block_id)) != meta.get("prefix"):
        return f"El contenido anterior a {block_id} cambió desde que se abrió la revisión."
    return None


def require_open_block(project, genesis):
    """Devuelve el bloque activo si admite una decisión."""
    if not has_block(genesis):
        raise DocError(f"{GENESIS} no tiene Decisión Humana y Materialización en todos sus bloques.")
    if pending_id(project) is not None:
        raise DocError("Hay una decisión interrumpida: complétala con csdd_doc.py recover.")
    block = active(genesis)
    status = node_admin(block.decision).get("status")
    if status != "pending":
        raise DocError(f"Genesis ya tiene una decisión registrada (status: {status}).")
    problem = prefix_problem(project, genesis, block.id)
    if problem:
        raise DocError(problem)
    return block


def pending_id(project):
    path = project / STATE / "pending"
    return path.read_text(encoding="utf-8").strip() if path.exists() else None


def decision_id_of(at, block_id):
    """ID de la constancia: la fecha de la decisión y, en una revisión, su bloque."""
    stamp = at.replace(":", "")
    return f"{stamp}-{block_id}" if block_id else stamp


def decision_path(project, decision_id):
    return project / STATE / "decisions" / f"{decision_id}.json"


def load_decision(project, decision_id):
    try:
        return json.loads(decision_path(project, decision_id).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise DocError(f"La constancia {decision_id} falta o está corrupta: no se puede completar.")


# Revisión

def revision_block(project, block_id):
    """Esqueleto de una revisión: sus secciones y la administración de Genesis un nivel abajo."""
    revision = template(project, csdd_check.REVISION_TEMPLATE).replace("<revision_id>", block_id)
    head = csdd_check.skeleton(revision, "").partition("\n### Decisión Humana")[0]
    tail = csdd_check.skeleton(template(project, csdd_check.TEMPLATES["genesis"]), "x")
    tail = "\n## Decisión Humana" + tail.partition("\n## Decisión Humana")[2]
    tail = re.sub(r"^(#{2,5}) ", lambda match: "#" + match.group(1) + " ", tail, flags=re.MULTILINE)
    return head.rstrip("\n") + "\n" + tail


def revise(project):
    genesis, glossary = read_documents(project)
    if pending_id(project) is not None:
        raise DocError("Hay una decisión interrumpida: complétala con csdd_doc.py recover.")
    report, problem = status_report(project)
    if problem:
        raise DocError(f"No se abre una revisión: {report}")
    block = active(genesis)
    decision, materialization = node_admin(block.decision), node_admin(block.materialization)
    closed = decision.get("status") == "approved" and materialization.get("stage") == "closed"
    if not (closed or materialization.get("disposition") == "abandoned"):
        raise DocError("Solo se abre una revisión sobre un Genesis cerrado o una revisión abandonada.")
    require_valid(project, GLOSSARY, glossary, "glossary")
    block_id = f"R-{len(blocks(genesis)):03d}"
    revised = genesis.rstrip("\n") + "\n\n" + revision_block(project, block_id)
    require_valid(project, GENESIS, revised, "genesis")
    meta = {"opened_at": utc_now(), "prefix": sha(prefix_of(revised, block_id)), "glossary": sha(glossary)}
    write_atomic(project / snapshot_path(block_id), glossary)
    write_atomic(revision_meta_path(project, block_id), json.dumps(meta, indent=2) + "\n")
    write_atomic(project / GENESIS, revised)
    return f"Abierta la revisión {block_id} de Genesis; el glosario vigente quedó conservado."


# Decisión y cierre

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def require_ready(project, genesis, glossary, block):
    require_valid(project, GENESIS, genesis, "genesis")
    require_valid(project, GLOSSARY, glossary, "glossary")
    empty, _ = empty_sections(genesis, template(project, csdd_check.TEMPLATES["genesis"]),
                              template(project, csdd_check.REVISION_TEMPLATE))
    if empty:
        raise DocError("Genesis tiene secciones obligatorias vacías: " + ", ".join(empty) + ".")
    review = load_review(project)
    if review is None or review.get("block") != block.id:
        raise DocError("No hay revisión registrada de este bloque: encarga la revisión antes de aprobar.")
    if review.get("verdict") != "conforming":
        raise DocError(f"El último veredicto de la revisión es {review.get('verdict')}.")
    if review.get("genesis_body") != sha(block_body(genesis, block.id)) or review.get("glossary") != sha(glossary):
        raise DocError("El contenido cambió después de la revisión: revisa el cambio antes de aprobar.")
    return review


def approve(project, name, session_id=None, prompt_id=None):
    name = one_line(name)
    if not name:
        raise DocError("Indica tu nombre: /csdd-approve <tu nombre>.")
    genesis, glossary = read_documents(project)
    block = require_open_block(project, genesis)
    review = require_ready(project, genesis, glossary, block)
    strengths = collections.Counter(term[2] for term in glossary_terms(glossary))
    at = utc_now()
    record = {
        "decision": "approved", "block": block.id, "by": name, "at": at,
        "reference": f"csdd-approve {at}",
        "session_id": session_id, "prompt_id": prompt_id,
        "genesis_body": sha(block_body(genesis, block.id)),
        "glossary_before": sha(glossary),
        "glossary_after": sha(promote_terms(glossary)),
        "review_reference": f"reviewer {review['reviewed_at']}",
        "terms": {"acordado": strengths["propuesto"], "supuesto": strengths["supuesto"],
                  "diferido": strengths["diferido"]},
    }
    return persist(project, record, genesis, glossary)


def reject(project, name, reason, session_id=None, prompt_id=None):
    name, reason = one_line(name), one_line(reason)
    if not name or not reason:
        raise DocError("Indica nombre y motivo: /csdd-reject <tu nombre>: <motivo>.")
    genesis, glossary = read_documents(project)
    block = require_open_block(project, genesis)
    if block.id is None:
        raise DocError(INITIAL_NOT_REJECTED)
    require_valid(project, GENESIS, genesis, "genesis")
    at = utc_now()
    record = {
        "decision": "rejected", "block": block.id, "by": name, "at": at,
        "reference": f"csdd-reject {at}", "reason": reason,
        "session_id": session_id, "prompt_id": prompt_id,
        "genesis_body": sha(block_body(genesis, block.id)),
        "glossary_before": sha(glossary),
        "glossary_after": sha(restored_glossary(project, genesis, block.id)),
    }
    return persist(project, record, genesis, glossary)


def decided_glossary(project, record, genesis, glossary):
    if record["decision"] == "approved":
        return promote_terms(glossary)
    return restored_glossary(project, genesis, record.get("block"))


def decided_genesis(record, genesis):
    block_id = record.get("block")
    if record["decision"] == "rejected":
        text = set_admin(genesis, block_id, "decision", {
            "status": "rejected", "rejected_by": record["by"], "rejected_at": record["at"],
            "rejection_reference": record["reference"]})
        text = add_decision_note(text, block_id, f"Motivo: {record['reason']}")
        return set_admin(text, block_id, "materialization", {"disposition": "abandoned"})
    text = set_admin(genesis, block_id, "decision", {
        "status": "approved", "approved_by": record["by"], "approved_at": record["at"],
        "approved_content_reference": record["genesis_body"], "approval_reference": record["reference"]})
    text = set_admin(text, block_id, "materialization", {
        "stage": "closed", "genesis_reference": record["genesis_body"],
        "glossary_reference": record["glossary_after"], "review_reference": record["review_reference"],
        "review_verdict": "conforming"})
    terms = record["terms"]
    checks = ["- Estructura de Genesis y Glossary comprobada contra sus plantillas, sin errores.",
              "- El cuerpo y el glosario candidato coinciden con las huellas del veredicto conforme."]
    if block_id is not None:
        checks[1] = (f"- La revisión {block_id} y el glosario coinciden con las huellas del veredicto "
                     "conforme; el contenido anterior coincide con el de su apertura.")
    checks.append(f"- Glossary: términos que pasan a acordado, {terms['acordado']}; "
                  f"supuestos sin cambio, {terms['supuesto']}; diferidos sin cambio, {terms['diferido']}.")
    text = fill_section(text, block_id, "Verificación", "\n".join(checks))
    return fill_section(text, block_id, "Limitaciones", "\n".join([
        "- El nombre es el declarado en el comando; no autentica a la persona.",
        "- Las constancias de revisión y decisión no resisten manipulación local.",
        "- Estas comprobaciones son estructurales; la fidelidad proviene de la revisión semántica."]))


def persist(project, record, genesis, glossary):
    """Comprueba el resultado en memoria y solo entonces guarda la constancia y lo escribe."""
    final_glossary = decided_glossary(project, record, genesis, glossary)
    require_valid(project, GLOSSARY, final_glossary, "glossary")
    require_valid(project, GENESIS, decided_genesis(record, genesis), "genesis")
    decision_id = decision_id_of(record["at"], record.get("block"))
    write_atomic(decision_path(project, decision_id), json.dumps(record, indent=2, ensure_ascii=False) + "\n")
    write_atomic(project / STATE / "pending", decision_id + "\n")
    return complete(project, decision_id)


def outcome(record):
    block_id = record.get("block")
    if record["decision"] == "approved":
        if block_id:
            return f"Revisión {block_id} de Genesis aprobada por {record['by']} y cerrada ({record['reference']})."
        return f"Genesis aprobado por {record['by']} y cerrado ({record['reference']})."
    if block_id:
        return (f"Revisión {block_id} de Genesis rechazada por {record['by']} y abandonada "
                f"({record['reference']}). Glossary restaurado al de su apertura.")
    return f"Genesis rechazado por {record['by']} y abandonado ({record['reference']}). Glossary restaurado."


def complete(project, decision_id):
    """Escribe lo que falte de una decisión. Es repetible tras una interrupción."""
    record = load_decision(project, decision_id)
    block_id = record.get("block")
    genesis, glossary = read_documents(project)
    body = body_or_none(genesis, block_id)
    if not has_block(genesis) or body is None or sha(body) != record["genesis_body"]:
        raise DocError("El cuerpo de Genesis difiere de la constancia: inspecciona antes de continuar.")
    current = sha(glossary)
    if current == record["glossary_before"]:
        final = decided_glossary(project, record, genesis, glossary)
        if sha(final) != record["glossary_after"]:
            raise DocError("El glosario resultante difiere de la constancia: inspecciona antes de continuar.")
        if record["decision"] == "rejected":
            write_atomic(project / STATE / "rejected" / f"{decision_id}-glossary.md", glossary)
        write_atomic(project / GLOSSARY, final)
    elif current != record["glossary_after"]:
        raise DocError("El glosario difiere de la constancia: inspecciona antes de continuar.")
    status = node_admin(block_of(genesis, block_id).decision).get("status")
    if status == "pending":
        genesis = decided_genesis(record, genesis)
        write_atomic(project / GENESIS, genesis)
    elif status != record["decision"]:
        raise DocError("La Decisión Humana difiere de la constancia: inspecciona antes de continuar.")
    final_genesis, final_glossary = read_documents(project)
    require_valid(project, GENESIS, final_genesis, "genesis")
    require_valid(project, GLOSSARY, final_glossary, "glossary")
    (project / STATE / "pending").unlink()
    return outcome(record)


def recover(project):
    decision_id = pending_id(project)
    if decision_id is None:
        return "No hay ninguna decisión interrumpida."
    return complete(project, decision_id)


def decision_problem(project, genesis, block):
    """Compara la decisión de un bloque con su constancia; devuelve el problema o None."""
    decision = node_admin(block.decision)
    status = decision.get("status")
    if status not in ("approved", "rejected"):
        return f"«status: {status}» no es una decisión válida."
    by, reference_key = {"approved": ("approved_by", "approval_reference"),
                         "rejected": ("rejected_by", "rejection_reference")}[status]
    reference = decision.get(reference_key, "")
    decision_id = decision_id_of(reference.split(" ")[-1], block.id)
    try:
        record = load_decision(project, decision_id)
    except DocError as error:
        return str(error)
    if record.get("decision") != status or record.get("reference") != reference \
            or record.get("by") != decision.get(by) or record.get("block") != block.id \
            or record.get("genesis_body") != sha(block_body(genesis, block.id)):
        return f"La constancia {decision_id} no concuerda con Genesis."
    return None


def status_report(project):
    """Devuelve (texto, hay problema)."""
    if not (project / GENESIS).exists():
        return "Sin Genesis.", False
    genesis = (project / GENESIS).read_text(encoding="utf-8")
    if not has_block(genesis):
        return f"{GENESIS} no tiene Decisión Humana y Materialización en todos sus bloques.", True
    decision_id = pending_id(project)
    if decision_id is not None:
        return f"Decisión {decision_id} interrumpida: complétala con csdd_doc.py recover.", True
    found = blocks(genesis)
    for block in found[:-1]:
        problem = decision_problem(project, genesis, block)
        if problem:
            return f"Bloque {block_label(block.id)}: {problem}", True
    block = found[-1]
    problem = prefix_problem(project, genesis, block.id)
    if problem:
        return problem, True
    status = node_admin(block.decision).get("status")
    stage = node_admin(block.materialization).get("stage")
    suffix = f" (revisión {block.id})" if block.id else ""
    if status == "pending":
        if block.id:
            return f"Revisión {block.id} de Genesis en curso, sin decisión.", False
        return "Genesis candidato, sin decisión.", False
    problem = decision_problem(project, genesis, block)
    if problem:
        return f"Aprobación no comprobable. {problem}" if status == "approved" else problem, True
    return f"Genesis {status}, stage {stage}{suffix}.", False


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    project = pathlib.Path(".")
    try:
        if len(args) == 2 and args[0] == "new":
            print(new(project, args[1]))
        elif args == ["revise"]:
            print(revise(project))
        elif args == ["recover"]:
            print(recover(project))
        elif args == ["status"]:
            text, problem = status_report(project)
            print(text)
            return 1 if problem else 0
        else:
            print(__doc__, file=sys.stderr)
            return 2
    except DocError as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
