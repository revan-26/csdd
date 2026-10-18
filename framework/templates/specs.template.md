# Referencia Estructural: specs

Generada desde consolidation.contract.json (consolidation-1). No editar esta referencia ni copiar placeholders al producto. La validez estructural no demuestra fidelidad semántica o autoridad.

## Entrada Mínima De Ejemplo

```json
{
  "title": "<title>",
  "sections": {
    "purpose": "<purpose>",
    "scope": "Incluidos y excluidos aprobados.",
    "actors_outcomes": "<actors_outcomes>",
    "behaviors": "<behaviors>",
    "rules": "Síntesis y referencias; no duplicar reglas detalladas.",
    "v1_scope": "<v1_scope>",
    "architecture": "<architecture>",
    "references": "Dominios, contratos, arquitectura, ADR y mappings pertinentes."
  }
}
```

## Contrato Completo

Incluye campos opcionales y condiciones. Solo añadir contenido aplicable y autorizado.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "title",
    "sections"
  ],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[^\\r\\n]+$"
    },
    "sections": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "purpose",
        "scope",
        "actors_outcomes",
        "behaviors",
        "rules",
        "v1_scope",
        "architecture",
        "references"
      ],
      "properties": {
        "purpose": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "scope": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Incluidos y excluidos aprobados."
        },
        "actors_outcomes": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "behaviors": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "rules": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Síntesis y referencias; no duplicar reglas detalladas."
        },
        "v1_scope": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "architecture": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "references": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Dominios, contratos, arquitectura, ADR y mappings pertinentes."
        },
        "semantic_model": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "constraints": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "integrations": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Solo si pertenecen al alcance actual."
        }
      }
    }
  }
}
```

## Markdown Derivado De Ejemplo

```markdown
# <title>

## Propósito

<purpose>

## Alcance

Incluidos y excluidos aprobados.

## Actores Y Outcomes

<actors_outcomes>

## Comportamientos Observables

<behaviors>

## Reglas E Invariantes Vigentes

Síntesis y referencias; no duplicar reglas detalladas.

## Alcance Acordado De V1

<v1_scope>

## Síntesis De Arquitectura

<architecture>

## Fuentes De Definición

Dominios, contratos, arquitectura, ADR y mappings pertinentes.
```
