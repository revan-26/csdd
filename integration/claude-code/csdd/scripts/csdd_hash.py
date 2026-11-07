"""Huellas sha256 del bloque activo de Genesis y del Glossary.

El cuerpo inicial comprende el título y las secciones anteriores a «## Decisión Humana».
Una revisión comprende su bloque «## Revisión De GENESIS: <id>» hasta su «### Decisión
Humana». El bloque activo es la última revisión o, si no hay, el cuerpo inicial.
"""
import hashlib
import pathlib
import re

GENESIS = pathlib.Path("docs/base/GENESIS.md")
GLOSSARY = pathlib.Path("docs/glossary.md")
REVISION_HEADING = re.compile(r"^## Revisión De GENESIS: (\S+)[ \t]*$", re.MULTILINE)


def sha(text):
    return "sha256:" + hashlib.sha256(text.encode("utf-8")).hexdigest()


def body_of(genesis):
    body, marker, _ = genesis.partition("\n## Decisión Humana")
    if not marker:
        raise SystemExit("GENESIS.md no tiene la sección Decisión Humana")
    return body


def revision_ids(genesis):
    return REVISION_HEADING.findall(genesis)


def revision_start(genesis, block_id):
    """Posición donde empieza el encabezado de la revisión, o None si no existe."""
    for match in REVISION_HEADING.finditer(genesis):
        if match.group(1) == block_id:
            return match.start()
    return None


def block_body(genesis, block_id=None):
    """Contenido aprobable de un bloque: el cuerpo inicial (None) o una revisión."""
    if block_id is None:
        return body_of(genesis)
    start = revision_start(genesis, block_id)
    if start is None:
        raise SystemExit(f"GENESIS.md no tiene la revisión {block_id}")
    body, marker, _ = genesis[start:].partition("\n### Decisión Humana")
    if not marker:
        raise SystemExit(f"La revisión {block_id} no tiene Decisión Humana")
    return body


def active_block(genesis):
    """Devuelve (id del bloque activo o None, su contenido aprobable)."""
    ids = revision_ids(genesis)
    block_id = ids[-1] if ids else None
    return block_id, block_body(genesis, block_id)


def prefix_of(genesis, block_id):
    """Texto anterior a una revisión: lo que la revisión no puede cambiar."""
    start = revision_start(genesis, block_id)
    if start is None:
        raise SystemExit(f"GENESIS.md no tiene la revisión {block_id}")
    return genesis[:start]


def genesis_text(root=pathlib.Path(".")):
    return (root / GENESIS).read_text(encoding="utf-8")


def genesis_body(root=pathlib.Path(".")):
    return active_block(genesis_text(root))[1]


def main():
    block_id, body = active_block(genesis_text())
    print("block:", block_id or "genesis")
    print("genesis_body:", sha(body))
    print("glossary:", sha(GLOSSARY.read_text(encoding="utf-8")))


if __name__ == "__main__":
    main()
