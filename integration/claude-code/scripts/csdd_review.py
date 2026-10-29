"""Constancia de la revisión semántica de Genesis y Glossary.

record <veredicto>  guarda el veredicto, las huellas y una copia del contenido revisado.
status              indica si el contenido actual es el que recibió el último veredicto.
diff                muestra lo cambiado desde la última revisión registrada.

La constancia vive en .claude/state/review/, fuera de docs/.
"""
import datetime
import difflib
import json
import pathlib
import sys

sys.dont_write_bytecode = True

from csdd_hash import GLOSSARY, genesis_body, sha

STATE = pathlib.Path(".claude/state/review")
VERDICTS = ("conforming", "non_conforming", "insufficient_evidence")


def current():
    return {"genesis_body": genesis_body(), "glossary": GLOSSARY.read_text(encoding="utf-8")}


def load():
    path = STATE / "review.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def record(verdict):
    if verdict not in VERDICTS:
        raise SystemExit(f"Veredicto inválido: {verdict}")
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
        return
    texts = current()
    print(f"verdict: {data['verdict']}\nreviewed_at: {data['reviewed_at']}")
    for name, text in texts.items():
        state = "igual" if sha(text) == data[name] else "cambiado"
        print(f"{name}: {state} ({data[name]})")


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
