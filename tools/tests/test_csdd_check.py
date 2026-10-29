"""Pruebas del verificador de esqueletos sobre documentos creados desde las plantillas."""
import contextlib
import io
import pathlib
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import csdd_check  # noqa: E402

TEMPLATES = pathlib.Path(__file__).resolve().parents[2] / "framework" / "templates"
SHA_A = "sha256:" + "a" * 64
SHA_B = "sha256:" + "b" * 64
WHEN = "2026-10-29T18:09:07Z"


def template(doc_type):
    return (TEMPLATES / csdd_check.TEMPLATES[doc_type]).read_text(encoding="utf-8")


def skeleton(doc_type):
    return csdd_check.skeleton(template(doc_type), "Demo")


def check(doc_type, text, first_release=False):
    revision = None
    if doc_type == "genesis":
        revision = (TEMPLATES / csdd_check.REVISION_TEMPLATE).read_text(encoding="utf-8")
    checker = csdd_check.Checker(doc_type, text, template(doc_type), revision, first_release,
                                 conventions=doc_type in csdd_check.SPECIFIC)
    csdd_check.SPECIFIC.get(doc_type, lambda c: c.check_structure())(checker)
    return [message for _, _, message in checker.errors]


def replace(text, old, new):
    assert text.count(old) == 1, old
    return text.replace(old, new)


def approved_genesis():
    text = replace(skeleton("genesis"),
                   "status: pending\napproved_by:\napproved_at:\napproved_content_reference:\napproval_reference:",
                   f"status: approved\napproved_by: Ana\napproved_at: {WHEN}\n"
                   f"approved_content_reference: {SHA_A}\napproval_reference: csdd-aprobar {WHEN}")
    return text


def closed_genesis():
    text = replace(approved_genesis(),
                   "stage: pending\ndisposition:\ngenesis_reference:\nglossary_reference:\n"
                   "review_reference:\nreview_verdict:",
                   f"stage: closed\ndisposition:\ngenesis_reference: {SHA_A}\nglossary_reference: {SHA_B}\n"
                   f"review_reference: reviewer {WHEN}\nreview_verdict: conforming")
    text = replace(text, "### Verificación\n", "### Verificación\n\n- Huellas comprobadas.\n")
    return replace(text, "### Limitaciones\n", "### Limitaciones\n\n- Sin guarda.\n")


REVISION = """
## Revisión De GENESIS: R-001

### Motivo Y Alcance

Cambio de destinatarios.

### Acuerdos Sustituidos Y Cambio Propuesto

Texto.

### Impactos Y Reconciliación

Texto.

### Pendientes Y Procedencia

Texto.

### Decisión Humana

status: pending
approved_by:
approved_at:
approved_content_reference:
approval_reference:
rejected_by:
rejected_at:
rejection_reference:

### Materialización

stage: pending
disposition:
genesis_reference:
glossary_reference:
review_reference:
review_verdict:
"""


def glossary(terms="", deprecated=""):
    text = replace(skeleton("glossary"), "## Términos\n", "## Términos\n" + terms)
    return replace(text, "## Términos Deprecados\n", "## Términos Deprecados\n" + deprecated)


TERM = "\n### Stock\n[G-001 · propuesto · elemento]\n\nAcumula una cantidad.\n\n- Límites: no es un flujo.\n"


def backlog(items="", closed=""):
    text = replace(skeleton("backlog"), "## Ítems\n", "## Ítems\n" + items)
    return replace(text, "## Cerrados Y Descartados\n", "## Cerrados Y Descartados\n" + closed)


ITEM = "\n### Verificador\n[B-001 · aceptado · fr]\n\nComprueba esqueletos.\n\n- Fuentes: plantillas\n"


class SkeletonTest(unittest.TestCase):
    def test_every_skeleton_passes(self):
        for doc_type in csdd_check.TEMPLATES:
            text = skeleton(doc_type).replace("ADR NNN", "ADR 001")
            with self.subTest(doc_type=doc_type):
                self.assertEqual(check(doc_type, text), [])

    def test_skeleton_drops_guidance_optional_and_example_entries(self):
        text = skeleton("glossary")
        self.assertTrue(text.startswith("# Glosario De Demo\n"))
        self.assertNotIn("<", text)
        self.assertNotIn("## Propósito", text)
        self.assertIn("## Términos Deprecados", text)

    def test_admin_keys_match_template(self):
        root = csdd_check.load_template(template("genesis")).children[0]
        sections = {t.title: t for t in root.children}
        self.assertEqual(sections["Decisión Humana"].admin_keys, csdd_check.GENESIS_DECISION)
        self.assertEqual(sections["Materialización"].admin_keys, csdd_check.GENESIS_MATERIALIZATION)


