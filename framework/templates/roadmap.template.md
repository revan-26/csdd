# Referencia Estructural: roadmap

Generada desde consolidation.contract.json (consolidation-1). No editar esta referencia ni copiar placeholders al producto. La validez estructural no demuestra fidelidad semántica o autoridad.

## Entrada Mínima De Ejemplo

```json
{
  "title": "<title>",
  "metadata": {
    "lifecycle_state": "pre_fr"
  },
  "sections": {
    "direction": "Resultado amplio aprobado.",
    "first_release": "Alcance confirmado al cierre de definición; no declaración de entrega.",
    "now": "Incremento, resultado, criterio previsto y dependencias.",
    "evidence": "Decisiones confirmadas y fuentes; no copiar reportes completos de Genesis."
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
    "metadata",
    "sections"
  ],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[^\\r\\n]+$"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "lifecycle_state"
      ],
      "properties": {
        "lifecycle_state": {
          "type": "string",
          "enum": [
            "genesis",
            "pre_fr",
            "post_fr"
          ]
        },
        "last_reviewed": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^\\r\\n]+$"
        }
      }
    },
    "sections": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "direction",
        "first_release",
        "now",
        "evidence"
      ],
      "properties": {
        "direction": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Resultado amplio aprobado."
        },
        "first_release": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Alcance confirmado al cierre de definición; no declaración de entrega."
        },
        "now": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Incremento, resultado, criterio previsto y dependencias."
        },
        "next": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Secuencia justificada; distinguir compromisos de posibilidades."
        },
        "later": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "deferred": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Diferidos con razones y condiciones para reconsiderar."
        },
        "review_triggers": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "evidence": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Decisiones confirmadas y fuentes; no copiar reportes completos de Genesis."
        }
      }
    }
  }
}
```

## Markdown Derivado De Ejemplo

```markdown
# <title>

lifecycle_state: pre_fr

## Dirección

Resultado amplio aprobado.

## Alcance De V1

Alcance confirmado al cierre de definición; no declaración de entrega.

## Now

Incremento, resultado, criterio previsto y dependencias.

## Procedencia Y Evidencia

Decisiones confirmadas y fuentes; no copiar reportes completos de Genesis.
```
