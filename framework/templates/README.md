# Plantillas

Estas plantillas describen la forma mínima de los artefactos de los componentes del núcleo. La disponibilidad de una plantilla no obliga a llenar secciones que no sean aplicables. El modelo estable de los componentes y pilares está en `../core/`.

## Estructura De Los Documentos

La estructura de los documentos CSDD pertenece al código: los scripts de la integración crean cada documento desde su plantilla y protegen títulos, IDs y cuerpos aprobados; el agente redacta solo el contenido de las secciones. Glossary, decisiones y hallazgos se registran entrada por entrada mediante comandos. La administración (aprobaciones, huellas, fechas y referencias) la escribe exclusivamente el código. La validez estructural no acredita fidelidad semántica, autenticidad de aprobación ni autorización de transiciones. La integración debe conservar cuerpos y decisiones aprobados tal como fueron persistidos.

`genesis.template.md`, `genesis-revision.template.md`, `glossary.template.md`, `specs.template.md` y `roadmap.template.md` son todavía referencias generadas desde `genesis.contract.json` y `consolidation.contract.json` para la escritura estructurada del adapter retirado. Se reemplazarán por esqueletos Markdown junto con el verificador de la integración Claude Code; mientras tanto describen secciones y campos, no la interfaz de escritura vigente.

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
| `specs.template.md` | `docs/specs.md` | Definición global, alcance de V1 y síntesis con referencias. |
| `roadmap.template.md` | `docs/roadmap.md` | Secuencia hacia V1, lifecycle, posibilidades y diferidos con razones. |

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
