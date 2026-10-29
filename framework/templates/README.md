# Plantillas

Estas plantillas describen la forma mínima de los artefactos de los componentes del núcleo. La disponibilidad de una plantilla no obliga a llenar secciones que no sean aplicables. El modelo estable de los componentes y pilares está en `../core/`.

## Estructura De Los Documentos

La estructura de los documentos CSDD pertenece al código: los scripts de la integración crean cada documento desde su plantilla y protegen títulos, IDs y cuerpos aprobados; el agente redacta solo el contenido de las secciones. Glossary, decisiones y hallazgos se registran entrada por entrada mediante comandos. La administración (aprobaciones, huellas, fechas y referencias) la escribe exclusivamente el código. La validez estructural no acredita fidelidad semántica, autenticidad de aprobación ni autorización de transiciones. La integración debe conservar cuerpos y decisiones aprobados tal como fueron persistidos.

## Convenciones

- El texto entre `< >` es guía de la plantilla: el documento se crea con los títulos y sin esa guía.
- `<Opcional. …>` marca una sección que solo existe cuando tiene contenido aplicable.
- Las líneas `clave: valor` y `[ … ]` son administración: solo las escribe el código.
- Las referencias de contenido tienen la forma `sha256:<64 caracteres hexadecimales>`.

### Decisión Humana

`status` admite `pending`, `approved` o `rejected`:

- `approved` exige `approved_by`, `approved_at`, `approved_content_reference` y `approval_reference`, y prohíbe los campos de rechazo;
- `rejected` exige `rejected_by`, `rejected_at` y `rejection_reference`, y prohíbe los campos de aprobación;
- `pending` prohíbe ambos grupos.

### Materialización

`stage` admite `pending` o `closed`. `closed` exige `genesis_reference`, `glossary_reference`, `review_reference`, `review_verdict`, Verificación y Limitaciones, y prohíbe `disposition`. `disposition` admite solo `abandoned`; `review_verdict`, `conforming`, `non_conforming` o `insufficient_evidence`.

Una revisión de Genesis usa los mismos campos y condiciones en sus bloques de Decisión Humana y Materialización.

### Glosario

Cada término es una entrada con título, una línea administrativa `[<ID> · <fuerza> · <categoría>]`, la definición como primer párrafo y, solo cuando aportan contraste, `Alcance` y `Límites`.

- El glosario registra vocabulario del producto y de su dominio. Decisiones, alcance y conceptos de CSDD residen en sus fuentes, no en el glosario.

- El ID tiene la forma `G-NNN`, lo asigna el código, sobrevive a cambios de nombre y nunca se reutiliza.
- La fuerza indica la firmeza del término: `acordado` (confirmado por la persona), `propuesto` (aporte pendiente de decisión), `supuesto` (hipótesis de trabajo que requiere validación) o `diferido` (decisión humana de no resolverlo ahora).
- Un término se registra como `propuesto`. La aprobación del componente pasa a `acordado` los términos propuestos en esa revisión, salvo los marcados `supuesto` o `diferido`; ninguna edición puede hacerlo.
- La categoría es texto libre e indica qué tipo de concepto es, no su firmeza.
- Un término deprecado se traslada a `Términos Deprecados` con su ID, indicando qué lo reemplaza y por qué dejó de usarse.

### Backlog

Cada ítem es una entrada con título, una línea administrativa `[<ID> · <estado> · <horizonte>]`, el resultado esperado con su criterio de cierre y las referencias que apliquen.

- El ID tiene la forma `B-NNN`, lo asigna el código y nunca se reutiliza.
- El estado es `propuesto` (aporte de un agente), `aceptado` (la persona lo quiere), `autorizado` (puede ejecutarse), `cerrado`, `diferido` o `descartado`. Solo la persona acepta, autoriza, difiere o descarta; `cerrado` lo escribe el código junto con la referencia de cierre. Diferidos y descartados indican su razón.
- El horizonte es `fr` o `posterior` y solo se exige antes de First Release.
- El orden de `Ítems` es la prioridad. Los ítems cerrados y descartados se trasladan a su sección conservando el ID.

### First Release

`declared_by`, `declared_at` y `declaration_reference` son obligatorios cuando la sección existe. Activos Protegidos referencia contratos y describe los datos, comportamientos o consumidores no cubiertos por un contrato.

## Artefactos De Génesis

| Plantilla | Instancia | Naturaleza |
| --- | --- | --- |
| `genesis.template.md` | `docs/base/GENESIS.md` | Registro inicial, aprobación y resultados; cuerpo congelado por revisión. |
| `genesis-revision.template.md` | Bloque añadido a `docs/base/GENESIS.md` | Cambio fundamental con aprobación y cierre propios. |
| `glossary.template.md` | `docs/glossary.md` | Vocabulario compartido vigente. |

La persona recibe Genesis y Glossary candidatos, revisados por significado, y decide sobre el contenido presentado. La administración posterior se comprueba por código, sin otra revisión LLM.

## Consolidación Después De Mapping

| Plantilla | Instancia | Naturaleza |
| --- | --- | --- |
| `specs.template.md` | `docs/specs.md` | Definición global, alcance de V1, síntesis con referencias y declaración de First Release. |
| `backlog.template.md` | `docs/backlog.md` | Trabajo priorizado, estado de decisión y referencia de cierre. |

Ver ../protocols/consolidation.md. El cierre de definición no equivale a First Release implementada.

## Artefactos De Ontología

| Plantilla | Instancia | Naturaleza |
| --- | --- | --- |
| `ontology.template.md` | `docs/base/ONTOLOGY.md` | Registro de trabajo, paquete aprobado y cierre; el significado vigente reside en sus derivados. |
| `domain.template.md` | `docs/domains/<domain>.md` | Modelo semántico de un dominio aplicable. |
| `contract.template.md` | `docs/contracts/<contract>/contract.md` | Acuerdo semántico con asociados opcionales en su carpeta. |

Los artefactos de Ontología se activan solo cuando una necesidad concreta lo justifica. No crean repositorios, mappings ni decisiones técnicas.

## Artefactos De Topology Y Mapping

| Plantilla | Instancia | Naturaleza |
| --- | --- | --- |
| `topology.template.md` | `docs/base/TOPOLOGY.md` | Registro de trabajo, decisiones, resultados y cierre topológico. |
| `architecture.template.md` | `docs/architecture.md` | Organización física vigente, unidades, dependencias y disponibilidad. |
| `adr.template.md` | `docs/adrs/NNN-<decision>.md` | Decisión arquitectónica durable con alternativas y consecuencias. |
| `contract.template.md` | `docs/contracts/<contract>/contract.md` | Acuerdo técnico o refinamiento autorizado con archivos asociados. |
| `mapping.template.md` | `<repo>/docs/mapping/*` | Asignación de obligaciones a destinos y evidencia local. |

Topology mantiene architecture.md y registra invocaciones en el documento base. Los mappings se crean cerca de las unidades que implementan responsabilidades. Implementation produce artefactos reales y evidencia. Los registros base admiten revisiones sucesivas identificables sin reescribir acuerdos anteriores.

docs/support/ no es una salida obligatoria. Admite consulta externa e informes de exploración local/web del proyecto anterior o actual. Son insumos durante Definición y antecedentes al cerrar CONSOLIDATION: entonces retirarlos deja íntegra la definición y su justificación necesaria. No contiene requisitos o decisiones vigentes exclusivos, diferidos propios ni archivos de contratos. Ver ../protocols/entry.md.
