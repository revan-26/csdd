"""Operaciones de código sobre Genesis y Glossary: creación, decisión, cierre y recuperación.

new NOMBRE  crea docs/base/GENESIS.md y docs/glossary.md desde sus plantillas.
status      muestra el estado de Genesis y comprueba la constancia de la decisión.
recover     completa una decisión interrumpida a partir de su constancia.

approve() y reject() no tienen línea de comandos: los invoca el hook que recibe
/csdd-approve o /csdd-reject, porque la decisión debe venir de una intervención humana.

Una decisión primero guarda su constancia en .claude/csdd/state/decisions/ y la señal
.claude/csdd/state/pending, luego escribe los documentos y al final retira la señal.
Las revisiones fundamentales de Genesis todavía no tienen operativa.
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
from csdd_hash import GENESIS, GLOSSARY, body_of, sha
from csdd_review import load as load_review

STATE = pathlib.Path(".claude/csdd/state")
TEMPLATES = pathlib.Path(".csdd/templates")
GENESIS_TITLE = re.compile(r"^Genesis De (.+)$")
DECISION, MATERIALIZATION = "Decisión Humana", "Materialización"


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


# Edición de administración

def set_admin(text, section, values):
    lines = text.split("\n")
    for number, line in document(text).child(section).body:
        match = csdd_check.ADMIN_LINE.match(line.strip())
        if match and match.group(1) in values:
            lines[number - 1] = f"{match.group(1)}: {values[match.group(1)]}"
    return "\n".join(lines)


def fill_section(text, parent, section, content):
    lines = text.split("\n")
    node = document(text).child(parent).child(section)
    lines[node.line:node.end - 1] = ["", content, ""]
    return "\n".join(lines)


def add_decision_note(text, content):
    lines = text.split("\n")
    at = document(text).child(MATERIALIZATION).line - 1
    lines[at:at] = ["### Notas De La Decisión", "", content, ""]
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


def restored_glossary(project, genesis):
    name = GENESIS_TITLE.match(document(genesis).title).group(1)
    return csdd_check.skeleton(template(project, csdd_check.TEMPLATES["glossary"]), name)


# Estado

def read_documents(project):
    for path in (GENESIS, GLOSSARY):
        if not (project / path).exists():
            raise DocError(f"No existe {path}.")
    return ((project / GENESIS).read_text(encoding="utf-8"),
            (project / GLOSSARY).read_text(encoding="utf-8"))


def admin_values(text, section):
    node = document(text).child(section)
    found = (csdd_check.ADMIN_LINE.match(line.strip()) for _, line in node.body)
    return {m.group(1): m.group(2).strip() for m in found if m}


def has_block(genesis):
    title = document(genesis)
    return (title is not None and title.child(DECISION) is not None
            and title.child(MATERIALIZATION) is not None and "\n## Decisión Humana" in genesis)


def require_open_block(project, genesis):
    title = document(genesis)
    if not has_block(genesis):
        raise DocError(f"{GENESIS} no tiene Decisión Humana y Materialización.")
    revision = csdd_check.load_template(template(project, csdd_check.REVISION_TEMPLATE))
    if any(revision.children[0].matches(child.title) for child in title.children):
        raise DocError("Las revisiones fundamentales de Genesis todavía no tienen operativa.")
    if pending_id(project) is not None:
        raise DocError("Hay una decisión interrumpida: complétala con csdd_doc.py recover.")
    status = admin_values(genesis, DECISION).get("status")
    if status != "pending":
        raise DocError(f"Genesis ya tiene una decisión registrada (status: {status}).")


def empty_sections(genesis):
    title = document(genesis)
    sections = []
    for child in title.children:
        if child.title == DECISION:
            break
        if not child.text_lines() and not child.children:
            sections.append(child.title)
    return sections


def pending_id(project):
    path = project / STATE / "pending"
    return path.read_text(encoding="utf-8").strip() if path.exists() else None


def decision_path(project, decision_id):
    return project / STATE / "decisions" / f"{decision_id}.json"


def load_decision(project, decision_id):
    try:
        return json.loads(decision_path(project, decision_id).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise DocError(f"La constancia {decision_id} falta o está corrupta: no se puede completar.")


# Decisión y cierre

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def approve(project, name, session_id=None, prompt_id=None):
    name = one_line(name)
    if not name:
        raise DocError("Indica tu nombre: /csdd-approve <nombre>.")
    genesis, glossary = read_documents(project)
    require_open_block(project, genesis)
    require_valid(project, GENESIS, genesis, "genesis")
    require_valid(project, GLOSSARY, glossary, "glossary")
    empty = empty_sections(genesis)
    if empty:
        raise DocError("Genesis tiene secciones vacías: " + ", ".join(empty) + ".")
    review = load_review(project)
    if review is None:
        raise DocError("No hay revisión registrada: encarga la revisión antes de aprobar.")
    if review.get("verdict") != "conforming":
        raise DocError(f"El último veredicto de la revisión es {review.get('verdict')}.")
    if review.get("genesis_body") != sha(body_of(genesis)) or review.get("glossary") != sha(glossary):
        raise DocError("El contenido cambió después de la revisión: revisa el cambio antes de aprobar.")
    strengths = collections.Counter(term[2] for term in glossary_terms(glossary))
    at = utc_now()
    record = {
        "decision": "approved", "by": name, "at": at,
        "reference": f"csdd-approve {at}",
        "session_id": session_id, "prompt_id": prompt_id,
        "genesis_body": sha(body_of(genesis)),
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
        raise DocError("Indica nombre y motivo: /csdd-reject <nombre>: <motivo>.")
    genesis, glossary = read_documents(project)
    require_open_block(project, genesis)
    require_valid(project, GENESIS, genesis, "genesis")
    if any(strength == "acordado" for _, _, strength, _ in glossary_terms(glossary)):
        raise DocError("El glosario tiene términos acordados: no se puede restaurar sin consultar.")
    at = utc_now()
    record = {
        "decision": "rejected", "by": name, "at": at,
        "reference": f"csdd-reject {at}", "reason": reason,
        "session_id": session_id, "prompt_id": prompt_id,
        "genesis_body": sha(body_of(genesis)),
        "glossary_before": sha(glossary),
        "glossary_after": sha(restored_glossary(project, genesis)),
    }
    return persist(project, record, genesis, glossary)


def decided_glossary(project, record, genesis, glossary):
    if record["decision"] == "approved":
        return promote_terms(glossary)
    return restored_glossary(project, genesis)


def decided_genesis(record, genesis):
    if record["decision"] == "rejected":
        text = set_admin(genesis, DECISION, {
            "status": "rejected", "rejected_by": record["by"], "rejected_at": record["at"],
            "rejection_reference": record["reference"]})
        text = add_decision_note(text, f"Motivo: {record['reason']}")
        return set_admin(text, MATERIALIZATION, {"disposition": "abandoned"})
    text = set_admin(genesis, DECISION, {
        "status": "approved", "approved_by": record["by"], "approved_at": record["at"],
        "approved_content_reference": record["genesis_body"], "approval_reference": record["reference"]})
    text = set_admin(text, MATERIALIZATION, {
        "stage": "closed", "genesis_reference": record["genesis_body"],
        "glossary_reference": record["glossary_after"], "review_reference": record["review_reference"],
        "review_verdict": "conforming"})
    terms = record["terms"]
    text = fill_section(text, MATERIALIZATION, "Verificación", "\n".join([
        "- Estructura de Genesis y Glossary comprobada contra sus plantillas, sin errores.",
        "- El cuerpo y el glosario candidato coinciden con las huellas del veredicto conforme.",
        f"- Glossary: términos que pasan a acordado, {terms['acordado']}; "
        f"supuestos sin cambio, {terms['supuesto']}; diferidos sin cambio, {terms['diferido']}."]))
    return fill_section(text, MATERIALIZATION, "Limitaciones", "\n".join([
        "- El nombre es el declarado en el comando; no autentica a la persona.",
        "- Las constancias de revisión y decisión no resisten manipulación local.",
        "- Estas comprobaciones son estructurales; la fidelidad proviene de la revisión semántica."]))


def persist(project, record, genesis, glossary):
    """Comprueba el resultado en memoria y solo entonces guarda la constancia y lo escribe."""
    final_glossary = decided_glossary(project, record, genesis, glossary)
    require_valid(project, GLOSSARY, final_glossary, "glossary")
    require_valid(project, GENESIS, decided_genesis(record, genesis), "genesis")
    decision_id = record["at"].replace(":", "")
    write_atomic(decision_path(project, decision_id), json.dumps(record, indent=2, ensure_ascii=False) + "\n")
    write_atomic(project / STATE / "pending", decision_id + "\n")
    return complete(project, decision_id)


def complete(project, decision_id):
    """Escribe lo que falte de una decisión. Es repetible tras una interrupción."""
    record = load_decision(project, decision_id)
    genesis, glossary = read_documents(project)
    if not has_block(genesis) or sha(body_of(genesis)) != record["genesis_body"]:
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
    status = admin_values(genesis, DECISION).get("status")
    if status == "pending":
        genesis = decided_genesis(record, genesis)
        write_atomic(project / GENESIS, genesis)
    elif status != record["decision"]:
        raise DocError("La Decisión Humana difiere de la constancia: inspecciona antes de continuar.")
    final_genesis, final_glossary = read_documents(project)
    require_valid(project, GENESIS, final_genesis, "genesis")
    require_valid(project, GLOSSARY, final_glossary, "glossary")
    (project / STATE / "pending").unlink()
    if record["decision"] == "approved":
        return f"Genesis aprobado por {record['by']} y cerrado ({record['reference']})."
    return f"Genesis rechazado por {record['by']} y abandonado ({record['reference']}). Glossary restaurado."


def recover(project):
    decision_id = pending_id(project)
    if decision_id is None:
        return "No hay ninguna decisión interrumpida."
    return complete(project, decision_id)


def decision_problem(project, genesis):
    """Compara una decisión registrada con su constancia; devuelve el problema o None."""
    decision = admin_values(genesis, DECISION)
    status = decision.get("status")
    if status not in ("approved", "rejected"):
        return f"«status: {status}» no es una decisión válida."
    by, reference_key = {"approved": ("approved_by", "approval_reference"),
                         "rejected": ("rejected_by", "rejection_reference")}[status]
    reference = decision.get(reference_key, "")
    decision_id = reference.split(" ")[-1].replace(":", "")
    try:
        record = load_decision(project, decision_id)
    except DocError as error:
        return str(error)
    if record.get("decision") != status or record.get("reference") != reference \
            or record.get("by") != decision.get(by) \
            or record.get("genesis_body") != sha(body_of(genesis)):
        return f"La constancia {decision_id} no concuerda con Genesis."
    return None


def status_report(project):
    """Devuelve (texto, hay problema)."""
    if not (project / GENESIS).exists():
        return "Sin Genesis.", False
    genesis = (project / GENESIS).read_text(encoding="utf-8")
    if not has_block(genesis):
        return f"{GENESIS} no tiene Decisión Humana y Materialización.", True
    decision_id = pending_id(project)
    if decision_id is not None:
        return f"Decisión {decision_id} interrumpida: complétala con csdd_doc.py recover.", True
    status = admin_values(genesis, DECISION).get("status")
    stage = admin_values(genesis, MATERIALIZATION).get("stage")
    if status == "pending":
        return "Genesis candidato, sin decisión.", False
    problem = decision_problem(project, genesis)
    if problem:
        return f"Aprobación no comprobable. {problem}" if status == "approved" else problem, True
    return f"Genesis {status}, stage {stage}.", False


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    project = pathlib.Path(".")
    try:
        if len(args) == 2 and args[0] == "new":
            print(new(project, args[1]))
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