class StructureTest(unittest.TestCase):
    def test_missing_required_section(self):
        text = replace(skeleton("genesis"), "## Primer Slice\n\n", "")
        self.assertIn("falta la sección «Primer Slice» antes de «Incertidumbres Y Riesgos»", check("genesis", text))

    def test_optional_section_may_appear(self):
        text = replace(skeleton("genesis"), "## Incertidumbres Y Riesgos",
                       "## Investigación\n\nInforme citado.\n\n## Incertidumbres Y Riesgos")
        self.assertEqual(check("genesis", text), [])

    def test_unknown_and_out_of_order_sections(self):
        text = replace(skeleton("genesis"), "## Siguiente Fase", "## Procedencia\n\nTexto.\n\n## Siguiente Fase")
        self.assertIn("sección no prevista «Procedencia»", check("genesis", text))
        text = skeleton("genesis") + "\n## Resumen Ejecutivo\n"
        self.assertIn("sección «Resumen Ejecutivo» repetida o fuera de orden", check("genesis", text))

    def test_unknown_subsection_but_free_deeper_levels(self):
        text = replace(skeleton("genesis"), "## Primer Slice\n", "## Primer Slice\n\n### Detalle\n")
        self.assertIn("sección no prevista «Detalle»", check("genesis", text))
        text = replace(skeleton("genesis"), "## Primer Slice\n", "## Primer Slice\n\n#### Detalle\n")
        self.assertEqual(check("genesis", text), [])

    def test_headings_inside_code_fences_are_ignored(self):
        text = replace(skeleton("genesis"), "## Primer Slice\n", "## Primer Slice\n\n```\n## No\n```\n")
        self.assertEqual(check("genesis", text), [])

    def test_title_and_content_outside_sections(self):
        text = replace(skeleton("glossary"), "# Glosario De Demo", "# Vocabulario")
        self.assertIn("título «Vocabulario» no sigue «Glosario De <project-name>»", check("glossary", text))
        text = replace(skeleton("backlog"), "# Backlog De Demo\n", "# Backlog De Demo\n\nNota.\n")
        self.assertIn("contenido fuera de las secciones", check("backlog", text))

    def test_leftover_guidance(self):
        text = replace(skeleton("genesis"), "## Primer Slice\n",
                       "## Primer Slice\n\n<Outcome, comportamientos, incluidos/excluidos, cierre y aprendizaje.>\n")
        self.assertTrue(any(m.startswith("guía de la plantilla sin quitar") for m in check("genesis", text)))


class GenesisAdministrationTest(unittest.TestCase):
    def test_pending_approved_and_closed_are_valid(self):
        for text in (skeleton("genesis"), approved_genesis(), closed_genesis()):
            self.assertEqual(check("genesis", text), [])

    def test_pending_forbids_values(self):
        text = replace(skeleton("genesis"), "approved_by:\n", "approved_by: Ana\n")
        self.assertIn("«approved_by» debe estar vacío cuando status es pending", check("genesis", text))

    def test_approved_requires_fields_and_formats(self):
        text = replace(approved_genesis(), f"approved_at: {WHEN}", "approved_at: ayer")
        text = replace(text, f"approved_content_reference: {SHA_A}", "approved_content_reference: abc")
        errors = check("genesis", text)
        self.assertIn("«approved_at» debe ser una fecha UTC AAAA-MM-DDTHH:MM:SSZ", errors)
        self.assertIn("«approved_content_reference» debe tener la forma sha256:<64 caracteres hexadecimales>", errors)
        text = replace(approved_genesis(), "rejected_by:\n", "rejected_by: Ana\n")
        self.assertIn("«rejected_by» debe estar vacío cuando status es approved", check("genesis", text))

    def test_rejected_requires_its_fields(self):
        text = replace(skeleton("genesis"), "status: pending", "status: rejected")
        self.assertIn("«rejected_by» es obligatorio cuando status es rejected", check("genesis", text))

    def test_invalid_values_and_keys(self):
        text = replace(skeleton("genesis"), "status: pending", "status: aprobado")
        self.assertIn("«status» admite pending, approved, rejected; tiene «aprobado»", check("genesis", text))
        text = replace(skeleton("genesis"), "approved_by:\n", "approver:\n")
        errors = check("genesis", text)
        self.assertIn("clave administrativa no prevista «approver»", errors)
        self.assertIn("falta la clave administrativa «approved_by» en «Decisión Humana»", errors)
        text = replace(skeleton("genesis"), "approved_by:\napproved_at:", "approved_at:\napproved_by:")
        self.assertIn("claves administrativas de «Decisión Humana» fuera de orden", check("genesis", text))

    def test_closed_conditions(self):
        text = replace(closed_genesis(), "### Limitaciones\n\n- Sin guarda.\n", "### Limitaciones\n")
        self.assertIn("«stage: closed» exige contenido en «Limitaciones»", check("genesis", text))
        text = replace(closed_genesis(), "disposition:\n", "disposition: abandoned\n")
        errors = check("genesis", text)
        self.assertIn("«disposition» debe estar vacío cuando stage es closed", errors)
        self.assertIn("«disposition: abandoned» exige status rejected", errors)
        text = replace(closed_genesis(), "review_verdict: conforming", "review_verdict: non_conforming")
        self.assertIn("«stage: closed» exige review_verdict conforming", check("genesis", text))
        text = replace(closed_genesis(), f"genesis_reference: {SHA_A}", f"genesis_reference: {SHA_B}")
        self.assertIn("«genesis_reference» difiere de «approved_content_reference»", check("genesis", text))

    def test_closed_requires_approval(self):
        text = replace(skeleton("genesis"), "stage: pending", "stage: closed")
        self.assertIn("«stage: closed» exige status approved", check("genesis", text))

    def test_revision_after_closed_block(self):
        self.assertEqual(check("genesis", closed_genesis() + REVISION), [])

    def test_revision_after_open_block(self):
        errors = check("genesis", skeleton("genesis") + REVISION)
        self.assertIn("una revisión exige que el bloque anterior esté cerrado o rechazado y abandonado", errors)

    def test_revision_checks_its_own_sections(self):
        text = closed_genesis() + replace(REVISION, "### Impactos Y Reconciliación\n\nTexto.\n\n", "")
        self.assertTrue(any("falta la sección «Impactos Y Reconciliación»" in m for m in check("genesis", text)))


