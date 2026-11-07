"""Constancia de la revisión semántica de Genesis y Glossary.

record <veredicto>  guarda el veredicto, las huellas y una copia del contenido revisado;
                    no acepta conforming mientras haya secciones obligatorias vacías.
status              indica si el contenido actual es el que recibió el último veredicto
                    y qué secciones del bloque activo están vacías.
diff                muestra lo cambiado desde la última revisión registrada del bloque
                    activo; en una revisión sin veredicto, el glosario desde que se abrió.

El veredicto cubre el bloque activo de Genesis (el cuerpo inicial o la última revisión)
y el Glossary. La constancia vive en .claude/csdd/state/review/, fuera de docs/.
"""
import datetime
import difflib
import json
import pathlib
import sys

sys.dont_write_bytecode = True

import csdd_check
from csdd_hash import GENESIS, GLOSSARY, active_block, genesis_text, sha

STATE = pathlib.Path(".claude/csdd/state/review")
REVISIONS = pathlib.Path(".claude/csdd/state/revisions")
TEMPLATES = pathlib.Path(".csdd/templates")
GENESIS_TEMPLATE = TEMPLATES / csdd_check.TEMPLATES["genesis"]
REVISION_TEMPLATE = TEMPLATES / csdd_check.REVISION_TEMPLATE
VERDICTS = ("conforming", "non_conforming", "insufficient_evidence")


def snapshot_path(block_id):
    """Glosario vigente al abrir una revisión; el rechazo lo restaura."""
    return REVISIONS / f"{block_id}-glossary.md"


def empty_sections(genesis, template_text, revision_text=None):
    """Secciones del bloque activo sin contenido, como (obligatorias, opcionales).

    La plantilla define cuáles son opcionales: su guía empieza con «<Opcional». Una
    revisión se compara con la plantilla de revisión.
    """
    block_id, body = active_block(genesis)
    if block_id is not None:
        if revision_text is None:
            raise ValueError("falta la plantilla de revisión")
        template_text, genesis = revision_text, body
    document = csdd_check.parse(genesis).children
    template = csdd_check.load_template(template_text).children
    if not document or not template:
        return [], []
    expected = template[0].section_children()
    required, optional = [], []
    for child in document[0].children:
        if child.title == "Decisión Humana":
            break
        if child.text_lines() or child.children:
            continue
        found = next((t for t in expected if t.matches(child.title)), None)
        (optional if found is not None and found.optional else required).append(child.title)
    return required, optional


def current_empty_sections(root=pathlib.Path(".")):
    if not (root / GENESIS).exists():
        return [], []
    texts = []
    for path in (GENESIS_TEMPLATE, REVISION_TEMPLATE):
        if not (root / path).exists():
            raise SystemExit(f"No existe {path}: instala CSDD en este proyecto.")
        texts.append((root / path).read_text(encoding="utf-8"))
    return empty_sections(genesis_text(root), *texts)


def empty_report(required, optional):
    lines = []
    if required:
        lines.append("Secciones obligatorias vacías: " + ", ".join(required) + ".")
    if optional:
        lines.append("Secciones opcionales vacías (completarlas o quitarlas): " + ", ".join(optional) + ".")
    return lines


def current():
    """Devuelve (bloque activo, {nombre: texto revisable})."""
    block_id, body = active_block(genesis_text())
    return block_id, {"genesis_body": body, "glossary": GLOSSARY.read_text(encoding="utf-8")}


def block_label(block_id):
    return block_id or "genesis"


def load(root=pathlib.Path(".")):
    path = root / STATE / "review.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def record(verdict):
    if verdict not in VERDICTS:
        raise SystemExit(f"Veredicto inválido: {verdict}")
    required, optional = current_empty_sections()
    if verdict == "conforming" and required:
        raise SystemExit("No se registró el veredicto. " + " ".join(empty_report(required, optional)))
    STATE.mkdir(parents=True, exist_ok=True)
    block_id, texts = current()
    for name, text in texts.items():
        (STATE / f"{name}.md").write_text(text, encoding="utf-8")
    data = {
        "verdict": verdict,
        "block": block_id,
        "reviewed_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        **{name: sha(text) for name, text in texts.items()},
    }
    (STATE / "review.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(data, indent=2))


def status():
    data = load()
    if data is None:
        print("Sin revisión registrada.")
        for line in empty_report(*current_empty_sections()):
            print(line)
        return
    block_id, texts = current()
    if data.get("block") != block_id:
        print(f"Sin revisión registrada del bloque {block_label(block_id)}.")
        for line in empty_report(*current_empty_sections()):
            print(line)
        return
    print(f"block: {block_label(block_id)}\nverdict: {data['verdict']}\nreviewed_at: {data['reviewed_at']}")
    for name, text in texts.items():
        state = "igual" if sha(text) == data[name] else "cambiado"
        print(f"{name}: {state} ({data[name]})")
    for line in empty_report(*current_empty_sections()):
        print(line)


def print_diff(before, after, before_label, after_label):
    sys.stdout.writelines(difflib.unified_diff(
        before.splitlines(keepends=True), after.splitlines(keepends=True),
        fromfile=before_label, tofile=after_label))


def diff():
    data = load()
    block_id, texts = current()
    if data is None or data.get("block") != block_id:
        print(f"Sin revisión registrada del bloque {block_label(block_id)}: revisar el bloque completo.")
        if block_id is not None and snapshot_path(block_id).exists():
            print("Cambios del glosario desde que se abrió la revisión:")
            print_diff(snapshot_path(block_id).read_text(encoding="utf-8"), texts["glossary"],
                       "glossary al abrir", "glossary actual")
        return
    for name, text in texts.items():
        before = (STATE / f"{name}.md").read_text(encoding="utf-8")
        print_diff(before, text, f"{name} revisado", f"{name} actual")


def main():
    args = sys.argv[1:]
    if args[:1] == ["record"] and len(args) == 2:
        record(args[1])
    elif args == ["status"]:
        status()
    elif args == ["diff"]:
        diff()
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main()
