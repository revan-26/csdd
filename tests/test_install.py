"""Pruebas del instalador sobre un origen de prueba y sobre el repositorio real."""
import contextlib
import io
import json
import pathlib
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import install  # noqa: E402

HOOK = {"matcher": "Write|Edit",
        "hooks": [{"type": "command", "command": 'python3 "$CLAUDE_PROJECT_DIR/.claude/csdd/scripts/guard.py"'}]}
USER_HOOK = {"matcher": "Bash", "hooks": [{"type": "command", "command": "echo propio"}]}


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class InstallTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        root = pathlib.Path(self.temp.name)
        self.source = root / "source"
        self.project = root / "project"
        self.project.mkdir()
        write(self.source / "framework" / "CSDD.md", "framework\n")
        write(self.source / "framework" / "templates" / "genesis.template.md", "plantilla\n")
        write(self.source / "integration" / "claude-code" / "skills" / "csdd-genesis" / "SKILL.md", "skill\n")
        write(self.source / "integration" / "claude-code" / "csdd" / "scripts" / "csdd_hash.py", "hash\n")
        write(self.source / "tools" / "csdd_check.py", "check\n")

    def tearDown(self):
        self.temp.cleanup()

    def install(self):
        actions, conflicts, manifest, settings = install.plan(self.project, self.source)
        if not conflicts:
            install.apply(self.project, actions, manifest, settings)
        return [(a, r) for a, r, _ in actions], conflicts

    def test_fresh_install(self):
        actions, conflicts = self.install()
        self.assertEqual(conflicts, [])
        self.assertIn(("crear", ".csdd/templates/genesis.template.md"), actions)
        self.assertIn(("crear", ".claude/skills/csdd-genesis/SKILL.md"), actions)
        self.assertIn(("crear", ".claude/csdd/scripts/csdd_check.py"), actions)
        manifest = json.loads((self.project / install.MANIFEST).read_text(encoding="utf-8"))
        self.assertEqual(len(manifest["files"]), 5)
        self.assertFalse((self.project / install.SETTINGS).exists())
        self.assertFalse((self.project / "docs").exists())

    def test_update_replaces_and_removes_unmodified_files(self):
        self.install()
        write(self.source / "framework" / "CSDD.md", "framework v2\n")
        (self.source / "tools" / "csdd_check.py").unlink()
        actions, conflicts = self.install()
        self.assertEqual(conflicts, [])
        self.assertEqual(sorted(actions), [("actualizar", ".csdd/CSDD.md"),
                                           ("eliminar", ".claude/csdd/scripts/csdd_check.py")])
        self.assertEqual((self.project / ".csdd" / "CSDD.md").read_text(encoding="utf-8"), "framework v2\n")
        self.assertEqual(self.install(), ([], []))

    def test_modified_file_stops_without_writing(self):
        self.install()
        write(self.project / ".csdd" / "CSDD.md", "editado a mano\n")
        write(self.source / "framework" / "CSDD.md", "framework v2\n")
        write(self.source / "framework" / "nuevo.md", "nuevo\n")
        actions, conflicts = self.install()
        self.assertEqual(conflicts, [".csdd/CSDD.md: modificado en el proyecto desde la última instalación"])
        self.assertFalse((self.project / ".csdd" / "nuevo.md").exists())

    def test_foreign_file_conflicts_but_identical_file_is_adopted(self):
        write(self.project / ".csdd" / "CSDD.md", "framework\n")
        write(self.project / ".claude" / "skills" / "csdd-genesis" / "SKILL.md", "otra skill\n")
        actions, conflicts = self.install()
        self.assertEqual(conflicts, [".claude/skills/csdd-genesis/SKILL.md: ya existe y no fue instalado por CSDD"])

    def test_removed_file_modified_in_project_conflicts(self):
        self.install()
        write(self.project / ".claude" / "csdd" / "scripts" / "csdd_check.py", "editado\n")
        (self.source / "tools" / "csdd_check.py").unlink()
        _, conflicts = self.install()
        self.assertEqual(conflicts, [".claude/csdd/scripts/csdd_check.py: ya no forma parte de CSDD y fue modificado en el proyecto"])

    def test_settings_merge_keeps_user_configuration(self):
        write(self.source / "integration" / "claude-code" / "settings.json",
              json.dumps({"hooks": {"PreToolUse": [HOOK]}}))
        write(self.project / ".claude" / "settings.json",
              json.dumps({"model": "x", "hooks": {"PreToolUse": [USER_HOOK]}}))
        actions, conflicts = self.install()
        self.assertEqual(conflicts, [])
        self.assertIn(("configurar", ".claude/settings.json"), actions)
        self.assertNotIn(".claude/settings.json", json.loads(
            (self.project / install.MANIFEST).read_text(encoding="utf-8"))["files"])
        settings = json.loads((self.project / ".claude" / "settings.json").read_text(encoding="utf-8"))
        self.assertEqual(settings, {"model": "x", "hooks": {"PreToolUse": [USER_HOOK, HOOK]}})
        self.assertEqual(self.install(), ([], []))

    def test_settings_update_replaces_only_csdd_hooks(self):
        old = {"matcher": "Edit", "hooks": [{"type": "command", "command": "python3 .claude/csdd/scripts/old.py"}]}
        write(self.project / ".claude" / "settings.json",
              json.dumps({"hooks": {"PreToolUse": [USER_HOOK, old], "Stop": [old]}}))
        write(self.source / "integration" / "claude-code" / "settings.json",
              json.dumps({"hooks": {"PreToolUse": [HOOK]}}))
        self.install()
        settings = json.loads((self.project / ".claude" / "settings.json").read_text(encoding="utf-8"))
        self.assertEqual(settings, {"hooks": {"PreToolUse": [USER_HOOK, HOOK]}})

    def test_invalid_settings_conflicts(self):
        write(self.project / ".claude" / "settings.json", "{no es json")
        _, conflicts = self.install()
        self.assertEqual(conflicts, [".claude/settings.json: no es JSON válido"])


class RealSourceTest(unittest.TestCase):
    def run_main(self, *args):
        output = io.StringIO()
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            code = install.main(list(args))
        return code, output.getvalue()

    def test_installs_repository_and_checker_runs(self):
        with tempfile.TemporaryDirectory() as root:
            code, output = self.run_main(root, "--dry-run")
            self.assertEqual(code, 0, output)
            self.assertFalse((pathlib.Path(root) / ".csdd").exists())
            code, output = self.run_main(root)
            self.assertEqual(code, 0, output)
            project = pathlib.Path(root)
            self.assertTrue((project / ".csdd" / "templates" / "genesis.template.md").exists())
            self.assertTrue((project / ".claude" / "csdd" / "scripts" / "csdd_check.py").exists())
            sys.path.insert(0, str(project / ".claude" / "csdd" / "scripts"))
            try:
                import importlib
                checker = importlib.import_module("csdd_check")
                self.assertEqual(str(checker.find_templates(project)), str(project / ".csdd" / "templates"))
            finally:
                sys.path.pop(0)
                sys.modules.pop("csdd_check", None)
            version = json.loads((project / install.MANIFEST).read_text(encoding="utf-8"))["version"]
            self.assertEqual(self.run_main(root), (0, f"CSDD {version} ya está al día en {project.resolve()}.\n"))

    def test_refuses_source_repository(self):
        self.assertEqual(self.run_main(str(install.SOURCE))[0], 2)


if __name__ == "__main__":
    unittest.main()