class GlossaryTest(unittest.TestCase):
    def test_valid_terms(self):
        deprecated = ("\n### Nivel\n[G-002 · acordado · elemento]\n\nNombre anterior.\n\n"
                      "- Reemplazado por: G-001\n- Motivo: se unificó.\n")
        self.assertEqual(check("glossary", glossary(TERM, deprecated)), [])

    def test_admin_line_strength_and_ids(self):
        errors = check("glossary", glossary(TERM.replace("[G-001 · propuesto · elemento]", "[G-1 · propuesto]")))
        self.assertIn("línea administrativa de «Stock» no sigue [G-NNN · fuerza · categoría]", errors)
        errors = check("glossary", glossary(TERM.replace("propuesto", "firme")))
        self.assertIn("fuerza «firme» no admitida en «Stock»", errors)
        errors = check("glossary", glossary(TERM + TERM.replace("Stock", "Flujo")))
        self.assertTrue(any(m.startswith("ID G-001 repetido") for m in errors))
        errors = check("glossary", glossary(TERM + TERM.replace("G-001", "G-002")))
        self.assertTrue(any(m.startswith("término «Stock» repetido") for m in errors))

    def test_definition_and_fields(self):
        errors = check("glossary", glossary("\n### Stock\n[G-001 · propuesto · elemento]\n\n- Límites: x\n"))
        self.assertIn("la entrada «Stock» no tiene texto", errors)
        errors = check("glossary", glossary(TERM + "- Motivo: x\n"))
        self.assertIn("campo «Motivo» no admitido en «Stock»", errors)
        errors = check("glossary", glossary(TERM.replace("- Límites: no es un flujo.", "- Límites: <opcional>")))
        self.assertIn("campo «Límites» con el valor de guía <opcional>", errors)

    def test_deprecated_requirements(self):
        errors = check("glossary", glossary(deprecated="\n### Nivel\n[G-002 · acordado · elemento]\n\nAntes.\n"))
        self.assertIn("el término deprecado «Nivel» exige «Reemplazado por»", errors)
        self.assertIn("el término deprecado «Nivel» exige «Motivo»", errors)
        deprecated = "\n### Nivel\n[G-002 · acordado · x]\n\nAntes.\n\n- Reemplazado por: G-009\n- Motivo: y\n"
        errors = check("glossary", glossary(deprecated=deprecated))
        self.assertIn("«Reemplazado por» debe ser un ID existente o «ninguno»; tiene «G-009»", errors)


