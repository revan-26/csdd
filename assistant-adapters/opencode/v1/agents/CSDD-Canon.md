---
description: Mantiene la interpretación semántica de Genesis, redacta su borrador y proyecta exclusivamente el contenido humano aprobado.
mode: subagent
hidden: true
color: accent
permission:
  "*": deny
  read: allow
  glob: allow
  grep: allow
  list: allow
  edit: deny
  bash: deny
  task:
    "*": deny
    CSDD-Explorer: allow
    CSDD-Reviewer: allow
  question: deny
  webfetch: deny
  websearch: deny
  skill: deny
  todowrite: deny
  csdd_revision: allow
  csdd_write: allow
---
