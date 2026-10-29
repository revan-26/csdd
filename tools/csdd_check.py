"""Verificador de esqueletos de los documentos CSDD.

Comprueba cada documento contra su plantilla de .csdd/templates/: título, secciones
obligatorias y su orden, ausencia de guía sin quitar y, en Genesis, Glossary, Backlog
y la sección First Release de Specs, las líneas administrativas y las entradas según
templates/README.md. No juzga significado.

Uso:
    python3 csdd_check.py [--templates DIR] [--type TIPO] RUTA...

RUTA puede ser una carpeta docs/ o un archivo. Con --type se fuerza el tipo de un
archivo cuya ruta no lo indica. Sale con 0 si no hay errores, 1 si los hay y 2 ante
un error de uso.
"""
import argparse
import pathlib
import re
import sys

HEADING = re.compile(r"^(#{1,6}) (.+?)\s*$")
PLACEHOLDER = re.compile(r"<[^<>]+>")
GUIDANCE = re.compile(r"^<[^<>]+>$")
ADMIN_LINE = re.compile(r"^([a-z_]+):(.*)$")
FIELD_LINE = re.compile(r"^- ([^:]+): ?(.*)$")
SHA256 = re.compile(r"^sha256:[0-9a-f]{64}$")
UTC_TIME = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
GLOSSARY_ENTRY = re.compile(r"^\[(G-\d{3}) · (\S+) · (.+)\]$")
BACKLOG_ITEM = re.compile(r"^\[(B-\d{3}) · (\S+)(?: · (\S+))?\]$")
BACKLOG_CLOSED = re.compile(r"^\[(B-\d{3}) · (\S+)\]$")
BACKLOG_ID = re.compile(r"B-\d{3}")
FREE_LEVEL = 4

# Tipo de documento -> plantilla. Las rutas son relativas a docs/.
TEMPLATES = {
    "genesis": "genesis.template.md",
    "glossary": "glossary.template.md",
    "backlog": "backlog.template.md",
    "specs": "specs.template.md",
    "ontology": "ontology.template.md",
    "topology": "topology.template.md",
    "architecture": "architecture.template.md",
    "adr": "adr.template.md",
    "domain": "domain.template.md",
    "contract": "contract.template.md",
    "mapping": "mapping.template.md",
}
PATHS = [
    ("genesis", "base/GENESIS.md"),
    ("ontology", "base/ONTOLOGY.md"),
    ("topology", "base/TOPOLOGY.md"),
    ("glossary", "glossary.md"),
    ("backlog", "backlog.md"),
    ("specs", "specs.md"),
    ("architecture", "architecture.md"),
    ("adr", "adrs/*.md"),
    ("domain", "domains/*.md"),
    ("contract", "contracts/*/contract.md"),
    ("mapping", "mapping/*.md"),
]
REVISION_TEMPLATE = "genesis-revision.template.md"


class Node:
    """Sección de un documento Markdown: título, cuerpo propio e hijas."""

    def __init__(self, level, title, line):
        self.level = level
        self.title = title
        self.line = line
        self.body = []  # (número de línea, texto) anteriores a la primera hija
        self.children = []
        self.end = None  # línea siguiente a la última de la sección

    def text_lines(self):
        return [(n, t) for n, t in self.body if t.strip()]

    def child(self, title):
        return next((c for c in self.children if c.title == title), None)


def parse(text):
    """Devuelve la raíz (nivel 0) con las secciones del documento anidadas."""
    lines = text.split("\n")
    root = Node(0, "", 0)
    stack = [root]
    fenced = False
    for number, line in enumerate(lines, 1):
        if line.startswith("```"):
            fenced = not fenced
        match = None if fenced else HEADING.match(line)
        if match:
            level = len(match.group(1))
            while stack[-1].level >= level:
                stack.pop().end = number
            node = Node(level, match.group(2), number)
            stack[-1].children.append(node)
            stack.append(node)
        else:
            stack[-1].body.append((number, line))
    for node in stack:
        node.end = len(lines) + 1
    return root


def walk(node):
    yield node
    for child in node.children:
        yield from walk(child)


