"""Huellas sha256 del cuerpo de Genesis y del Glossary.

El cuerpo comprende el título y las secciones anteriores a «## Decisión Humana».
"""
import hashlib
import pathlib

GENESIS = pathlib.Path("docs/base/GENESIS.md")
GLOSSARY = pathlib.Path("docs/glossary.md")


def sha(text):
    return "sha256:" + hashlib.sha256(text.encode("utf-8")).hexdigest()


def genesis_body():
    genesis = GENESIS.read_text(encoding="utf-8")
    body, marker, _ = genesis.partition("\n## Decisión Humana")
    if not marker:
        raise SystemExit("GENESIS.md no tiene la sección Decisión Humana")
    return body


def main():
    print("genesis_body:", sha(genesis_body()))
    print("glossary:", sha(GLOSSARY.read_text(encoding="utf-8")))


if __name__ == "__main__":
    main()
