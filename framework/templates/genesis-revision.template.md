# Referencia Estructural: genesis_revision

Generada desde genesis.contract.json (genesis-structure-2). No editar esta referencia ni copiar placeholders al producto. La validez estructural no demuestra fidelidad semántica o autoridad.

## Entrada Mínima De Ejemplo

```json
{
  "revision_id": "revision_1",
  "sections": {
    "reason_scope": "Motivo fundamental y consulta histórica justificada.",
    "proposed_change": "Acuerdos sustituidos, cambio exacto y límites.",
    "impacts": "Cambios autorizados sobre fuentes actuales; conservar evolución ajena.",
    "provenance_pending": "Evidencia, decisiones y condiciones abiertas; no reiniciar lifecycle."
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
    "revision_id",
    "sections",
    "decision",
    "materialization"
  ],
  "properties": {
    "revision_id": {
      "type": "string",
      "pattern": "^[A-Za-z0-9_-]+$"
    },
    "sections": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "reason_scope",
        "proposed_change",
        "impacts",
        "provenance_pending"
      ],
      "properties": {
        "reason_scope": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Motivo fundamental y consulta histórica justificada."
        },
        "proposed_change": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Acuerdos sustituidos, cambio exacto y límites."
        },
        "impacts": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Cambios autorizados sobre fuentes actuales; conservar evolución ajena."
        },
        "provenance_pending": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S",
          "description": "Evidencia, decisiones y condiciones abiertas; no reiniciar lifecycle."
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
# Revisión de GENESIS: revision_1

## Motivo Y Alcance

Motivo fundamental y consulta histórica justificada.

## Acuerdos Sustituidos Y Cambio Propuesto

Acuerdos sustituidos, cambio exacto y límites.

## Impactos Y Reconciliación

Cambios autorizados sobre fuentes actuales; conservar evolución ajena.

## Pendientes Y Procedencia

Evidencia, decisiones y condiciones abiertas; no reiniciar lifecycle.

## Decisión Humana

status: pending

## Materialización

stage: pending
```
