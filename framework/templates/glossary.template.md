# Referencia Estructural: glossary

Generada desde genesis.contract.json (genesis-structure-2). No editar esta referencia ni copiar placeholders al producto. La validez estructural no demuestra fidelidad semántica o autoridad.

## Entrada Mínima De Ejemplo

```json
{
  "title": "<title>",
  "terms": [
    {
      "term": "<term>",
      "definition": "<definition>"
    }
  ]
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
    "terms"
  ],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[^\\r\\n]+$"
    },
    "purpose": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S"
    },
    "terms": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "term",
          "definition"
        ],
        "properties": {
          "term": {
            "type": "string",
            "minLength": 1,
            "pattern": "^[^\\r\\n]+$"
          },
          "definition": {
            "type": "string",
            "minLength": 1,
            "pattern": "\\S"
          },
          "scope": {
            "type": "string",
            "minLength": 1,
            "pattern": "\\S"
          },
          "category": {
            "type": "string",
            "minLength": 1,
            "pattern": "\\S"
          },
          "limits": {
            "type": "string",
            "minLength": 1,
            "pattern": "\\S"
          }
        }
      }
    },
    "deprecated_terms": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S"
    }
  }
}
```

## Markdown Derivado De Ejemplo

```markdown
# <title>

## Términos

### <term>

#### Definición

<definition>
```
