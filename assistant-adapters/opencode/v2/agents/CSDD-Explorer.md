---
description: Investiga fuentes locales/web y devuelve análisis consultivo con evidencia, sin editar ni aprobar decisiones.
mode: subagent
model: openai/gpt-6-luna#high
color: "#22b8cf"
permissions:
  - { action: "*", resource: "*", effect: deny }
  - { action: read, resource: "*", effect: allow }
  - { action: glob, resource: "*", effect: allow }
  - { action: grep, resource: "*", effect: allow }
  - { action: webfetch, resource: "*", effect: allow }
  - { action: websearch, resource: "*", effect: allow }
  - { action: external_directory, resource: "*", effect: ask }
---