class BacklogTest(unittest.TestCase):
    def test_valid_items(self):
        closed = "\n### Prueba\n[B-002 · cerrado]\n\nConversación real.\n\n- Cierre: informe del 2026-10-29\n"
        self.assertEqual(check("backlog", backlog(ITEM, closed)), [])

    def test_required_fields(self):
        errors = check("backlog", backlog(ITEM.replace("- Fuentes: plantillas\n", "")))
        self.assertIn("«Verificador» exige «Fuentes»", errors)
        errors = check("backlog", backlog(ITEM.replace("aceptado", "diferido")))
        self.assertIn("«Verificador» exige «Razón»", errors)
        errors = check("backlog", backlog(closed="\n### Prueba\n[B-002 · cerrado]\n\nTexto.\n"))
        self.assertIn("«Prueba» exige «Cierre»", errors)
        errors = check("backlog", backlog(closed="\n### Prueba\n[B-002 · descartado]\n\nTexto.\n"))
        self.assertIn("«Prueba» exige «Razón»", errors)

    def test_states_by_section(self):
        errors = check("backlog", backlog(ITEM.replace("aceptado", "cerrado")))
        self.assertIn("un ítem «cerrado» va en «Cerrados Y Descartados»", errors)
        errors = check("backlog", backlog(closed="\n### P\n[B-002 · aceptado]\n\nTexto.\n"))
        self.assertIn("un ítem «aceptado» va en «Ítems»", errors)
        errors = check("backlog", backlog(ITEM.replace("aceptado", "hecho")))
        self.assertIn("estado «hecho» no admitido en «Verificador»", errors)

    def test_horizon_before_and_after_first_release(self):
        item = ITEM.replace(" · fr]", "]")
        self.assertIn("«Verificador» exige horizonte antes de First Release", check("backlog", backlog(item)))
        self.assertEqual(check("backlog", backlog(item), first_release=True), [])
        errors = check("backlog", backlog(ITEM.replace(" · fr]", " · v1]")))
        self.assertIn("horizonte «v1» no admitido; admite fr o posterior", errors)

    def test_ids_and_dependencies(self):
        errors = check("backlog", backlog(ITEM + ITEM.replace("Verificador", "Otro")))
        self.assertTrue(any(m.startswith("ID B-001 repetido") for m in errors))
        errors = check("backlog", backlog(ITEM + "- Depende de: B-007\n"))
        self.assertIn("«Depende de» cita B-007, que no existe", errors)
        errors = check("backlog", backlog(ITEM + "- Cierre: x\n"))
        self.assertIn("campo «Cierre» no admitido en «Verificador»", errors)


class SpecsTest(unittest.TestCase):
    FIRST_RELEASE = ("\n## First Release\n\ndeclared_by: Ana\ndeclared_at: {when}\n"
                     "declaration_reference: decision 1\n\n### Activos Protegidos\n\nContrato de pagos.\n")

    def test_first_release_valid(self):
        text = skeleton("specs") + self.FIRST_RELEASE.format(when=WHEN)
        self.assertEqual(check("specs", text), [])

    def test_first_release_requirements(self):
        text = skeleton("specs") + self.FIRST_RELEASE.format(when="")
        self.assertIn("«declared_at» es obligatorio cuando existe la sección First Release", check("specs", text))
        text = skeleton("specs") + self.FIRST_RELEASE.format(when=WHEN).split("\n### Activos")[0] + "\n"
        self.assertTrue(any("falta la sección «Activos Protegidos»" in m for m in check("specs", text)))


class CommandLineTest(unittest.TestCase):
    def run_main(self, *args):
        output = io.StringIO()
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            code = csdd_check.main([*args, "--templates", str(TEMPLATES)])
        return code, output.getvalue()

    def write_docs(self, root, backlog_text, specs_text=None):
        docs = pathlib.Path(root) / "docs"
        (docs / "base").mkdir(parents=True)
        (docs / "base" / "GENESIS.md").write_text(closed_genesis(), encoding="utf-8")
        (docs / "glossary.md").write_text(glossary(TERM), encoding="utf-8")
        (docs / "backlog.md").write_text(backlog_text, encoding="utf-8")
        if specs_text:
            (docs / "specs.md").write_text(specs_text, encoding="utf-8")
        return docs

    def test_docs_folder(self):
        with tempfile.TemporaryDirectory() as root:
            docs = self.write_docs(root, backlog(ITEM))
            self.assertEqual(self.run_main(str(docs)), (0, "Sin errores en 3 archivo(s).\n"))

    def test_first_release_comes_from_specs(self):
        item = ITEM.replace(" · fr]", "]")
        specs = skeleton("specs") + SpecsTest.FIRST_RELEASE.format(when=WHEN)
        with tempfile.TemporaryDirectory() as root:
            docs = self.write_docs(root, backlog(item), specs)
            self.assertEqual(self.run_main(str(docs))[0], 0)
            code, output = self.run_main(str(docs / "backlog.md"))
            self.assertEqual(code, 0, output)

    def test_errors_and_usage(self):
        with tempfile.TemporaryDirectory() as root:
            docs = self.write_docs(root, backlog(ITEM.replace("- Fuentes: plantillas\n", "")))
            code, output = self.run_main(str(docs))
            self.assertEqual(code, 1)
            self.assertRegex(output, r"backlog\.md:\d+: «Verificador» exige «Fuentes»")
            notes = pathlib.Path(root) / "notas.md"
            notes.write_text("# Notas\n", encoding="utf-8")
            self.assertEqual(self.run_main(str(notes))[0], 2)
            self.assertEqual(self.run_main(str(notes), "--type", "backlog")[0], 1)


if __name__ == "__main__":
    unittest.main()
