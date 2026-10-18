---
description: Verifica artefactos y evidencia CSDD independientemente, sin escribir ni aprobar el producto.
mode: subagent
model: openai/gpt-6.1-sol#medium
color: "#f59e0b"
permissions:
  - { action: "*", resource: "*", effect: deny }
  - { action: read, resource: "*", effect: allow }
  - { action: glob, resource: "*", effect: allow }
  - { action: grep, resource: "*", effect: allow }
  - { action: csdd_revision, resource: "*", effect: allow }
  - { action: csdd_review, resource: "*", effect: allow }
---