class Template:
    """Sección de plantilla con lo que exige a su instancia."""

    def __init__(self, node):
        self.node = node
        self.title = node.title
        self.level = node.level
        self.entry = bool(GUIDANCE.match(node.title))
        lines = [t.strip() for _, t in node.text_lines()]
        self.optional = bool(lines) and lines[0].startswith("<Opcional")
        self.admin_keys = [m.group(1) for t in lines if (m := ADMIN_LINE.match(t))]
        self.fields = [m.group(1) for t in lines if (m := FIELD_LINE.match(t))]
        self.children = [Template(c) for c in node.children]
        pattern = re.escape(node.title).replace("NNN", r"\d{3}")
        pattern = PLACEHOLDER.sub(".+", pattern.replace(r"\<", "<").replace(r"\>", ">"))
        self.pattern = re.compile(f"^{pattern}$")

    def matches(self, title):
        return bool(self.pattern.match(title))

    def section_children(self):
        return [c for c in self.children if not c.entry]

    def entry_child(self):
        return next((c for c in self.children if c.entry), None)


def load_template(text):
    return Template(parse(text))


def guidance_lines(text):
    return {t.strip() for t in text.split("\n") if GUIDANCE.match(t.strip())}


def skeleton(template_text, project_name):
    """Crea el esqueleto de un documento: sin guía, sin opcionales ni entradas de ejemplo."""
    root = parse(template_text)
    lines = template_text.split("\n")
    drop = set()
    for node in walk(root):
        if node.level == 0:
            continue
        info = Template(node)
        if info.optional or info.entry:
            drop.update(range(node.line, node.end))
    out = []
    for number, line in enumerate(lines, 1):
        if number in drop or GUIDANCE.match(line.strip()):
            continue
        if number == 1 and line.startswith("# "):
            line = PLACEHOLDER.sub(project_name, line, count=1)
        if not line.strip() and out and not out[-1].strip():
            continue
        out.append(line)
    return "\n".join(out).rstrip("\n") + "\n"


