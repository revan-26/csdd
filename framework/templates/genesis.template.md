# Referencia Estructural: genesis

Generada desde genesis.contract.json (genesis-structure-2). No editar esta referencia ni copiar placeholders al producto. La validez estructural no demuestra fidelidad semántica o autoridad.

## Entrada Mínima De Ejemplo

```json
{
  "title": "<title>",
  "sections": {
    "summary": "Síntesis de intención, resultado y límites.",
    "intent": "Problema, resultado buscado e insumos humanos.",
    "interpretation": "Propósito, actores, flujos, alcance, exclusiones e inferencias separadas.",
    "vocabulary": "Términos y límites; no inventar significado.",
    "first_slice": "Outcome, comportamientos, incluidos/excluidos, cierre y aprendizaje.",
    "uncertainties": "Bloqueantes, diferidos y riesgos; señalar ausencia cuando corresponda.",
    "next_phase": "Alcance autorizado o ausencia de autorización; no iniciar Ontology.",
    "provenance": "Separar intención humana, inferencia, investigación, decisión y diferimiento.",
    "readiness": "Suficiencia para el encargo y límites; no declarar autorización inexistente."
  },
  "decision": {
    "status": "pending"
  },
  "materialization": {
    "stage": "pending"
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
    "sections",
    "decision",
    "materialization"
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
        "summary",
        "intent",
        "interpretation",
        "vocabulary",
        "first_slice",
        "uncertainties",
        "next_phase",
        "provenance",
        "readiness"
      ],
      "properties": {
        "summary": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Síntesis de intención, resultado y límites."
        },
        "intent": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Problema, resultado buscado e insumos humanos."
        },
        "interpretation": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Propósito, actores, flujos, alcance, exclusiones e inferencias separadas."
        },
        "vocabulary": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Términos y límites; no inventar significado."
        },
        "first_slice": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Outcome, comportamientos, incluidos/excluidos, cierre y aprendizaje."
        },
        "first_release": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Solo si se discutió; no inventar FR."
        },
        "research_decisions": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Solo investigación o decisiones pertinentes, con procedencia."
        },
        "uncertainties": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Bloqueantes, diferidos y riesgos; señalar ausencia cuando corresponda."
        },
        "next_phase": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Alcance autorizado o ausencia de autorización; no iniciar Ontology."
        },
        "provenance": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Separar intención humana, inferencia, investigación, decisión y diferimiento."
        },
        "readiness": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Suficiencia para el encargo y límites; no declarar autorización inexistente."
        }
      }
    },
    "decision": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "status"
      ],
      "properties": {
        "status": {
          "type": "string",
          "enum": [
            "pending",
            "approved",
            "rejected"
          ]
        },
        "approved_by": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^\\r\\n]+$"
        },
        "approved_at": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^\\r\\n]+$"
        },
        "approved_content_reference": {
          "type": "string",
          "pattern": "^sha256:[a-f0-9]{64}$"
        },
        "approval_reference": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^\\r\\n]+$"
        },
        "rejected_by": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^\\r\\n]+$"
        },
        "rejected_at": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^\\r\\n]+$"
        },
        "rejection_reference": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^\\r\\n]+$"
        },
        "decision_notes": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "status": {
                "const": "approved"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "required": [
              "approved_by",
              "approved_at",
              "approved_content_reference",
              "approval_reference"
            ],
            "not": {
              "anyOf": [
                {
                  "required": [
                    "rejected_by"
                  ]
                },
                {
                  "required": [
                    "rejected_at"
                  ]
                },
                {
                  "required": [
                    "rejection_reference"
                  ]
                }
              ]
            }
          }
        },
        {
          "if": {
            "properties": {
              "status": {
                "const": "rejected"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "required": [
              "rejected_by",
              "rejected_at",
              "rejection_reference"
            ],
            "not": {
              "anyOf": [
                {
                  "required": [
                    "approved_by"
                  ]
                },
                {
                  "required": [
                    "approved_at"
                  ]
                },
                {
                  "required": [
                    "approved_content_reference"
                  ]
                },
                {
                  "required": [
                    "approval_reference"
                  ]
                }
              ]
            }
          }
        },
        {
          "if": {
            "properties": {
              "status": {
                "const": "pending"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "not": {
              "anyOf": [
                {
                  "required": [
                    "approved_by"
                  ]
                },
                {
                  "required": [
                    "approved_at"
                  ]
                },
                {
                  "required": [
                    "approved_content_reference"
                  ]
                },
                {
                  "required": [
                    "approval_reference"
                  ]
                },
                {
                  "required": [
                    "rejected_by"
                  ]
                },
                {
                  "required": [
                    "rejected_at"
                  ]
                },
                {
                  "required": [
                    "rejection_reference"
                  ]
                }
              ]
            }
          }
        }
      ]
    },
    "materialization": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "stage"
      ],
      "properties": {
        "stage": {
          "type": "string",
          "enum": [
            "pending",
            "closed"
          ]
        },
        "disposition": {
          "type": "string",
          "enum": [
            "abandoned"
          ]
        },
        "genesis_reference": {
          "type": "string",
          "pattern": "^sha256:[a-f0-9]{64}$"
        },
        "glossary_reference": {
          "type": "string",
          "pattern": "^sha256:[a-f0-9]{64}$"
        },
        "review_reference": {
          "type": "string",
          "minLength": 1,
          "pattern": "^[^\\r\\n]+$"
        },
        "review_verdict": {
          "type": "string",
          "enum": [
            "conforming",
            "non_conforming",
            "insufficient_evidence"
          ]
        },
        "checks": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "limitations": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        },
        "notes": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "stage": {
                "const": "closed"
              }
            },
            "required": [
              "stage"
            ]
          },
          "then": {
            "required": [
              "genesis_reference",
              "glossary_reference",
              "review_reference",
              "review_verdict",
              "checks",
              "limitations"
            ],
            "not": {
              "anyOf": [
                {
                  "required": [
                    "disposition"
                  ]
                }
              ]
            }
          }
        }
      ]
    }
  }
}
```

## Markdown Derivado De Ejemplo

```markdown
# <title>

## Resumen Ejecutivo

Síntesis de intención, resultado y límites.

## Intención De Origen

Problema, resultado buscado e insumos humanos.

## Interpretación Del Producto

Propósito, actores, flujos, alcance, exclusiones e inferencias separadas.

## Vocabulario Inicial

Términos y límites; no inventar significado.

## Primer Slice

Outcome, comportamientos, incluidos/excluidos, cierre y aprendizaje.

## Incertidumbres Y Riesgos

Bloqueantes, diferidos y riesgos; señalar ausencia cuando corresponda.

## Siguiente Fase

Alcance autorizado o ausencia de autorización; no iniciar Ontology.

## Procedencia

Separar intención humana, inferencia, investigación, decisión y diferimiento.

## Readiness De La IA

Suficiencia para el encargo y límites; no declarar autorización inexistente.

## Decisión Humana

status: pending

## Materialización

stage: pending
```
