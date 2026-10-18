# Plantillas

Estas plantillas describen la forma mínima de los artefactos de los componentes del núcleo. La disponibilidad de una plantilla no obliga a llenar secciones que no sean aplicables. El modelo estable de los componentes y pilares está en `../core/`.

## Contrato Estructural De Genesis

`genesis.contract.json` define Genesis, sus revisiones y Glossary. `consolidation.contract.json` define Specs y Roadmap para CONSOLIDATION, reutilizando tipos básicos del contrato de Genesis. El núcleo common/lib/structure.mjs valida y renderiza; common/build/template-reference.mjs genera referencias .template.md, no editables manualmente. Regenerar con `node common/build/generate-templates.mjs` desde assistant-adapters/opencode; --check comprueba consistencia y la construcción del ZIP la exige. csdd_write protege Genesis/Glossary; csdd_document registra aportes pendientes a otros documentos e informes consultivos. Ninguna escritura anticipada acredita cierre de otros componentes.

Las tools reciben solo entrada estructurada artifact/operation/data; no hay entrada alternativa content ni mapeo de aliases. create crea, update parchea lo vigente preservando campos omitidos (null retira un campo opcional), append agrega revisión fundamental de Genesis. El Markdown del producto sigue siendo la salida legible. Las integraciones fuente reciben una copia preparada del contrato; el ZIP lo incorpora al bundle y conserva la referencia humana en .csdd/. No existe dependencia del repositorio fuente en destino.

El contrato agrupa errores estructurales; no acredita fidelidad semántica, autenticidad de aprobación ni autorización de transiciones. Los nombres y encabezados estructurales los genera el código; las secciones reciben Markdown con subtítulos de nivel 3 o inferior. Ejemplos cercados y citas se preservan. La integración debe mantener cuerpos y decisiones aprobados desde su contenido persistido, no volver a renderizarlos.

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
