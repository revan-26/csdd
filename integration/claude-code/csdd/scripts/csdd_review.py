"""Constancia de la revisión semántica de Genesis y Glossary.

record <veredicto>  guarda el veredicto, las huellas y una copia del contenido revisado;
                    no acepta conforming mientras haya secciones obligatorias vacías.
status              indica si el contenido actual es el que recibió el último veredicto
                    y qué secciones de Genesis están vacías.
diff                muestra lo cambiado desde la última revisión registrada.

La constancia vive en .claude/csdd/state/review/, fuera de docs/.
"""
import datetime
import difflib
import json
import pathlib
import sys

sys.dont_write_bytecode = True

import csdd_check
from csdd_hash import GENESIS, GLOSSARY, genesis_body, sha

STATE = pathlib.Path(".claude/csdd/state/review")
GENESIS_TEMPLATE = pathlib.Path(".csdd/templates") / csdd_check.TEMPLATES["genesis"]
VERDICTS = ("conforming", "non_conforming", "insufficient_evidence")


def empty_sections(genesis, template_text):
    """Secciones del cuerpo de Genesis sin contenido, como (obligatorias, opcionales).

    La plantilla define cuáles son opcionales: su guía empieza con «<Opcional».
    """
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
    if not (root / GENESIS_TEMPLATE).exists():
        raise SystemExit(f"No existe {GENESIS_TEMPLATE}: instala CSDD en este proyecto.")
    genesis = (root / GENESIS).read_text(encoding="utf-8")
    return empty_sections(genesis, (root / GENESIS_TEMPLATE).read_text(encoding="utf-8"))


def empty_report(required, optional):
    lines = []
    if required:
        lines.append("Secciones obligatorias vacías: " + ", ".join(required) + ".")
    if optional:
        lines.append("Secciones opcionales vacías (completarlas o quitarlas): " + ", ".join(optional) + ".")
    return lines


def current():
    return {"genesis_body": genesis_body(), "glossary": GLOSSARY.read_text(encoding="utf-8")}


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
    texts = current()
    for name, text in texts.items():
        (STATE / f"{name}.md").write_text(text, encoding="utf-8")
    data = {
        "verdict": verdict,
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
    texts = current()
    print(f"verdict: {data['verdict']}\nreviewed_at: {data['reviewed_at']}")
    for name, text in texts.items():
        state = "igual" if sha(text) == data[name] else "cambiado"
        print(f"{name}: {state} ({data[name]})")
    for line in empty_report(*current_empty_sections()):
        print(line)


def diff():
    if load() is None:
        print("Sin revisión registrada: revisar el contenido completo.")
        return
    for name, text in current().items():
        before = (STATE / f"{name}.md").read_text(encoding="utf-8")
        lines = difflib.unified_diff(
            before.splitlines(keepends=True), text.splitlines(keepends=True),
            fromfile=f"{name} revisado", tofile=f"{name} actual")
        sys.stdout.writelines(lines)


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
