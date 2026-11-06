"""Pruebas de los hooks instalados, ejecutados como los invoca Claude Code."""
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / "tools"), str(ROOT / "integration" / "claude-code" / "csdd" / "scripts")]

import install  # noqa: E402
from csdd_hash import body_of, sha  # noqa: E402

GENESIS = "docs/base/GENESIS.md"
GLOSSARY = "docs/glossary.md"
CANON = "csdd-canon"
REVIEWER = "csdd-reviewer"
EXPLORER = "csdd-explorer"
TERM = "### Crédito\n[G-NNN · propuesto · dominio]\n\nPréstamo a un cliente.\n\n"


class HookTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.project = pathlib.Path(self.temp.name).resolve()
        with mock.patch("sys.stdout"):
            self.assertEqual(install.main([str(self.project)]), 0)
        self.scripts = self.project / ".claude" / "csdd" / "scripts"
        self.state = self.project / ".claude" / "csdd" / "state"
        self.environment = {k: v for k, v in os.environ.items() if k != "PYTHONPATH"}
        self.environment.update(CLAUDE_PROJECT_DIR=str(self.project), PYTHONDONTWRITEBYTECODE="1")

    def tearDown(self):
        self.temp.cleanup()

    def run_script(self, script, payload):
        return subprocess.run([sys.executable, str(self.scripts / script)], input=json.dumps(payload),
                              cwd=self.project, env=self.environment, capture_output=True, text=True)

    def cli(self, *args):
        result = subprocess.run([sys.executable, str(self.scripts / args[0]), *args[1:]], cwd=self.project,
                                env=self.environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def text(self, relative):
        return (self.project / relative).read_text(encoding="utf-8")

    def put(self, relative, text):
        path = self.project / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    # Guarda

    def guard(self, tool, tool_input, agent=None):
        payload = {"hook_event_name": "PreToolUse", "tool_name": tool, "tool_input": tool_input,
                   "cwd": str(self.project)}
        if agent:
            payload.update(agent_type=agent, agent_id="a1")
        return self.run_script("csdd_guard.py", payload)

    def edit(self, relative, old, new, agent=CANON, replace_all=False):
        return self.guard("Edit", {"file_path": str(self.project / relative), "old_string": old,
                                   "new_string": new, "replace_all": replace_all}, agent)

    def assert_allowed(self, result):
        self.assertEqual(result.returncode, 0, result.stderr)

    def assert_denied(self, result, pattern):
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertRegex(result.stderr, pattern)

    def skeleton(self):
        self.cli("csdd_doc.py", "new", "Demo")

    def candidate(self):
        """Candidato completo y revisado, redactado sin pasar por la guarda."""
        self.skeleton()
        head, marker, tail = self.text(GENESIS).partition("\n## Decisión Humana")
        lines = []
        for line in head.split("\n"):
            lines.append(line)
            if line.startswith("## "):
                lines.extend(["", f"Contenido de {line[3:]}."])
        self.put(GENESIS, "\n".join(lines) + marker + tail)
        self.put(GLOSSARY, self.text(GLOSSARY).replace(
            "## Términos Deprecados", TERM.replace("G-NNN", "G-001") + "## Términos Deprecados"))
        self.put(".claude/csdd/state/review/review.json", json.dumps({
            "verdict": "conforming", "reviewed_at": "2026-10-31T10:00:00Z",
            "genesis_body": sha(body_of(self.text(GENESIS))), "glossary": sha(self.text(GLOSSARY))}))

    def test_canon_edits_genesis_content(self):
        self.skeleton()
        self.assert_allowed(self.edit(GENESIS, "## Resumen Ejecutivo\n", "## Resumen Ejecutivo\n\nTexto.\n"))

    def test_canon_adds_optional_section(self):
        self.skeleton()
        self.assert_allowed(self.edit(GENESIS, "## Incertidumbres Y Riesgos\n",
                                      "## Investigación\n\nTexto.\n\n## Incertidumbres Y Riesgos\n"))

    def test_genesis_structure_is_protected(self):
        self.skeleton()
        cases = [("# Genesis De Demo", "# Genesis De Otro", "título"),
                 ("## Resumen Ejecutivo", "## Resumen", "estructura"),
                 ("## Primer Slice\n", "", "estructura"),
                 ("## Primer Slice", "## Inventada\n\n## Primer Slice", "estructura"),
                 ("status: pending", "status: approved", "solo el código"),
                 ("stage: pending", "stage: closed", "solo el código"),
                 ("### Verificación\n", "### Verificación\n\nHecho.\n", "solo el código")]
        for old, new, pattern in cases:
            with self.subTest(old=old):
                self.assert_denied(self.edit(GENESIS, old, new), pattern)

    def test_write_is_simulated_too(self):
        self.skeleton()
        path = str(self.project / GENESIS)
        self.assert_denied(self.guard("Write", {"file_path": path, "content": "# Genesis De Demo\n"}, CANON), "solo el código")
        text = self.text(GENESIS).replace("## Resumen Ejecutivo\n", "## Resumen Ejecutivo\n\nTexto.\n")
        self.assert_allowed(self.guard("Write", {"file_path": path, "content": text}, CANON))

    def test_multi_edit_is_simulated(self):
        self.skeleton()
        edits = [{"old_string": "## Resumen Ejecutivo\n", "new_string": "## Resumen Ejecutivo\n\nTexto.\n"},
                 {"old_string": "status: pending", "new_string": "status: approved"}]
        self.assert_denied(self.guard("MultiEdit", {"file_path": str(self.project / GENESIS), "edits": edits}, CANON),
                           "solo el código")

    def test_failing_edit_is_left_to_the_tool(self):
        self.skeleton()
        self.assert_allowed(self.edit(GENESIS, "no existe", "x"))

    def test_decided_genesis_is_frozen(self):
        self.candidate()
        self.prompt("/csdd-approve Ana")
        self.assert_denied(self.edit(GENESIS, "Contenido de Resumen", "Otro"), "ya tiene una decisión")

    def test_documents_are_created_only_by_command(self):
        for relative in (GENESIS, GLOSSARY):
            self.assert_denied(self.guard("Write", {"file_path": str(self.project / relative), "content": "x"}, CANON),
                               "csdd_doc.py new")

    def test_case_and_relative_paths_do_not_evade(self):
        self.skeleton()
        evasions = ["docs/../docs/base/GENESIS.md", "./docs/base/GENESIS.md"]
        for raw in evasions:
            self.assert_denied(self.guard("Write", {"file_path": raw, "content": "x"}, CANON), "solo el código")
        self.assert_denied(self.guard("Write", {"file_path": "DOCS/base/genesis.md", "content": "x"}, CANON), "solo el código|csdd_doc.py new")

    def test_interrupted_decision_blocks_edits(self):
        self.skeleton()
        self.put(".claude/csdd/state/pending", "x\n")
        self.assert_denied(self.edit(GENESIS, "## Resumen Ejecutivo\n", "## Resumen Ejecutivo\n\nTexto.\n"), "interrumpida")

    # Glosario

    def add_term(self, term=TERM):
        return self.edit(GLOSSARY, "## Términos Deprecados", term + "## Términos Deprecados")

    def agreed_term(self):
        self.candidate()
        self.prompt("/csdd-approve Ana")

    def test_new_term_uses_literal(self):
        self.skeleton()
        self.assert_allowed(self.add_term())
        self.assert_allowed(self.add_term(TERM.replace("propuesto", "supuesto")))
        self.assert_denied(self.add_term(TERM.replace("G-NNN", "G-007")), "el código asigna")
        self.assert_denied(self.add_term(TERM.replace("propuesto", "acordado")), "la aprobación escribe acordado")
        self.assert_denied(self.add_term("### Crédito\n[G-NNN · propuesto · dominio]\n\n"), "estructura")

    def test_new_term_does_not_go_to_deprecated(self):
        self.skeleton()
        text = self.text(GLOSSARY).rstrip("\n") + "\n\n" + TERM
        self.assert_denied(self.guard("Write", {"file_path": str(self.project / GLOSSARY), "content": text}, CANON), "va en Términos")

    def test_candidate_term_protects_admin_but_allows_definition_and_removal(self):
        self.candidate()
        self.assert_allowed(self.edit(GLOSSARY, "Préstamo a un cliente", "Préstamo otorgado"))
        self.assert_allowed(self.edit(GLOSSARY, TERM.replace("G-NNN", "G-001"), ""))
        for old, new in (("### Crédito", "### Préstamo"), ("G-001 · propuesto", "G-002 · propuesto"),
                         ("G-001 · propuesto", "G-001 · supuesto"), ("· dominio", "· otra")):
            with self.subTest(old=old, new=new):
                self.assert_denied(self.edit(GLOSSARY, old, new), "no se cambian|el código asigna")

    def test_agreed_term_is_immutable(self):
        self.agreed_term()
        self.assert_denied(self.edit(GLOSSARY, "Préstamo a un cliente", "Otro"), "acordado y no se edita")
        self.assert_denied(self.edit(GLOSSARY, TERM.replace("G-NNN", "G-001").replace("propuesto", "acordado"), ""),
                           "acordado y no se elimina")
        self.assert_allowed(self.add_term(TERM.replace("Crédito", "Cartera")))

    # Asignación de IDs

    def post_tool(self, relative):
        return self.run_script("csdd_hook.py", {"hook_event_name": "PostToolUse", "tool_name": "Edit",
                                                "tool_input": {"file_path": str(self.project / relative)},
                                                "cwd": str(self.project)})

    def test_ids_are_assigned_and_never_reused(self):
        self.skeleton()
        self.put(GLOSSARY, self.text(GLOSSARY).replace("## Términos Deprecados", TERM + TERM.replace("Crédito", "Cartera") + "## Términos Deprecados"))
        result = self.post_tool(GLOSSARY)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("G-001, G-002", json.loads(result.stdout)["hookSpecificOutput"]["additionalContext"])
        self.assertIn("[G-001 · propuesto · dominio]", self.text(GLOSSARY))
        self.assertIn("[G-002 · propuesto · dominio]", self.text(GLOSSARY))
        self.put(GLOSSARY, self.text(GLOSSARY).replace("[G-002 · propuesto · dominio]", "[G-NNN · propuesto · dominio]"))
        self.post_tool(GLOSSARY)
        self.assertIn("[G-003 · propuesto · dominio]", self.text(GLOSSARY))
        self.assertNotIn("G-002", self.text(GLOSSARY))

    def test_post_tool_ignores_other_files(self):
        self.skeleton()
        result = self.post_tool(GENESIS)
        self.assertEqual((result.returncode, result.stdout), (0, ""))

    # Roles

    def test_write_roles(self):
        self.skeleton()
        support = "docs/support/informe.md"
        self.assert_allowed(self.guard("Write", {"file_path": support, "content": "x"}, EXPLORER))
        self.put(support, "x")
        self.assert_denied(self.guard("Write", {"file_path": support, "content": "y"}, EXPLORER), "informes nuevos")
        self.assert_denied(self.guard("Write", {"file_path": GENESIS, "content": "y"}, EXPLORER), "informes nuevos")
        self.assert_denied(self.guard("Write", {"file_path": "src/a.py", "content": "y"}, EXPLORER), "informes nuevos")
        self.assert_denied(self.guard("Write", {"file_path": "docs/support/../x.md", "content": "y"}, EXPLORER), "informes nuevos")
        self.assert_denied(self.guard("Write", {"file_path": "docs/x.md", "content": "y"}, REVIEWER), "no escribe")
        self.assert_denied(self.guard("Write", {"file_path": "src/a.py", "content": "y"}, CANON), "solo edita docs")
        self.assert_denied(self.guard("Write", {"file_path": "docs/x.md", "content": "y"}), "Solo Canon")
        self.assert_denied(self.guard("Write", {"file_path": "docs/x.md", "content": "y"}, "general-purpose"), "Solo Canon")
        self.assert_allowed(self.guard("Write", {"file_path": "src/a.py", "content": "y"}))
        self.assert_allowed(self.guard("Write", {"file_path": "/fuera/del/proyecto.md", "content": "y"}))

    def test_installation_is_reserved(self):
        for relative in (".csdd/CSDD.md", ".claude/csdd/state/pending", ".claude/csdd/scripts/csdd_doc.py",
                         ".claude/settings.json", ".claude/settings.local.json",
                         ".claude/skills/csdd-genesis/SKILL.md", ".claude/agents/csdd-canon.md"):
            with self.subTest(relative=relative):
                self.assert_denied(self.guard("Write", {"file_path": relative, "content": "x"}), "instalación de CSDD")

    # Bash

    def bash(self, command, agent=None):
        return self.guard("Bash", {"command": command}, agent)

    def test_bash_allows_scripts_and_unrelated_commands(self):
        for command in ("npm test", "git status", "ls docs/support",
                        "python3 .claude/csdd/scripts/csdd_review.py status",
                        "python3 .claude/csdd/scripts/csdd_review.py diff",
                        "python3 .claude/csdd/scripts/csdd_hash.py",
                        "python3 .claude/csdd/scripts/csdd_check.py docs/",
                        "python3 .claude/csdd/scripts/csdd_doc.py status",
                        "python3 .claude/csdd/scripts/csdd_doc.py recover",
                        'python3 .claude/csdd/scripts/csdd_doc.py new "Mi Proyecto"',
                        f"python3 {self.project}/.claude/csdd/scripts/csdd_doc.py status"):
            with self.subTest(command=command):
                self.assert_allowed(self.bash(command))

    def test_bash_blocks_protected_paths(self):
        for command in ("sed -i '' s/a/b/ docs/base/GENESIS.md",
                        "echo x >> docs/glossary.md",
                        "cd docs/base && rm *",
                        "cat > .claude/csdd/state/pending",
                        "rm -rf .csdd",
                        "cat .claude/settings.json",
                        'python3 -c "import csdd_doc; csdd_doc.approve(\'.\', \'Ana\')"',
                        "python3 .claude/csdd/scripts/csdd_doc.py status; rm docs/glossary.md",
                        "python3 .claude/csdd/scripts/csdd_doc.py approve Ana",
                        "python3 .claude/csdd/scripts/csdd_review.py record conforming"):
            with self.subTest(command=command):
                self.assertEqual(self.bash(command).returncode, 2)

    def test_only_reviewer_records_and_agents_run_only_scripts(self):
        record = "python3 .claude/csdd/scripts/csdd_review.py record conforming"
        self.assert_allowed(self.bash(record, REVIEWER))
        self.assert_denied(self.bash(record, CANON), "solo ejecuta")
        self.assert_denied(self.bash(record), "Solo Reviewer")
        self.assert_denied(self.bash("python3 .claude/csdd/scripts/csdd_review.py record otro", REVIEWER), "solo ejecuta")
        self.assert_allowed(self.bash("python3 .claude/csdd/scripts/human_messages.py", REVIEWER))
        self.assert_denied(self.bash("echo x > a.txt", REVIEWER), "solo ejecuta")
        self.assert_denied(self.bash("ls", CANON), "solo ejecuta")

    def test_guard_fails_closed(self):
        result = subprocess.run([sys.executable, str(self.scripts / "csdd_guard.py")], input="{no es json",
                                cwd=self.project, env=self.environment, capture_output=True, text=True)
        self.assert_denied(result, "rechaza por seguridad")
        (self.scripts / "csdd_doc.py").write_text("no es python válido", encoding="utf-8")
        self.assert_denied(self.guard("Write", {"file_path": "src/a.py", "content": "y"}), "rechaza por seguridad")

    # Decisión por hook

    def prompt(self, text, prompt_id="m1"):
        result = self.run_script("csdd_hook.py", {"hook_event_name": "UserPromptSubmit", "prompt": text,
                                                  "session_id": "s1", "prompt_id": prompt_id,
                                                  "cwd": str(self.project)})
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout) if result.stdout else None

    def decide(self, text, prompt_id="m1"):
        """Envía un comando de decisión: el mensaje sigue su curso y el resultado llega a ambos."""
        output = self.prompt(text, prompt_id)
        self.assertNotIn("decision", output)
        message = output["systemMessage"]
        self.assertTrue(message.startswith("CSDD: "))
        self.assertIn(message[len("CSDD: "):], output["hookSpecificOutput"]["additionalContext"])
        return message

    def status(self):
        return next(line for line in self.text(GENESIS).split("\n") if line.startswith("status:"))

    def test_approve_command_runs_without_model(self):
        self.candidate()
        message = self.decide("/csdd-approve Ana Pérez")
        self.assertRegex(message, "^CSDD: Registrado: Genesis aprobado por Ana Pérez")
        self.assertEqual(self.status(), "status: approved")
        self.assertIn("stage: closed", self.text(GENESIS))
        self.assertIn("[G-001 · acordado · dominio]", self.text(GLOSSARY))
        record = json.loads(next((self.state / "decisions").glob("*.json")).read_text(encoding="utf-8"))
        self.assertEqual((record["session_id"], record["prompt_id"]), ("s1", "m1"))

    def test_reject_command_parses_name_and_reason(self):
        self.candidate()
        self.assertIn("Registrado:", self.decide("/csdd-reject Ana Pérez: no cubre: el caso"))
        self.assertEqual(self.status(), "status: rejected")
        self.assertIn("Motivo: no cubre: el caso", self.text(GENESIS))

    def test_refused_commands_explain_and_do_not_write(self):
        self.candidate()
        before = self.text(GENESIS)
        for prompt, pattern in (("/csdd-approve", "nombre"), ("/csdd-approve Ana\nvarias", "solo tu nombre"),
                                ("/csdd-reject", "motivo"), ("/csdd-reject Ana sin motivo", "motivo")):
            with self.subTest(prompt=prompt):
                message = self.decide(prompt)
                self.assertIn("No se registró", message)
                self.assertRegex(message, pattern)
                self.assertEqual(self.text(GENESIS), before)
        self.put(GENESIS, before.replace("Contenido de Resumen", "Otro"))
        self.assertIn("cambió después de la revisión", self.decide("/csdd-approve Ana"))
        self.assertEqual(self.status(), "status: pending")

    def test_quoted_command_is_not_a_decision(self):
        self.candidate()
        for prompt in ("dijo /csdd-approve Ana", "/csdd-approved Ana", "apruebo"):
            self.assertIsNone(self.prompt(prompt))
        self.assertEqual(self.status(), "status: pending")

    def test_result_reaches_model_in_the_same_turn_only(self):
        self.candidate()
        self.assertIn("aprobado por Ana", self.decide("/csdd-approve Ana"))
        self.assertIsNone(self.prompt("seguimos"))

    def interrupt_decision(self):
        """Deja constancia y señal, como una aprobación cortada antes de escribir documentos."""
        self.candidate()
        sys.modules.pop("csdd_doc", None)
        import csdd_doc
        original = csdd_doc.write_atomic

        def failing(path, text):
            if path.name == "glossary.md":
                raise OSError("interrumpido")
            original(path, text)
        with mock.patch.object(csdd_doc, "write_atomic", failing), self.assertRaises(OSError):
            csdd_doc.approve(self.project, "Ana", "s1", "m1")

    def test_regular_prompt_completes_interrupted_decision(self):
        self.interrupt_decision()
        output = self.prompt("seguimos")
        self.assertIn("aprobado por Ana", output["systemMessage"])
        self.assertIn("interrumpida", output["hookSpecificOutput"]["additionalContext"])
        self.assertEqual(self.status(), "status: approved")
        self.assertFalse((self.state / "pending").exists())

    def test_command_completes_interrupted_decision_without_new_decision(self):
        self.interrupt_decision()
        self.assertIn("este comando no se ejecutó", self.decide("/csdd-reject Otra: cambio de idea"))
        self.assertEqual(self.status(), "status: approved")

    def test_unrecoverable_decision_warns_and_lets_person_talk(self):
        self.interrupt_decision()
        self.put(GENESIS, self.text(GENESIS).replace("Contenido de Resumen", "Otro"))
        output = self.prompt("qué pasó")
        self.assertIn("sin completar", output["systemMessage"])
        self.assertIn("No continúes", output["hookSpecificOutput"]["additionalContext"])
        self.assertTrue((self.state / "pending").exists())

    # Flujo completo

    def apply_edit(self, relative, old, new):
        """Pasa la edición por la guarda como Canon, la aplica y ejecuta PostToolUse."""
        self.assert_allowed(self.edit(relative, old, new))
        self.put(relative, self.text(relative).replace(old, new))
        self.assertEqual(self.post_tool(relative).returncode, 0)

    def review(self, verdict):
        command = f"python3 .claude/csdd/scripts/csdd_review.py record {verdict}"
        self.assert_allowed(self.bash(command, REVIEWER))
        self.cli("csdd_review.py", "record", verdict)

    def test_full_genesis_flow(self):
        self.prompt("Quiero un sistema de créditos")
        self.assert_allowed(self.bash('python3 .claude/csdd/scripts/csdd_doc.py new "Demo"'))
        self.skeleton()
        for line in self.text(GENESIS).partition("\n## Decisión Humana")[0].split("\n"):
            if line.startswith("## "):
                self.apply_edit(GENESIS, line + "\n", f"{line}\n\nContenido de {line[3:]}.\n")
        self.apply_edit(GLOSSARY, "## Términos Deprecados", TERM + "## Términos Deprecados")
        self.assertIn("[G-001 · propuesto · dominio]", self.text(GLOSSARY))
        self.review("non_conforming")
        self.assertIn("non_conforming", self.decide("/csdd-approve Ana"))
        self.review("conforming")
        self.apply_edit(GENESIS, "Contenido de Primer Slice.", "Ciclo de crédito.")
        self.assertIn("cambió después", self.decide("/csdd-approve Ana"))
        self.review("conforming")
        self.assertIn("aprobado por Ana", self.decide("/csdd-approve Ana"))
        self.assertIn("[G-001 · acordado · dominio]", self.text(GLOSSARY))
        self.cli("csdd_check.py", "docs")
        self.cli("csdd_doc.py", "status")
        self.assertIn("ya tiene una decisión", self.decide("/csdd-approve Ana"))
        self.assert_denied(self.edit(GENESIS, "Ciclo de crédito.", "Otro."), "ya tiene una decisión")

    def run_review(self, *args):
        return subprocess.run([sys.executable, str(self.scripts / "csdd_review.py"), *args], cwd=self.project,
                              env=self.environment, capture_output=True, text=True)

    def test_review_reports_empty_sections_and_refuses_conforming(self):
        self.candidate()
        self.put(GENESIS, self.text(GENESIS).replace("Contenido de Readiness De La IA.", ""))
        status = self.run_review("status")
        self.assertIn("Secciones obligatorias vacías: Readiness De La IA.", status.stdout)
        before = self.text(".claude/csdd/state/review/review.json")
        refused = self.run_review("record", "conforming")
        self.assertNotEqual(refused.returncode, 0)
        self.assertIn("No se registró el veredicto", refused.stderr)
        self.assertEqual(self.text(".claude/csdd/state/review/review.json"), before)
        self.assertEqual(self.run_review("record", "non_conforming").returncode, 0)

    # Registro de mensajes

    def test_messages_are_logged(self):
        self.prompt("hola", "m1")
        result = self.run_script("csdd_hook.py", {"hook_event_name": "Stop", "session_id": "s1",
                                                  "last_assistant_message": "¿qué necesitas?"})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.prompt("un simulador", "m2")
        self.run_script("csdd_hook.py", {"hook_event_name": "Stop", "session_id": "s1"})
        lines = [json.loads(line) for line in (self.state / "messages.jsonl").read_text(encoding="utf-8").splitlines()]
        self.assertEqual([(e["role"], e["text"]) for e in lines],
                         [("human", "hola"), ("assistant", "¿qué necesitas?"), ("human", "un simulador")])
        self.assertEqual(lines[2]["prompt_id"], "m2")

    # Instalación

    def test_installed_settings_invoke_the_scripts(self):
        settings = json.loads(self.text(".claude/settings.json"))["hooks"]
        self.assertEqual(sorted(settings), ["PostToolUse", "PreToolUse", "Stop", "UserPromptSubmit"])
        commands = [hook["command"] for entries in settings.values() for entry in entries for hook in entry["hooks"]]
        for command in commands:
            script = command.split('"')[1].replace("$CLAUDE_PROJECT_DIR/", "")
            self.assertTrue((self.project / script).exists(), script)
        self.assertEqual(list(self.scripts.glob("__pycache__")), [])


if __name__ == "__main__":
    unittest.main()
