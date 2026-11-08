"""Imprime los mensajes de la persona en este proyecto.

La fuente principal es .claude/csdd/state/messages.jsonl, que escriben los hooks. Si a algunos
mensajes les falta el texto del asistente, por ejemplo tras un turno interrumpido, lo sigue
usando y lo indica. Si falta o no trae ningún texto del asistente, usa como respaldo el
transcript .jsonl más reciente de ~/.claude/projects cuyo cwd es el directorio actual, y lo
indica: su formato es interno de Claude Code y solo cubre la sesión más reciente.

Cada mensaje va precedido del último texto del asistente al que responde, para que respuestas
como «A» o «justo lo que describes» puedan interpretarse.
"""
import json
import os
import pathlib
import re

LOG = pathlib.Path(".claude/csdd/state/messages.jsonl")
NOT_INTENT = re.compile(r"^/(csdd-approve|csdd-reject)\b|^/\S+$")
SKIPPED_PREFIXES = ("<command-", "<local-command", "<task-notification")


def entries(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def belongs_here(path, cwd):
    return any(entry.get("cwd") == cwd for entry in entries(path))


def latest_transcript(cwd):
    root = pathlib.Path.home() / ".claude" / "projects"
    candidates = sorted(root.glob("*/*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)
    for path in candidates:
        if belongs_here(path, cwd):
            return path
    return None


def assistant_text(content):
    if not isinstance(content, list):
        return ""
    texts = [block.get("text", "") for block in content if block.get("type") == "text"]
    return texts[-1].strip() if texts else ""


def human_messages(path):
    context = ""
    for entry in entries(path):
        if entry.get("isMeta") or entry.get("isSidechain"):
            continue
        content = entry.get("message", {}).get("content")
        if entry.get("type") == "assistant":
            context = assistant_text(content) or context
            continue
        if entry.get("type") != "user" or not isinstance(content, str):
            continue
        text = content.strip()
        if text and not text.startswith(SKIPPED_PREFIXES):
            yield entry.get("timestamp", ""), context, text
            context = ""


def logged_messages(path):
    """Devuelve los mensajes del registro y cuántos, salvo el primero, no traen texto del asistente."""
    messages, context, missing = [], "", 0
    for entry in entries(path):
        text = (entry.get("text") or "").strip()
        if entry.get("role") == "assistant":
            context = text or context
        elif entry.get("role") == "human" and text and not NOT_INTENT.match(text):
            missing += bool(messages) and not context
            messages.append((entry.get("at", ""), context, text))
            context = ""
    return messages, missing


def select_messages(log, cwd):
    """Elige la fuente. Devuelve (descripción de la fuente, mensajes)."""
    logged, missing = logged_messages(log) if log.exists() else ([], 0)
    if logged and not missing:
        return "registro de hooks", logged
    note = f"registro de hooks; {missing} mensaje(s) sin el texto del asistente al que responden"
    if any(context for _, context, _ in logged):
        return note, logged
    transcript = latest_transcript(cwd)
    if transcript is not None:
        return (f"transcript {transcript.name} (respaldo: formato interno de Claude Code, "
                "solo la sesión más reciente)"), list(human_messages(transcript))
    if logged:
        return note, logged
    raise SystemExit("No hay registro de mensajes ni transcript de este proyecto")


def main():
    source, messages = select_messages(LOG, os.getcwd())
    print(f"Fuente: {source}\n")
    for n, (stamp, context, text) in enumerate(messages, 1):
        print(f"## Mensaje {n} ({stamp})\n")
        if context:
            print(f"### Responde a (asistente)\n\n{context}\n")
        print(f"### Persona\n\n{text}\n")


if __name__ == "__main__":
    main()
