"""Imprime los mensajes de la persona en la sesión más reciente de este proyecto.

Busca en ~/.claude/projects el transcript .jsonl más reciente cuyo cwd es el directorio actual.
Cada mensaje va precedido del último texto del asistente al que responde, para que respuestas
como «A» o «justo lo que describes» puedan interpretarse.
"""
import json
import os
import pathlib

CONTEXT_LIMIT = 4000
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
    raise SystemExit("No se encontró un transcript de este proyecto")


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


def main():
    path = latest_transcript(os.getcwd())
    print(f"Transcript: {path.name}\n")
    for n, (stamp, context, text) in enumerate(human_messages(path), 1):
        print(f"## Mensaje {n} ({stamp})\n")
        if context:
            if len(context) > CONTEXT_LIMIT:
                context = context[:CONTEXT_LIMIT] + " […]"
            print(f"### Responde a (asistente)\n\n{context}\n")
        print(f"### Persona\n\n{text}\n")


if __name__ == "__main__":
    main()
