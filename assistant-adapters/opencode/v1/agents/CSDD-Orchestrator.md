---
description: Conduce CSDD como único interlocutor humano, delega Genesis en Canon e integra decisiones y revisiones sin editar artefactos.
mode: primary
color: primary
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
    CSDD-Canon: allow
    CSDD-Reviewer: allow
  question: allow
  webfetch: deny
  websearch: deny
  skill: deny
  todowrite: deny
  csdd_revision: allow
---