class Checker:
    def __init__(self, path, text, template_text, revision_text=None, first_release=False,
                 conventions=True):
        self.path = path
        self.conventions = conventions
        self.errors = []
        self.root = parse(text)
        self.template = load_template(template_text)
        self.guidance = guidance_lines(template_text)
        self.revision = load_template(revision_text) if revision_text else None
        if revision_text:
            self.guidance |= guidance_lines(revision_text)
        self.first_release = first_release

    def error(self, line, message):
        self.errors.append((self.path, line, message))

    # Estructura

    def check_structure(self, sections=None):
        root = self.root
        if any(t.strip() for _, t in root.body):
            line = next(n for n, t in root.body if t.strip())
            self.error(line, "contenido antes del título")
        titles = [c for c in root.children if c.level == 1]
        expected = self.template.children[0]
        if len(titles) != 1 or root.children[0] is not titles[0]:
            self.error(1, "el documento debe tener un único título de nivel 1 al inicio")
            return
        title = titles[0]
        if not expected.matches(title.title):
            self.error(title.line, f"título «{title.title}» no sigue «{expected.title}»")
        if title.text_lines() and not expected.node.text_lines():
            self.error(title.text_lines()[0][0], "contenido fuera de las secciones")
        self.match_children(title, expected, sections if sections is not None else title.children)
        self.check_guidance()

    def match_children(self, parent, template, children):
        expected = template.section_children()
        entry = template.entry_child()
        position = 0
        for child in children:
            if child.level >= FREE_LEVEL:
                continue
            found = next((j for j in range(position, len(expected))
                          if expected[j].matches(child.title)), None)
            if found is not None:
                for skipped in expected[position:found]:
                    if not skipped.optional:
                        self.error(child.line, f"falta la sección «{skipped.title}» antes de «{child.title}»")
                position = found + 1
                self.match_children(child, expected[found], child.children)
            elif entry is not None and child.level == entry.level:
                self.match_children(child, entry, child.children)
            elif any(t.matches(child.title) for t in expected):
                self.error(child.line, f"sección «{child.title}» repetida o fuera de orden")
            else:
                self.error(child.line, f"sección no prevista «{child.title}»")
        end = parent.end - 1 if parent.end else 1
        for missing in expected[position:]:
            if not missing.optional:
                self.error(end, f"falta la sección «{missing.title}»")

    def check_guidance(self):
        for node in walk(self.root):
            for number, line in node.body:
                text = line.strip()
                if text in self.guidance:
                    self.error(number, f"guía de la plantilla sin quitar: {text}")
                field = FIELD_LINE.match(text) if self.conventions else None
                if field and GUIDANCE.match(field.group(2).strip()):
                    self.error(number, f"campo «{field.group(1)}» con el valor de guía {field.group(2).strip()}")

    # Administración

    def admin(self, node, keys):
        """Lee las líneas clave: valor de la sección y comprueba claves exactas y su orden."""
        found = []
        values = {}
        for number, line in node.body:
            match = ADMIN_LINE.match(line.strip())
            if match:
                key, value = match.group(1), match.group(2).strip()
                found.append(key)
                if key in values:
                    self.error(number, f"clave administrativa «{key}» repetida")
                values[key] = (value, number)
        for key in found:
            if key not in keys:
                self.error(values[key][1], f"clave administrativa no prevista «{key}»")
        missing = [k for k in keys if k not in values]
        for key in missing:
            self.error(node.line, f"falta la clave administrativa «{key}» en «{node.title}»")
        present = [k for k in found if k in keys]
        if not missing and present != keys:
            self.error(node.line, f"claves administrativas de «{node.title}» fuera de orden")
        return {k: v for k, (v, _) in values.items()}, {k: n for k, (_, n) in values.items()}

    def require(self, values, lines, node, key, kind, condition):
        value = values.get(key, "")
        line = lines.get(key, node.line)
        if not value:
            self.error(line, f"«{key}» es obligatorio cuando {condition}")
        elif kind == "sha256" and not SHA256.match(value):
            self.error(line, f"«{key}» debe tener la forma sha256:<64 caracteres hexadecimales>")
        elif kind == "utc" and not UTC_TIME.match(value):
            self.error(line, f"«{key}» debe ser una fecha UTC AAAA-MM-DDTHH:MM:SSZ")

    def forbid(self, values, lines, keys, condition):
        for key in keys:
            if values.get(key):
                self.error(lines[key], f"«{key}» debe estar vacío cuando {condition}")

    def enum(self, values, lines, node, key, allowed, empty=False):
        value = values.get(key, "")
        if value in allowed or (empty and not value):
            return True
        options = ", ".join(allowed)
        self.error(lines.get(key, node.line), f"«{key}» admite {options}; tiene «{value}»")
        return False


GENESIS_DECISION = ["status", "approved_by", "approved_at", "approved_content_reference",
                    "approval_reference", "rejected_by", "rejected_at", "rejection_reference"]
GENESIS_MATERIALIZATION = ["stage", "disposition", "genesis_reference", "glossary_reference",
                           "review_reference", "review_verdict"]
APPROVAL = [("approved_by", "text"), ("approved_at", "utc"),
            ("approved_content_reference", "sha256"), ("approval_reference", "text")]
REJECTION = [("rejected_by", "text"), ("rejected_at", "utc"), ("rejection_reference", "text")]
VERDICTS = ["conforming", "non_conforming", "insufficient_evidence"]


def check_genesis(checker):
    title = checker.root.children[0] if checker.root.children else None
    main, revisions = [], []
    if title is not None and checker.revision is not None:
        revision_root = checker.revision.children[0]
        for child in title.children:
            (revisions if revision_root.matches(child.title) else main).append(child)
        last_main = max((c.line for c in main), default=0)
        for block in revisions:
            if block.line < last_main:
                checker.error(block.line, "una revisión de Genesis va después de las secciones de Genesis")
    checker.check_structure(sections=main if title is not None else None)
    if title is None:
        return
    blocks = []
    decision, materialization = title.child("Decisión Humana"), title.child("Materialización")
    if decision and materialization:
        blocks.append(check_decision_block(checker, decision, materialization))
    for block in revisions:
        checker.match_children(block, checker.revision.children[0], block.children)
        decision, materialization = block.child("Decisión Humana"), block.child("Materialización")
        if not (decision and materialization):
            continue
        previous = blocks[-1] if blocks else None
        if previous is not None and not (previous == "closed" or previous == "abandoned"):
            checker.error(block.line, "una revisión exige que el bloque anterior esté cerrado o rechazado y abandonado")
        blocks.append(check_decision_block(checker, decision, materialization))


