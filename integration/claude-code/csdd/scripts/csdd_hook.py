"""Hooks UserPromptSubmit, Stop y PostToolUse de CSDD.

UserPromptSubmit registra el mensaje de la persona y ejecuta /csdd-approve y /csdd-reject
sin intervención del modelo. Stop registra el último texto del asistente. PostToolUse
asigna los IDs del glosario. Un error aquí no detiene el trabajo de la persona, salvo
en los comandos de decisión, que muestran el motivo.
"""
import datetime
import json
import os
import pathlib
import re
import sys

sys.dont_write_bytecode = True

import csdd_doc
from csdd_doc import GLOSSARY, STATE, DocError

MESSAGES = STATE / "messages.jsonl"
NOTICE = STATE / "notice"
COMMAND = re.compile(r"^/(csdd-approve|csdd-reject)(?:\s+(.*))?$", re.DOTALL)


def log_message(project, role, text, payload):
    path = project / MESSAGES
    path.parent.mkdir(parents=True, exist_ok=True)
    entry = {"role": role, "at": csdd_doc.utc_now(), "session_id": payload.get("session_id"),
             "prompt_id": payload.get("prompt_id"), "text": text}
    with open(path, "a", encoding="utf-8") as log:
        log.write(json.dumps(entry, ensure_ascii=False) + "\n")


def run_decision(project, command, arguments, payload):
    session_id, prompt_id = payload.get("session_id"), payload.get("prompt_id")
    if command == "csdd-approve":
        if "\n" in arguments.strip():
            raise DocError("Indica solo tu nombre: /csdd-approve <nombre>.")
        return csdd_doc.approve(project, arguments, session_id, prompt_id)
    name, _, reason = arguments.partition(":")
    return csdd_doc.reject(project, name, reason, session_id, prompt_id)


def on_command(project, command, arguments, payload):
    """Ejecuta la decisión y bloquea el mensaje: el modelo no interviene ni lo recibe."""
    try:
        if csdd_doc.pending_id(project) is not None:
            message = "Se completó una decisión interrumpida: " + csdd_doc.recover(project)
        else:
            message = run_decision(project, command, arguments, payload)
        csdd_doc.write_atomic(project / NOTICE, message + "\n")
    except DocError as error:
        message = f"No se registró la decisión. {error}"
    except Exception as error:
        message = f"No se registró la decisión: error inesperado {error!r}."
    return {"decision": "block", "reason": f"CSDD: {message}"}


def on_regular_prompt(project):
    """Completa una decisión interrumpida e informa al modelo de lo decidido por hook."""
    context = []
    system_message = None
    if csdd_doc.pending_id(project) is not None:
        try:
            message = "Se completó una decisión interrumpida: " + csdd_doc.recover(project)
            context.append(f"CSDD: {message}")
        except DocError as error:
            message = f"Decisión interrumpida sin completar. {error}"
            context.append(f"CSDD: {message} No continúes con Genesis; informa a la persona.")
        system_message = f"CSDD: {message}"
    notice = project / NOTICE
    if notice.exists():
        context.append("CSDD registró por hook, a pedido de la persona: " + notice.read_text(encoding="utf-8").strip())
        notice.unlink()
    if not context:
        return None
    output = {"hookSpecificOutput": {"hookEventName": "UserPromptSubmit",
                                     "additionalContext": "\n".join(context)}}
    if system_message:
        output["systemMessage"] = system_message
    return output


def on_prompt(project, payload):
    prompt = payload.get("prompt", "")
    try:
        log_message(project, "human", prompt, payload)
    except OSError as error:
        print(f"CSDD: no se registró el mensaje: {error}", file=sys.stderr)
    match = COMMAND.match(prompt.strip())
    if match:
        return on_command(project, match.group(1), match.group(2) or "", payload)
    return on_regular_prompt(project)


def on_stop(project, payload):
    text = payload.get("last_assistant_message")
    if isinstance(text, str) and text.strip():
        log_message(project, "assistant", text, payload)


def on_post_tool(project, payload):
    raw = (payload.get("tool_input") or {}).get("file_path")
    if not raw or csdd_doc.project_relative(project, raw, payload.get("cwd")) != str(GLOSSARY):
        return None
    assigned = csdd_doc.assign_ids(project)
    if not assigned:
        return None
    return {"hookSpecificOutput": {
        "hookEventName": "PostToolUse",
        "additionalContext": f"CSDD asignó {', '.join(assigned)}. Relee {GLOSSARY} antes de volver a editarlo."}}


HANDLERS = {"UserPromptSubmit": on_prompt, "Stop": on_stop, "PostToolUse": on_post_tool}


def main():
    payload = json.load(sys.stdin)
    project = pathlib.Path(os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or ".")
    handler = HANDLERS.get(payload.get("hook_event_name"))
    output = handler(project, payload) if handler else None
    if output:
        print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
