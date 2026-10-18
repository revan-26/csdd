# Contrato: <contract-name>

status: proposed
scope: semantic | technical
source_revision:
contract_owner:

## Aplicabilidad

- Responsabilidades independientes: <parties and reason>; o
- Significado compartido: <meaning and parties>.

Si ninguna condición existe, documentar la interacción local en el dominio correspondiente y no crear este contrato.

## Propósito

<Qué acuerdo preservan las partes. Ontology define significado; Topology puede definir realización técnica sin alterar silenciosamente el acuerdo semántico.>

## Partes

| Parte | Responsabilidad semántica | Autoridad sobre su modelo |
| --- | --- | --- |
| <party> | <responsibility> | <scope> |

## Precondiciones

- <observable condition required before interaction>.

## Obligaciones Y Evidencia

| Parte | Obligación observable | Criticidad | Disposición | Evidencia o limitación |
| --- | --- | --- | --- | --- |
| <party> | <obligation> | low / medium / critical | enforced / automated_check / manual_check / not_checked | <reference or limitation> |

## Información Conceptual

<Conceptos, significado, identidad, estados o relaciones que cruzan la frontera. En alcance semántico no decidir serialización ni transporte.>

## Resultados Y Violaciones

<Resultados esperados, rechazos, fallos y condiciones de recuperación semánticamente relevantes.>

## Repetición, Orden Y Tiempo

<Solo si una repetición, orden o ventana temporal cambia el significado del producto.>

## Estabilidad Opcional

Completar solo si existen consumidores independientes o un compromiso explícito de estabilidad.

- Compatibilidad: <applicable / not_applicable>.
- Cambio: compatible / breaking / not_applicable.
- Partes afectadas: <references>.
- Migración, coexistencia, deprecación o retirada: <only applicable items>.

## Trazabilidad

- Dominios: <references>
- Fuentes aprobadas: <Genesis o dominios/contratos competentes; Specs solo después del cierre>
- `docs/glossary.md`: <terms>
- ADR: <references or none>

## Archivos Asociados

<Opcional: ruta relativa, función y autoridad de cada YAML, JSON, XML, schema o ejemplo. Todos se alojan junto a contract.md en docs/contracts/<nombre>/. Distinguir definición de ejemplos no normativos; no duplicar una regla sin aclarar su representación.>

## Límite De Alcance

Ontology no decide API, transporte, schema físico, framework, repositorio ni mapping. Topology puede especificar interfaces y representaciones técnicas justificadas. Detalle local de implementación y mapping permanecen en sus fuentes competentes. No crear un contrato si no hay acuerdo o frontera que lo justifique.