def check_decision_block(checker, decision, materialization):
    """Comprueba Decisión Humana y Materialización; devuelve el estado del bloque."""
    d, dl = checker.admin(decision, GENESIS_DECISION)
    m, ml = checker.admin(materialization, GENESIS_MATERIALIZATION)
    status = d.get("status", "")
    if checker.enum(d, dl, decision, "status", ["pending", "approved", "rejected"]):
        approval_keys = [k for k, _ in APPROVAL]
        rejection_keys = [k for k, _ in REJECTION]
        if status == "approved":
            for key, kind in APPROVAL:
                checker.require(d, dl, decision, key, kind, "status es approved")
            checker.forbid(d, dl, rejection_keys, "status es approved")
        elif status == "rejected":
            for key, kind in REJECTION:
                checker.require(d, dl, decision, key, kind, "status es rejected")
            checker.forbid(d, dl, approval_keys, "status es rejected")
        else:
            checker.forbid(d, dl, approval_keys + rejection_keys, "status es pending")
    stage_ok = checker.enum(m, ml, materialization, "stage", ["pending", "closed"])
    checker.enum(m, ml, materialization, "disposition", ["abandoned"], empty=True)
    checker.enum(m, ml, materialization, "review_verdict", VERDICTS, empty=True)
    for key in ("genesis_reference", "glossary_reference"):
        if m.get(key) and not SHA256.match(m[key]):
            checker.error(ml[key], f"«{key}» debe tener la forma sha256:<64 caracteres hexadecimales>")
    stage = m.get("stage", "")
    if m.get("disposition") == "abandoned" and status != "rejected":
        checker.error(ml["disposition"], "«disposition: abandoned» exige status rejected")
    if stage_ok and stage == "closed":
        condition = "stage es closed"
        if status != "approved":
            checker.error(ml["stage"], "«stage: closed» exige status approved")
        checker.require(m, ml, materialization, "genesis_reference", "sha256", condition)
        checker.require(m, ml, materialization, "glossary_reference", "sha256", condition)
        checker.require(m, ml, materialization, "review_reference", "text", condition)
        if m.get("review_verdict") != "conforming":
            checker.error(ml.get("review_verdict", materialization.line), "«stage: closed» exige review_verdict conforming")
        checker.forbid(m, ml, ["disposition"], condition)
        approved = d.get("approved_content_reference")
        if approved and m.get("genesis_reference") and approved != m["genesis_reference"]:
            checker.error(ml["genesis_reference"], "«genesis_reference» difiere de «approved_content_reference»")
        for name in ("Verificación", "Limitaciones"):
            section = materialization.child(name)
            if section is None or not section.text_lines():
                checker.error(materialization.line, f"«stage: closed» exige contenido en «{name}»")
        return "closed"
    if m.get("disposition") == "abandoned":
        return "abandoned"
    return stage


# Entradas de Glosario y Backlog

def entry_parts(checker, entry, allowed, known):
    """Separa la línea administrativa, el texto y los campos de una entrada.

    allowed son los campos de su plantilla; known, los de todas las entradas del
    documento, para señalar un campo de otra sección.
    """
    lines = entry.text_lines()
    if not lines:
        checker.error(entry.line, f"la entrada «{entry.title}» no tiene línea administrativa")
        return None, [], {}
    admin_line, rest = lines[0], lines[1:]
    text, fields = [], {}
    for number, line in rest:
        match = FIELD_LINE.match(line.strip())
        if match and match.group(1) in known:
            key = match.group(1)
            if key not in allowed:
                checker.error(number, f"campo «{key}» no admitido en «{entry.title}»")
            elif key in fields:
                checker.error(number, f"campo «{key}» repetido en «{entry.title}»")
            else:
                fields[key] = (match.group(2).strip(), number)
        else:
            text.append((number, line))
    if not text:
        checker.error(admin_line[0], f"la entrada «{entry.title}» no tiene texto")
    return admin_line, text, fields


