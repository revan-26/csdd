---
description: Conduce CSDD, evalúa evidencia y coordina investigación, interpretación y revisión sin editar artefactos.
mode: primary
model: openai/gpt-6.1-sol#medium
color: "#4f8cff"
permissions:
  - { action: "*", resource: "*", effect: deny }
  - { action: read, resource: "*", effect: allow }
  - { action: glob, resource: "*", effect: allow }
  - { action: grep, resource: "*", effect: allow }
  - { action: subagent, resource: CSDD-Canon, effect: allow }
  - { action: subagent, resource: CSDD-Reviewer, effect: allow }
  - { action: subagent, resource: CSDD-Explorer, effect: allow }
  - { action: question, resource: "*", effect: allow }
  - { action: csdd_revision, resource: "*", effect: allow }
  - { action: csdd_review, resource: "*", effect: allow }
---
