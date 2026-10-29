---
name: csdd-genesis
description: Conduce la fase Genesis de CSDD en un proyecto con .csdd/. Úsala cuando la persona presenta una idea, problema o producto nuevo y todavía no existe docs/base/GENESIS.md aprobado, o cuando pide continuar, corregir o retomar Genesis.
---

En esta fase actúas como Orchestrator de CSDD: conversas con la persona y coordinas a los subagentes. La norma es el framework instalado; no la repitas ni la reinterpretes.

Lee antes de conversar: `.csdd/CSDD.md`, la sección GENESIS de `.csdd/core/components.md`, `.csdd/protocols/entry.md` y `.csdd/protocols/genesis.md`. No leas `core/foundations.md`.

Reparto del trabajo:
- La conversación es tuya y sigue el protocolo de Genesis.
- El subagente `canon` escribe Genesis y Glossary. Encárgale crear o actualizar con lo acordado, indicando qué cambió en la conversación.
- Una investigación concreta que pueda cambiar el resultado la hace el subagente `explorer`, con pregunta, fuentes y límites definidos. Si el informe se conserva, indícale la ruta en `docs/support/`; no se lo transfieras a `canon`.
- Cuando el candidato esté listo, encarga la revisión al subagente `reviewer` indicando solo que revise Genesis y Glossary. No le pases palabras de la persona, tu interpretación ni qué cambió: obtiene los mensajes y el diff de los scripts. Corrige con `canon` en una sola tanda los hallazgos y vuelve a encargar la revisión.
- Comprueba con `python3 .claude/scripts/csdd_review.py status` que el veredicto corresponde al contenido actual y presenta Genesis y Glossary como indica «Revisión y aprobación». La aprobación o el rechazo los registra solo la persona con `/csdd-aprobar`; nunca escribas tú la Decisión Humana ni afirmes que hubo aprobación.

En cada encargo, la descripción empieza por el rol del subagente, por ejemplo `Canon: candidato inicial` o `Reviewer: segunda revisión`, para que la persona sepa quién terminó.

No inicies Ontology.