def entry_templates(checker, names):
    document = checker.template.children[0]
    found = {t.title: t.entry_child() for t in document.children if t.title in names}
    return found, {f for t in found.values() if t for f in t.fields}


def check_glossary(checker):
    checker.check_structure()
    title = checker.root.children[0] if checker.root.children else None
    if title is None:
        return
    templates, known = entry_templates(checker, ("Términos", "Términos Deprecados"))
    seen_ids, replacements = {}, []
    for section_name, deprecated in (("Términos", False), ("Términos Deprecados", True)):
        section = title.child(section_name)
        if section is None or templates.get(section_name) is None:
            continue
        allowed = templates[section_name].fields
        seen_titles = {}
        for entry in (c for c in section.children if c.level == 3):
            admin_line, _, fields = entry_parts(checker, entry, allowed, known)
            if admin_line is None:
                continue
            number, line = admin_line
            match = GLOSSARY_ENTRY.match(line.strip())
            if not match:
                checker.error(number, f"línea administrativa de «{entry.title}» no sigue [G-NNN · fuerza · categoría]")
                continue
            entry_id, strength, _ = match.groups()
            if strength not in ("acordado", "propuesto", "supuesto", "diferido"):
                checker.error(number, f"fuerza «{strength}» no admitida en «{entry.title}»")
            if entry_id in seen_ids:
                checker.error(number, f"ID {entry_id} repetido (línea {seen_ids[entry_id]})")
            seen_ids[entry_id] = number
            key = entry.title.casefold()
            if key in seen_titles:
                checker.error(entry.line, f"término «{entry.title}» repetido (línea {seen_titles[key]})")
            seen_titles[key] = entry.line
            if deprecated:
                for field in ("Reemplazado por", "Motivo"):
                    if not fields.get(field, ("",))[0]:
                        checker.error(entry.line, f"el término deprecado «{entry.title}» exige «{field}»")
                if fields.get("Reemplazado por"):
                    replacements.append(fields["Reemplazado por"])
    for value, number in replacements:
        if value and value != "ninguno" and value not in seen_ids:
            checker.error(number, f"«Reemplazado por» debe ser un ID existente o «ninguno»; tiene «{value}»")


def check_backlog(checker):
    checker.check_structure()
    title = checker.root.children[0] if checker.root.children else None
    if title is None:
        return
    templates, known = entry_templates(checker, ("Ítems", "Cerrados Y Descartados"))
    seen, dependencies = {}, []
    sections = (("Ítems", BACKLOG_ITEM, ("propuesto", "aceptado", "autorizado", "diferido")),
                ("Cerrados Y Descartados", BACKLOG_CLOSED, ("cerrado", "descartado")))
    for section_name, pattern, states in sections:
        section = title.child(section_name)
        if section is None or templates.get(section_name) is None:
            continue
        allowed = templates[section_name].fields
        for entry in (c for c in section.children if c.level == 3):
            admin_line, _, fields = entry_parts(checker, entry, allowed, known)
            if admin_line is None:
                continue
            number, line = admin_line
            match = pattern.match(line.strip())
            if not match:
                shape = "[B-NNN · estado · horizonte]" if pattern is BACKLOG_ITEM else "[B-NNN · estado]"
                checker.error(number, f"línea administrativa de «{entry.title}» no sigue {shape}")
                continue
            item_id, state = match.group(1), match.group(2)
            if item_id in seen:
                checker.error(number, f"ID {item_id} repetido (línea {seen[item_id]})")
            seen[item_id] = number
            if state not in states:
                place = "Cerrados Y Descartados" if state in ("cerrado", "descartado") else "Ítems"
                if state in ("cerrado", "descartado", "propuesto", "aceptado", "autorizado", "diferido"):
                    checker.error(number, f"un ítem «{state}» va en «{place}»")
                else:
                    checker.error(number, f"estado «{state}» no admitido en «{entry.title}»")
            if pattern is BACKLOG_ITEM:
                horizon = match.group(3)
                if horizon and horizon not in ("fr", "posterior"):
                    checker.error(number, f"horizonte «{horizon}» no admitido; admite fr o posterior")
                if not horizon and not checker.first_release:
                    checker.error(number, f"«{entry.title}» exige horizonte antes de First Release")
            required = {"Ítems": ["Fuentes"] + (["Razón"] if state == "diferido" else []),
                        "Cerrados Y Descartados": (["Cierre"] if state == "cerrado" else [])
                        + (["Razón"] if state == "descartado" else [])}[section_name]
            for field in required:
                if not fields.get(field, ("",))[0]:
                    checker.error(entry.line, f"«{entry.title}» exige «{field}»")
            if "Depende de" in fields:
                dependencies.append(fields["Depende de"])
    for value, number in dependencies:
        for item_id in BACKLOG_ID.findall(value):
            if item_id not in seen:
                checker.error(number, f"«Depende de» cita {item_id}, que no existe")


