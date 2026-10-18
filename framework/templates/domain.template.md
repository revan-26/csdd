# Dominio: <domain-name>

status: proposed
domain_type: domain / subdomain / bounded_context / responsibility
strategic_classification: core / supporting / generic / undecided
ontology_revision:

## Propósito

<Capacidad o responsabilidad de negocio de la que este dominio es dueño.>

## Evidencia De Activación

| Criterio | Evidencia | Procedencia | Confianza |
| --- | --- | --- | --- |
| Propósito propio | <evidence> | <reference> | high / medium / low |
| Lenguaje y conceptos coherentes | <evidence> | <reference> | high / medium / low |
| Reglas o invariantes propias | <evidence> | <reference> | high / medium / low |
| Frontera y exclusiones | <evidence> | <reference> | high / medium / low |

No activar desde UI, tablas, servicios, equipos, repositorios o tecnología.

## Lenguaje Local

| Término | Significado en este dominio | Contraste o límite | Referencia global |
| --- | --- | --- | --- |
| <term> | <meaning> | <contrast> | <GLOSSARY entry> |

## Alcance

### Incluye

### Excluye

## Capabilities Y Decisiones Propias

<Resultados que produce y decisiones sobre las que tiene autoridad semántica.>

## Reglas

- `RULE-01`: <regla observable y su procedencia>.

## Invariantes

| ID | Invariante | Criticidad | Responsable | Disposición | Mecanismo | Evidencia o limitación |
| --- | --- | --- | --- | --- | --- | --- |
| `INV-01` | <must remain true> | low / medium / critical | <owner> | enforced / automated_check / manual_check / not_checked | <mechanism> | <evidence or limitation> |

## Objetos Con Ciclo De Vida

<Conceptos que tienen estados significativos dentro de este dominio.>

| Objeto | Estado inicial | Estados relevantes | Transiciones y condiciones | Resultado observable |
| --- | --- | --- | --- | --- |
| <object> | <state> | <states> | <transition rules> | <outcome> |

## Relaciones

| Modelo o dominio | Dirección | Propósito | Traducción | Frontera contractual |
| --- | --- | --- | --- | --- |
| <model> | upstream / downstream / peer | <reason> | <translation> | yes / no / candidate |

## Contratos Aplicables

<Referencias a contratos semánticos o explicación de por qué no aplican.>

## Evaluación Heurística

| Heurística o prueba | Resultado | Evidencia | Limitación |
| --- | --- | --- | --- |
| <heuristic> | supports / weakens / inconclusive / not_applicable | <reference> | <limitation> |

## Riesgos Y Revisión

### Riesgos

### Disparadores De Revisión

<Cambios de lenguaje, invariantes, ritmo de cambio, dependencias o evidencia brownfield.>

## Trazabilidad

- Fuentes aprobadas: <Genesis inicial o fuentes semánticas vigentes; Specs solo después del cierre>
- `docs/glossary.md`: <terms>
- Primer slice: <reference>

## Límites

Este documento no define repositorios, equipos, servicios, módulos, APIs, tablas, frameworks ni mappings.
