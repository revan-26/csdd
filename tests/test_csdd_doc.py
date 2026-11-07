"""Pruebas de creación, decisión, cierre y recuperación de Genesis y Glossary."""
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "integration" / "claude-code" / "csdd" / "scripts"
sys.path[:0] = [str(ROOT / "tools"), str(SCRIPTS)]

import csdd_check  # noqa: E402
import csdd_doc  # noqa: E402
from csdd_hash import GENESIS, GLOSSARY, active_block, body_of, block_body, prefix_of, sha  # noqa: E402

TERMS = """### Crédito
[G-001 · propuesto · dominio]

Préstamo otorgado a un cliente.

- Límites: no incluye líneas revolventes.

### Sucursal
[G-002 · supuesto · operación]

Oficina física.

### Cartera
[G-003 · diferido · dominio]

Conjunto de créditos vigentes.

## Términos Deprecados
"""


class DocTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.project = pathlib.Path(self.temp.name)
        shutil.copytree(ROOT / "framework" / "templates", self.project / ".csdd" / "templates")

    def tearDown(self):
        self.temp.cleanup()

    def genesis(self):
        return (self.project / GENESIS).read_text(encoding="utf-8")

    def glossary(self):
        return (self.project / GLOSSARY).read_text(encoding="utf-8")

    def state(self, *parts):
        return self.project.joinpath(".claude", "csdd", "state", *parts)

    def write_candidate(self):
        """Crea el esqueleto y redacta un candidato en todas las secciones obligatorias."""
        csdd_doc.new(self.project, "Demo")
        genesis = self.genesis()
        head, marker, tail = genesis.partition("\n## Decisión Humana")
        lines = []
        for line in head.split("\n"):
            lines.append(line)
            if line.startswith("## "):
                lines.extend(["", f"Contenido de {line[3:]}."])
        (self.project / GENESIS).write_text("\n".join(lines) + marker + tail, encoding="utf-8")
        glossary = self.glossary().replace("## Términos Deprecados\n", TERMS)
        (self.project / GLOSSARY).write_text(glossary, encoding="utf-8")

    def record_review(self, verdict="conforming"):
        """Registra un veredicto del bloque activo, como csdd_review.py record."""
        block_id, body = active_block(self.genesis())
        self.state("review").mkdir(parents=True, exist_ok=True)
        self.state("review", "review.json").write_text(json.dumps({
            "verdict": verdict, "block": block_id, "reviewed_at": "2026-10-31T10:00:00Z",
            "genesis_body": sha(body), "glossary": sha(self.glossary())}), encoding="utf-8")

    def candidate(self):
        self.write_candidate()
        self.record_review()

    def errors(self):
        return (csdd_doc.check(self.project, GENESIS, self.genesis(), "genesis")
                + csdd_doc.check(self.project, GLOSSARY, self.glossary(), "glossary"))

    # Creación

    def test_new_creates_valid_skeletons(self):
        csdd_doc.new(self.project, "  Demo   Uno ")
        self.assertTrue(self.genesis().startswith("# Genesis De Demo Uno\n"))
        self.assertTrue(self.glossary().startswith("# Glosario De Demo Uno\n"))
        self.assertEqual(self.errors(), [])

    def test_new_refuses_existing_document_or_bad_name(self):
        for name in ("", "a<b>"):
            with self.assertRaises(csdd_doc.DocError):
                csdd_doc.new(self.project, name)
        csdd_doc.new(self.project, "Demo")
        before = self.genesis()
        (self.project / GENESIS).write_text(before + "\nañadido\n", encoding="utf-8")
        with self.assertRaisesRegex(csdd_doc.DocError, "Ya existe"):
            csdd_doc.new(self.project, "Otro")
        self.assertIn("añadido", self.genesis())

    # Aprobación

    def test_approve_records_decision_closes_and_promotes(self):
        self.candidate()
        body = body_of(self.genesis())
        message = csdd_doc.approve(self.project, " Ana  Pérez ", "sesion", "mensaje")
        self.assertIn("Ana Pérez", message)
        self.assertEqual(self.errors(), [])
        text = self.genesis()
        self.assertEqual(body_of(text), body)
        decision = csdd_doc.admin_values(text, "Decisión Humana")
        materialization = csdd_doc.admin_values(text, "Materialización")
        self.assertEqual(decision["status"], "approved")
        self.assertEqual(decision["approved_by"], "Ana Pérez")
        self.assertEqual(decision["approved_content_reference"], sha(body))
        self.assertEqual(materialization["stage"], "closed")
        self.assertEqual(materialization["glossary_reference"], sha(self.glossary()))
        self.assertEqual(materialization["review_reference"], "reviewer 2026-10-31T10:00:00Z")
        self.assertIn("términos que pasan a acordado, 1; supuestos sin cambio, 1; diferidos sin cambio, 1", text)
        self.assertIn("[G-001 · acordado · dominio]", self.glossary())
        self.assertIn("[G-002 · supuesto · operación]", self.glossary())
        self.assertIn("[G-003 · diferido · dominio]", self.glossary())
        self.assertIn("no incluye líneas revolventes", self.glossary())
        self.assertFalse(self.state("pending").exists())
        record = json.loads(next(self.state("decisions").glob("*.json")).read_text(encoding="utf-8"))
        self.assertEqual((record["session_id"], record["prompt_id"]), ("sesion", "mensaje"))
        self.assertEqual(csdd_doc.status_report(self.project), ("Genesis approved, stage closed.", False))

    def assert_refused(self, pattern):
        genesis, glossary = self.genesis(), self.glossary()
        records = sorted(self.state("decisions").glob("*")) if self.state("decisions").exists() else []
        with self.assertRaisesRegex(csdd_doc.DocError, pattern):
            csdd_doc.approve(self.project, "Ana")
        self.assertEqual((self.genesis(), self.glossary()), (genesis, glossary))
        after = sorted(self.state("decisions").glob("*")) if self.state("decisions").exists() else []
        self.assertEqual(after, records)
        self.assertFalse(self.state("pending").exists())

    def test_approve_requires_review(self):
        self.write_candidate()
        self.assert_refused("No hay revisión")

    def test_approve_requires_conforming_verdict(self):
        self.write_candidate()
        self.record_review("non_conforming")
        self.assert_refused("non_conforming")

    def test_approve_requires_reviewed_body(self):
        self.candidate()
        (self.project / GENESIS).write_text(self.genesis().replace("Contenido de Resumen", "Otro resumen"), encoding="utf-8")
        self.assert_refused("cambió después de la revisión")

    def test_approve_requires_reviewed_glossary(self):
        self.candidate()
        (self.project / GLOSSARY).write_text(self.glossary().replace("Oficina física", "Oficina"), encoding="utf-8")
        self.assert_refused("cambió después de la revisión")

    def test_approve_requires_valid_structure(self):
        self.candidate()
        (self.project / GLOSSARY).write_text(self.glossary().replace("[G-001 ", "[G-NNN "), encoding="utf-8")
        self.record_review()
        self.assert_refused("errores de estructura")

    def test_approve_refuses_empty_sections(self):
        csdd_doc.new(self.project, "Demo")
        self.record_review()
        self.assert_refused("secciones obligatorias vacías")

    def test_empty_sections_follow_the_template(self):
        self.write_candidate()
        genesis = self.genesis().replace("Contenido de Readiness De La IA.", "").replace(
            "## Incertidumbres Y Riesgos", "## Investigación\n\n## Incertidumbres Y Riesgos")
        template = (self.project / ".csdd" / "templates" / csdd_check.TEMPLATES["genesis"]).read_text(encoding="utf-8")
        self.assertEqual(csdd_doc.empty_sections(genesis, template), (["Readiness De La IA"], ["Investigación"]))

    def test_approve_allows_empty_optional_section(self):
        self.write_candidate()
        (self.project / GENESIS).write_text(self.genesis().replace(
            "## Incertidumbres Y Riesgos", "## Investigación\n\n## Incertidumbres Y Riesgos"), encoding="utf-8")
        self.assertEqual(self.errors(), [])
        self.record_review()
        self.assertIn("aprobado por Ana", csdd_doc.approve(self.project, "Ana"))

    def test_approve_requires_name(self):
        self.candidate()
        with self.assertRaisesRegex(csdd_doc.DocError, "nombre"):
            csdd_doc.approve(self.project, "   ")

    def test_decision_is_not_repeated(self):
        self.candidate()
        csdd_doc.approve(self.project, "Ana")
        with self.assertRaisesRegex(csdd_doc.DocError, "ya tiene una decisión"):
            csdd_doc.approve(self.project, "Ana")
        with self.assertRaisesRegex(csdd_doc.DocError, "ya tiene una decisión"):
            csdd_doc.reject(self.project, "Ana", "no")

    def test_incomplete_revision_block_is_refused(self):
        self.candidate()
        (self.project / GENESIS).write_text(self.genesis() + "\n## Revisión De GENESIS: R-1\n", encoding="utf-8")
        with self.assertRaisesRegex(csdd_doc.DocError, "no tiene Decisión Humana y Materialización"):
            csdd_doc.approve(self.project, "Ana")

    # Revisión

    def closed(self):
        self.candidate()
        csdd_doc.approve(self.project, "Ana")

    def revision(self, term=True):
        """Abre R-001 sobre un Genesis cerrado y redacta sus secciones y un término nuevo."""
        self.closed()
        csdd_doc.revise(self.project)
        head, marker, tail = self.genesis().partition("## Revisión De GENESIS: R-001")
        before, decision, after = tail.partition("\n### Decisión Humana")
        lines = []
        for line in before.split("\n"):
            lines.append(line)
            if line.startswith("### "):
                lines.extend(["", f"Cambio en {line[4:]}."])
        (self.project / GENESIS).write_text(head + marker + "\n".join(lines) + decision + after, encoding="utf-8")
        if term:
            (self.project / GLOSSARY).write_text(self.glossary().replace(
                "## Términos Deprecados\n", "### Agencia\n[G-004 · propuesto · operación]\n\nOficina de atención.\n\n"
                "## Términos Deprecados\n"), encoding="utf-8")

    def test_revise_requires_closed_genesis(self):
        self.candidate()
        with self.assertRaisesRegex(csdd_doc.DocError, "Genesis cerrado"):
            csdd_doc.revise(self.project)

    def test_revise_opens_block_and_keeps_glossary(self):
        self.closed()
        prefix, glossary = self.genesis(), self.glossary()
        self.assertIn("R-001", csdd_doc.revise(self.project))
        text = self.genesis()
        self.assertTrue(text.startswith(prefix.rstrip("\n")))
        self.assertIn("## Revisión De GENESIS: R-001\n\n### Motivo Y Alcance\n", text)
        self.assertIn("### Decisión Humana\n\nstatus: pending\n", text)
        self.assertIn("### Materialización\n\nstage: pending\n", text)
        self.assertIn("#### Verificación", text)
        self.assertEqual(self.errors(), [])
        self.assertEqual(self.state("revisions", "R-001-glossary.md").read_text(encoding="utf-8"), glossary)
        self.assertEqual(csdd_doc.status_report(self.project), ("Revisión R-001 de Genesis en curso, sin decisión.", False))
        with self.assertRaisesRegex(csdd_doc.DocError, "Genesis cerrado"):
            csdd_doc.revise(self.project)

    def test_approve_revision_closes_only_its_block(self):
        self.revision()
        self.record_review()
        prefix = prefix_of(self.genesis(), "R-001")
        body = block_body(self.genesis(), "R-001")
        self.assertIn("Revisión R-001 de Genesis aprobada por Bea", csdd_doc.approve(self.project, "Bea"))
        text = self.genesis()
        self.assertEqual(self.errors(), [])
        self.assertEqual(prefix_of(text, "R-001"), prefix)
        self.assertEqual(block_body(text, "R-001"), body)
        self.assertEqual(csdd_doc.admin_values(text, "Decisión Humana")["approved_by"], "Bea")
        self.assertEqual(csdd_doc.admin_values(text, "Materialización")["genesis_reference"], sha(body))
        self.assertIn("contenido anterior coincide con el de su apertura", text)
        self.assertIn("[G-004 · acordado · operación]", self.glossary())
        self.assertEqual(csdd_doc.status_report(self.project), ("Genesis approved, stage closed (revisión R-001).", False))
        self.assertIn("R-002", csdd_doc.revise(self.project))

    def test_revision_needs_its_own_review(self):
        self.revision()
        self.assert_refused("No hay revisión registrada de este bloque")
        self.record_review("non_conforming")
        self.assert_refused("non_conforming")

    def test_revision_refuses_empty_sections_and_changed_prefix(self):
        self.revision()
        (self.project / GENESIS).write_text(self.genesis().replace("Cambio en Motivo Y Alcance.", ""), encoding="utf-8")
        self.record_review()
        self.assert_refused("vacías: Motivo Y Alcance")
        self.revision_restart()
        (self.project / GENESIS).write_text(self.genesis().replace("Contenido de Resumen", "Otro"), encoding="utf-8")
        self.record_review()
        self.assert_refused("contenido anterior a R-001 cambió")
        self.assertTrue(csdd_doc.status_report(self.project)[1])

    def revision_restart(self):
        self.tearDown()
        self.setUp()
        self.revision()

    def test_reject_revision_restores_glossary(self):
        self.revision()
        snapshot = self.state("revisions", "R-001-glossary.md").read_text(encoding="utf-8")
        candidate = self.glossary()
        body = block_body(self.genesis(), "R-001")
        message = csdd_doc.reject(self.project, "Bea", "# no\ncubre  el caso", "sesion", "mensaje")
        self.assertIn("Revisión R-001 de Genesis rechazada por Bea", message)
        self.assertEqual(self.errors(), [])
        text = self.genesis()
        self.assertEqual(block_body(text, "R-001"), body)
        self.assertEqual(csdd_doc.admin_values(text, "Decisión Humana")["status"], "rejected")
        self.assertEqual(csdd_doc.admin_values(text, "Materialización")["disposition"], "abandoned")
        self.assertIn("#### Notas De La Decisión\n\nMotivo: # no cubre el caso\n", text)
        self.assertEqual(self.glossary(), snapshot)
        self.assertEqual(next(self.state("rejected").glob("*")).read_text(encoding="utf-8"), candidate)
        self.assertEqual(csdd_doc.status_report(self.project), ("Genesis rejected, stage pending (revisión R-001).", False))
        self.assertIn("R-002", csdd_doc.revise(self.project))

    def test_reject_revision_requires_kept_glossary(self):
        self.revision()
        self.state("revisions", "R-001-glossary.md").unlink()
        with self.assertRaisesRegex(csdd_doc.DocError, "glosario conservado"):
            csdd_doc.reject(self.project, "Bea", "motivo")
        self.assertFalse(self.state("pending").exists())

    def test_recover_completes_interrupted_revision_approval(self):
        self.revision()
        self.record_review()
        self.interrupted(3)
        self.assertIn("Revisión R-001 de Genesis aprobada", csdd_doc.recover(self.project))
        self.assertEqual(self.errors(), [])
        self.assertIn("[G-004 · acordado · operación]", self.glossary())

    # Rechazo

    def test_initial_genesis_is_not_rejected(self):
        self.write_candidate()
        genesis, glossary = self.genesis(), self.glossary()
        with self.assertRaisesRegex(csdd_doc.DocError, "inicial no se rechaza"):
            csdd_doc.reject(self.project, "Ana", "motivo")
        self.assertEqual((self.genesis(), self.glossary()), (genesis, glossary))


    def test_reject_requires_name_and_reason(self):
        self.write_candidate()
        for name, reason in (("", "motivo"), ("Ana", " ")):
            with self.assertRaises(csdd_doc.DocError):
                csdd_doc.reject(self.project, name, reason)

    # Recuperación

    def interrupted(self, failing_writes):
        """Interrumpe una aprobación al llegar a la escritura indicada."""
        original, calls = csdd_doc.write_atomic, []

        def failing(path, text):
            calls.append(path)
            if len(calls) == failing_writes:
                raise OSError("interrumpido")
            original(path, text)
        with mock.patch.object(csdd_doc, "write_atomic", failing), self.assertRaises(OSError):
            csdd_doc.approve(self.project, "Ana")

    def test_recover_completes_at_every_interruption(self):
        # 1 constancia, 2 señal: sin señal no hay nada que completar. 3 glosario, 4 Genesis.
        for failing_writes in (3, 4):
            with self.subTest(failing_writes=failing_writes):
                self.tearDown()
                self.setUp()
                self.candidate()
                self.interrupted(failing_writes)
                self.assertTrue(self.state("pending").exists())
                self.assertTrue(csdd_doc.status_report(self.project)[1])
                with self.assertRaisesRegex(csdd_doc.DocError, "interrumpida"):
                    csdd_doc.approve(self.project, "Ana")
                self.assertIn("aprobado", csdd_doc.recover(self.project))
                self.assertEqual(self.errors(), [])
                self.assertFalse(self.state("pending").exists())
                self.assertIn("[G-001 · acordado · dominio]", self.glossary())
                self.assertEqual(csdd_doc.status_report(self.project)[1], False)

    def test_interruption_before_signal_leaves_documents_open(self):
        self.candidate()
        genesis = self.genesis()
        self.interrupted(2)
        self.assertEqual(self.genesis(), genesis)
        self.assertEqual(csdd_doc.recover(self.project), "No hay ninguna decisión interrumpida.")
        self.assertIn("aprobado", csdd_doc.approve(self.project, "Ana"))

    def test_recover_stops_on_changed_body(self):
        self.candidate()
        self.interrupted(3)
        (self.project / GENESIS).write_text(self.genesis().replace("Contenido de Resumen", "Otro"), encoding="utf-8")
        with self.assertRaisesRegex(csdd_doc.DocError, "cuerpo de Genesis difiere"):
            csdd_doc.recover(self.project)
        self.assertTrue(self.state("pending").exists())

    def test_recover_stops_on_changed_glossary(self):
        self.candidate()
        self.interrupted(3)
        (self.project / GLOSSARY).write_text(self.glossary() + "\n", encoding="utf-8")
        with self.assertRaisesRegex(csdd_doc.DocError, "glosario difiere"):
            csdd_doc.recover(self.project)

    def test_recover_stops_on_missing_or_corrupt_record(self):
        self.candidate()
        self.interrupted(3)
        record = next(self.state("decisions").glob("*.json"))
        record.write_text("{no es json", encoding="utf-8")
        with self.assertRaisesRegex(csdd_doc.DocError, "falta o está corrupta"):
            csdd_doc.recover(self.project)
        record.unlink()
        with self.assertRaisesRegex(csdd_doc.DocError, "falta o está corrupta"):
            csdd_doc.recover(self.project)

    def test_recover_completes_interrupted_rejection(self):
        self.revision()
        original = csdd_doc.write_atomic

        def failing(path, text):
            if path.name == "GENESIS.md":
                raise OSError("interrumpido")
            original(path, text)
        with mock.patch.object(csdd_doc, "write_atomic", failing), self.assertRaises(OSError):
            csdd_doc.reject(self.project, "Ana", "motivo")
        self.assertIn("rechazada", csdd_doc.recover(self.project))
        self.assertEqual(csdd_doc.admin_values(self.genesis(), "Decisión Humana")["status"], "rejected")
        self.assertEqual(self.errors(), [])

    # Estado

    def test_closed_genesis_does_not_need_working_state(self):
        # Un clon sin .claude/csdd/state/ conserva un Genesis válido y admite revisiones.
        self.candidate()
        csdd_doc.approve(self.project, "Ana")
        shutil.rmtree(self.project / ".claude/csdd/state")
        self.assertEqual(csdd_doc.status_report(self.project), ("Genesis approved, stage closed.", False))
        self.assertIn("Abierta la revisión R-001", csdd_doc.revise(self.project))

    def test_status_detects_changes_after_approval(self):
        self.candidate()
        csdd_doc.approve(self.project, "Ana")
        (self.project / GENESIS).write_text(self.genesis().replace("Contenido de Resumen", "Otro"), encoding="utf-8")
        text, problem = csdd_doc.status_report(self.project)
        self.assertTrue(problem)
        self.assertIn("cambió después de su aprobación", text)
        with self.assertRaisesRegex(csdd_doc.DocError, "No se abre una revisión"):
            csdd_doc.revise(self.project)

    def test_status_reports_malformed_genesis(self):
        self.candidate()
        (self.project / GENESIS).write_text(self.genesis().replace("status: pending", "status: otro"), encoding="utf-8")
        self.assertIn("no es una decisión válida", csdd_doc.status_report(self.project)[0])
        (self.project / GENESIS).write_text("# Genesis De Demo\n", encoding="utf-8")
        self.assertTrue(csdd_doc.status_report(self.project)[1])
        with self.assertRaisesRegex(csdd_doc.DocError, "no tiene Decisión Humana"):
            csdd_doc.approve(self.project, "Ana")

    def test_status_before_and_during_candidate(self):
        self.assertEqual(csdd_doc.status_report(self.project), ("Sin Genesis.", False))
        self.candidate()
        self.assertEqual(csdd_doc.status_report(self.project), ("Genesis candidato, sin decisión.", False))

    # Línea de comandos

    def run_cli(self, *args):
        environment = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1",
                       "PYTHONPATH": os.pathsep.join([str(ROOT / "tools"), str(SCRIPTS)])}
        return subprocess.run([sys.executable, str(SCRIPTS / "csdd_doc.py"), *args], cwd=self.project,
                              env=environment, capture_output=True, text=True)

    def test_cli_creates_reports_and_has_no_decision_commands(self):
        result = self.run_cli("new", "Demo")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.run_cli("new", "Demo").returncode, 1)
        self.assertIn("candidato", self.run_cli("status").stdout)
        self.assertEqual(self.run_cli("recover").returncode, 0)
        self.assertEqual(self.run_cli("approve", "Ana").returncode, 2)
        self.assertEqual(self.run_cli("reject", "Ana", "motivo").returncode, 2)
        self.assertEqual(csdd_doc.admin_values(self.genesis(), "Decisión Humana")["status"], "pending")

    def test_runs_from_real_installation(self):
        sys.path.insert(0, str(ROOT))
        try:
            import install
            with tempfile.TemporaryDirectory() as root, mock.patch("sys.stdout"):
                self.assertEqual(install.main([root]), 0)
                script = pathlib.Path(root) / ".claude" / "csdd" / "scripts" / "csdd_doc.py"
                environment = {k: v for k, v in os.environ.items() if k != "PYTHONPATH"}
                result = subprocess.run([sys.executable, str(script), "new", "Demo"], cwd=root,
                                        env=environment, capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertTrue((pathlib.Path(root) / GENESIS).exists())
                self.assertEqual(list(script.parent.glob("__pycache__")), [])
        finally:
            sys.path.pop(0)

    def test_checker_still_accepts_files(self):
        csdd_doc.new(self.project, "Demo")
        errors = csdd_check.check_file(self.project / GENESIS, "genesis", self.project / ".csdd" / "templates")
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