def check_specs(checker):
    checker.check_structure()
    title = checker.root.children[0] if checker.root.children else None
    section = title.child("First Release") if title else None
    if section is None:
        return
    values, lines = checker.admin(section, ["declared_by", "declared_at", "declaration_reference"])
    condition = "existe la sección First Release"
    checker.require(values, lines, section, "declared_by", "text", condition)
    checker.require(values, lines, section, "declared_at", "utc", condition)
    checker.require(values, lines, section, "declaration_reference", "text", condition)


SPECIFIC = {"genesis": check_genesis, "glossary": check_glossary,
            "backlog": check_backlog, "specs": check_specs}


def first_release_declared(specs_path):
    if not specs_path or not specs_path.exists():
        return False
    title = parse(specs_path.read_text(encoding="utf-8")).children
    return bool(title) and title[0].child("First Release") is not None


def check_file(path, doc_type, templates_dir, specs_path=None):
    """Verifica un archivo y devuelve la lista de errores (ruta, línea, mensaje)."""
    template_text = (templates_dir / TEMPLATES[doc_type]).read_text(encoding="utf-8")
    revision_text = None
    if doc_type == "genesis":
        revision_text = (templates_dir / REVISION_TEMPLATE).read_text(encoding="utf-8")
    checker = Checker(str(path), path.read_text(encoding="utf-8"), template_text,
                      revision_text, first_release_declared(specs_path),
                      conventions=doc_type in SPECIFIC)
    SPECIFIC.get(doc_type, lambda c: c.check_structure())(checker)
    return checker.errors


def documents(docs_dir):
    for doc_type, pattern in PATHS:
        for path in sorted(docs_dir.glob(pattern)):
            yield path, doc_type


def find_templates(start):
    for folder in [start, *start.parents]:
        candidate = folder / ".csdd" / "templates"
        if candidate.is_dir():
            return candidate
    return None


def main(argv=None):
    parser = argparse.ArgumentParser(description="Verifica documentos CSDD contra sus plantillas.")
    parser.add_argument("paths", nargs="+", type=pathlib.Path, metavar="RUTA")
    parser.add_argument("--templates", type=pathlib.Path, help="carpeta de plantillas (por defecto, .csdd/templates)")
    parser.add_argument("--type", choices=sorted(TEMPLATES), help="tipo de documento de un archivo")
    args = parser.parse_args(argv)
    errors, checked = [], 0
    for path in args.paths:
        if not path.exists():
            print(f"{path}: no existe", file=sys.stderr)
            return 2
        templates = args.templates or find_templates(path.resolve())
        if templates is None or not templates.is_dir():
            print(f"{path}: no se encontró .csdd/templates; indícala con --templates", file=sys.stderr)
            return 2
        if path.is_dir():
            targets = [(p, t, path / "specs.md") for p, t in documents(path)]
        else:
            doc_type = args.type or next((t for t, pattern in PATHS if path.match(pattern)), None)
            if doc_type is None:
                print(f"{path}: no se reconoce el tipo; indícalo con --type", file=sys.stderr)
                return 2
            docs = next((p for p in path.resolve().parents if p.name == "docs"), None)
            targets = [(path, doc_type, docs / "specs.md" if docs else None)]
        for target, doc_type, specs in targets:
            errors.extend(check_file(target, doc_type, templates, specs))
            checked += 1
    for path, line, message in errors:
        print(f"{path}:{line}: {message}")
    if not errors:
        print(f"Sin errores en {checked} archivo(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
