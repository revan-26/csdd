"""Pruebas de coherencia de skills y agentes, y de la selección de mensajes humanos."""
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
ROOT = pathlib.Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "integration" / "claude-code"
SCRIPTS = INTEGRATION / "csdd" / "scripts"
sys.path[:0] = [str(ROOT / "tools"), str(SCRIPTS)]

import csdd_guard  # noqa: E402


def frontmatter(path):
    block = path.read_text(encoding="utf-8").split("---\n")[1]
    return dict(line.split(": ", 1) for line in block.strip().split("\n"))


class ComponentsTest(unittest.TestCase):
    def agent(self, name):
        return frontmatter(INTEGRATION / "agents" / f"{name}.md")

    def test_agent_names_match_guard(self):
        names = {path.stem for path in (INTEGRATION / "agents").glob("*.md")}
        self.assertEqual(names, {csdd_guard.CANON, csdd_guard.REVIEWER, csdd_guard.EXPLORER})
        for name in names:
            self.assertEqual(self.agent(name)["name"], name)

    def test_agent_tools_follow_roles(self):
        canon = self.agent(csdd_guard.CANON)["tools"]
        self.assertIn("Edit", canon)
        self.assertNotIn("Write", canon)
        self.assertNotIn("Bash", canon)
        reviewer = self.agent(csdd_guard.REVIEWER)["tools"]
        self.assertIn("Bash", reviewer)
        self.assertNotIn("Edit", reviewer)
        self.assertNotIn("Write", reviewer)

    def test_decision_skills_cannot_be_invoked_by_the_model(self):
        for name in ("csdd-approve", "csdd-reject"):
            data = frontmatter(INTEGRATION / "skills" / name / "SKILL.md")
            self.assertEqual(data["name"], name)
            self.assertEqual(data["disable-model-invocation"], "true")

    def test_skill_names_match_their_folders(self):
        for path in (INTEGRATION / "skills").glob("*/SKILL.md"):
            self.assertEqual(frontmatter(path)["name"], path.parent.name)

    def test_instructions_cite_existing_scripts_with_allowed_commands(self):
        command = re.compile(r"python3 \.claude/csdd/scripts/[^`]+")
        found = 0
        for path in [*(INTEGRATION / "agents").glob("*.md"), *(INTEGRATION / "skills").glob("*/SKILL.md")]:
            agent = csdd_guard.REVIEWER if path.stem == csdd_guard.REVIEWER else None
            for text in command.findall(path.read_text(encoding="utf-8")):
                found += 1
                concrete = text.replace("<veredicto>", "conforming").replace("<nombre del proyecto>", "Demo")
                self.assertTrue(csdd_guard.allowed_script(concrete, agent, ROOT), f"{path.name}: {text}")
        self.assertGreater(found, 5)

    def test_old_names_are_gone(self):
        old = re.compile(r"csdd-aprobar|subagente `(canon|reviewer|explorer)`")
        for path in INTEGRATION.rglob("*"):
            if path.is_file() and path.suffix in (".md", ".py", ".json"):
                self.assertIsNone(old.search(path.read_text(encoding="utf-8")), path)


class HumanMessagesTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        root = pathlib.Path(self.temp.name).resolve()
        self.project = root / "project"
        self.home = root / "home"
        (self.project / ".claude" / "csdd" / "state").mkdir(parents=True)
        self.log = self.project / ".claude" / "csdd" / "state" / "messages.jsonl"

    def tearDown(self):
        self.temp.cleanup()

    def write_log(self, *entries):
        self.log.write_text("".join(json.dumps(dict(zip(("role", "text"), e))) + "\n" for e in entries), encoding="utf-8")

    def write_transcript(self):
        folder = self.home / ".claude" / "projects" / "x"
        folder.mkdir(parents=True)
        lines = [
            {"type": "user", "cwd": str(self.project), "message": {"content": "del transcript"}},
            {"type": "assistant", "message": {"content": [{"type": "text", "text": "¿qué más?"}]}},
            {"type": "user", "message": {"content": "respuesta del transcript"}},
        ]
        (folder / "sesion.jsonl").write_text("".join(json.dumps(l) + "\n" for l in lines), encoding="utf-8")

    def run_script(self):
        environment = {**os.environ, "HOME": str(self.home), "PYTHONDONTWRITEBYTECODE": "1"}
        return subprocess.run([sys.executable, str(SCRIPTS / "human_messages.py")], cwd=self.project,
                              env=environment, capture_output=True, text=True)

    def test_log_is_primary_source(self):
        self.write_transcript()
        self.write_log(("human", "hola"), ("assistant", "¿qué necesitas?"), ("human", "un simulador"))
        output = self.run_script().stdout
        self.assertIn("Fuente: registro de hooks\n", output)
        self.assertIn("### Responde a (asistente)\n\n¿qué necesitas?", output)
        self.assertIn("### Persona\n\nun simulador", output)
        self.assertNotIn("del transcript", output)

    def test_decision_and_bare_commands_are_not_intent(self):
        self.write_log(("human", "hola"), ("assistant", "¿sí?"), ("human", "/csdd-approve Ana"), ("human", "/clear"))
        output = self.run_script().stdout
        self.assertEqual(output.count("### Persona"), 1)
        self.assertNotIn("csdd-approve", output)

    def test_transcript_is_labelled_fallback(self):
        self.write_transcript()
        output = self.run_script().stdout
        self.assertIn("Fuente: transcript sesion.jsonl (respaldo", output)
        self.assertIn("respuesta del transcript", output)

    def test_log_without_assistant_text_prefers_transcript(self):
        self.write_transcript()
        self.write_log(("human", "uno"), ("human", "dos"))
        self.assertIn("(respaldo", self.run_script().stdout)

    def test_log_without_assistant_text_and_without_transcript_says_so(self):
        self.write_log(("human", "uno"), ("human", "dos"))
        self.assertIn("sin el texto del asistente", self.run_script().stdout)

    def test_log_with_one_interrupted_turn_stays_primary(self):
        self.write_transcript()
        self.write_log(("human", "hola"), ("assistant", "¿qué necesitas?"), ("human", "un simulador"),
                       ("human", "para clase"))
        output = self.run_script().stdout
        self.assertIn("Fuente: registro de hooks; 1 mensaje(s) sin el texto del asistente", output)
        self.assertIn("para clase", output)
        self.assertNotIn("del transcript", output)

    def test_no_source_fails(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 1)
        self.assertIn("No hay registro", result.stderr)


if __name__ == "__main__":
    unittest.main()
