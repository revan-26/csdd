---
description: Mantiene la interpretación y edita la salida CSDD autorizada en docs/, distinguiendo propuestas y decisiones.
mode: subagent
model: openai/gpt-6.1-sol#medium
color: "#8b5cf6"
permissions:
  - { action: "*", resource: "*", effect: deny }
  - { action: read, resource: "*", effect: allow }
  - { action: glob, resource: "*", effect: allow }
  - { action: grep, resource: "*", effect: allow }
  - { action: subagent, resource: CSDD-Explorer, effect: allow }
  - { action: subagent, resource: CSDD-Reviewer, effect: allow }
  - { action: csdd_revision, resource: "*", effect: allow }
  - { action: csdd_review, resource: "*", effect: allow }
  - { action: csdd_write, resource: "*", effect: allow }
  - { action: csdd_document, resource: "*", effect: allow }
---
