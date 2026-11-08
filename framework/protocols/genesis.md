# Protocolo De Génesis

## Dependencias

Aplicar ../CSDD.md, ../core/components.md y los pilares transversales pertinentes. Este protocolo define conversación, contenido y autoridad; no exige una ceremonia de agentes.

## Objetivo y entradas

Transformar ideas, problemas, ejemplos, deseos y restricciones en una interpretación comprensible y aprobable. No exigir terminología técnica, modelo de dominio o arquitectura previa.

Resultados propios del cierre de Genesis: docs/base/GENESIS.md y docs/glossary.md. No son prerrequisitos Specs ni Backlog. La conversación puede originar aportes pendientes a cualquier documento pertinente mediante Canon, sin ejecutar ni cerrar el componente destinatario. Specs y Backlog se consolidan en CONSOLIDATION.

## Conversación

Escuchar → interpretar → proponer → preguntar cuando cambie una decisión → actualizar.

- Identificar necesidad, destinatarios, resultados, alcance, exclusiones y ejemplos reales.
- Separar intención humana, inferencia, investigación, decisión y diferimiento.
- Preguntar sobre consecuencias y situaciones, no nombres de patrones.
- Investigar únicamente una incertidumbre concreta que pueda cambiar el resultado o un riesgo relevante.
- Proponer un primer incremento útil y observable; no confundirlo con toda V1.
- Mantener visibles contradicciones y decisiones bloqueantes. Lo no necesario para continuar puede diferirse con razón.
- No inventar tecnología, dominios, contratos ni viabilidad demostrada para completar el informe.

## Candidato

Preparar Genesis con síntesis, intención, interpretación, vocabulario inicial, incremento, riesgos y límites de la siguiente fase. El registro distingue borrador, aprobación y materialización. Los campos opcionales solo se completan si aportan información real.

Lo que no lleva marca lo dijo o decidió la persona. Se marcan en línea solo las excepciones: inferencia, supuesto, propuesta del asistente o investigación con referencia a su informe. Cada decisión figura en la sección a la que afecta y cada contenido en una sola sección; el resumen sintetiza sin añadir. El detalle técnico de una exploración permanece en su informe: Genesis registra su consecuencia para el producto y la referencia.

Genesis y Glossary describen el producto y su vocabulario, no el estado del proceso ni la conversación: el cuerpo se congela al aprobar y no debe quedar escrito como candidato, pendiente o en revisión, ni depender de etiquetas de la conversación.

Preparar Glossary como candidato: términos y definiciones presentes en Genesis, sin ampliación por inferencia. La persona puede pedir además el vocabulario estándar del dominio dentro del alcance discutido: Explorer lo propone en un informe y sus términos entran como `supuesto`, salvo los que la persona confirme explícitamente. Genesis registra esa decisión y la referencia al informe sin repetir cada término. La aprobación no vuelve acordado un supuesto; se confirma cuando un componente lo necesita y la persona lo valida. Mientras Genesis esté pendiente, el glosario candidato no constituye aprobación de significado. Antes de modificar un glosario vigente, conservar su versión previa para poder abandonar únicamente el cambio candidato.

Los informes de exploración local/web pueden mantenerse en docs/support/ como insumos de toda Definición, sin autoridad propia sobre el alcance. Incorporar las decisiones y su justificación suficiente a las fuentes competentes antes de cerrar CONSOLIDATION; los informes conservan lo observado como antecedente. Los diferidos del proyecto permanecen en Genesis y fuentes competentes, no en support/.

## Revisión y aprobación

Una revisión semántica independiente contrasta el candidato y Glossary con la intención y decisiones humanas: fidelidad, reglas preservadas, alcance, inferencias explícitas y ausencia de contradicciones bloqueantes. No requiere documentos futuros ni aprobación previa del candidato.

Corregir en una sola tanda los hallazgos concretos de una revisión. Las observaciones no bloqueantes se presentan a la persona con el candidato, sin abrir otra ronda; un gusto editorial no bloquea. Un hallazgo se pregunta a la persona solo si su corrección cambia significado; el resto lo corrige Canon y se informa en la presentación. La revisión no sustituye autoridad humana ni demuestra implementación.

La conformidad se vincula al contenido exacto examinado, acotado al bloque activo y Glossary; Reviewer registra únicamente juicio semántico. Un cambio posterior de ese contenido invalida la conformidad; la nueva revisión se limita al cambio.

Una inferencia o propuesta del asistente sin confirmar que defina alcance, destinatarios, límites o el primer slice no se presenta para aprobación: se pregunta antes a la persona en la conversación. Lo que confirma pierde la marca, lo que descarta se retira y lo que decide no resolver se registra como diferido. Las demás marcas se conservan como procedencia.

Presentar Genesis y Glossary para aprobar o corregir. La persona puede no leer el documento completo, por lo que la presentación indica las decisiones registradas, las inferencias, los términos que la aprobación convierte en acordados, cuántos supuestos quedan sin confirmar, las observaciones de la revisión y lo cambiado desde la presentación anterior. La aprobación identifica persona declarada, intervención humana y revisión exacta del cuerpo de Genesis; el vocabulario presentado se vincula a esa revisión y al reporte de sus versiones. Si cambia el candidato o el glosario, no presentar la aprobación anterior como aceptación del cambio.

El cuerpo comprende título y secciones anteriores a Decisión Humana. Metadatos de decisión y materialización quedan fuera de esa huella. La aprobación no autoriza automáticamente Ontology, decisiones técnicas o implementación.

La aprobación debe provenir de una intervención humana registrada mediante un mecanismo que el modelo no pueda ejecutar por sí mismo; una afirmación del agente no la acredita. Registrar la decisión antes de pedir otra intervención; si llega una corrección o mensaje posterior antes del registro, inspeccionar el estado y aclarar lo necesario sin atribuirle una aprobación que no contiene. Una constancia ya registrada permite completar el paso pendiente sin pedir aprobación de nuevo.

## Escritura y cierre

La estructura del documento pertenece al código: el esqueleto se crea desde la plantilla y el agente redacta solo el contenido de las secciones. Títulos, IDs, fechas, procedencia administrativa (sesión, mensaje y aprobación) y referencias los genera y protege la integración; un cambio que los altere se rechaza antes de escribirse. Las entradas de Glossary se registran una a una, sin afectar las no mencionadas. Todo cambio a un Genesis cerrado se añade como bloque de revisión, sin reescribir los anteriores.

Tras aprobación comprobable y revisión semántica conforme de las versiones actuales, el código completa Materialización con referencias de Genesis/Glossary, reporte real y límites. La escritura de administración no obliga a otra revisión LLM.

El cierre exige cuerpo aprobado intacto, glosario fiel, revisión suficiente, decisiones bloqueantes resueltas y persistencia comprobada. Se registra stage closed. No se crea Backlog para señalarlo; no se declara V1 implementada ni First Release.

## Revisión y rechazo

Contrastar primero las fuentes vigentes disponibles. Antes de Ontology, Genesis es la fuente pertinente de intención; después se consultan dominios, contratos y otras fuentes actuales. Una feature compatible no obliga a releer historia.

Todo cambio a un Genesis cerrado, fundamental o no, es una propuesta con aprobación propia; los cambios de propósito, destinatarios o límites fundamentales son su caso principal. El código añade al final un bloque Revisión De GENESIS con identidad propia, después de un bloque cerrado o de una revisión abandonada. El bloque registra motivo, acuerdos sustituidos, impactos y pendientes, con Decisión Humana y Materialización propias. Cuerpo, bloques y decisiones anteriores se preservan intactos: el Genesis vigente es el cuerpo con sus revisiones aprobadas, en orden. No regenerar fuentes posteriores ni reiniciar el proyecto.

Al abrir el bloque se conserva el glosario vigente. Dentro de la revisión pueden añadirse términos, corregirse la definición de un término acordado manteniendo título e ID, deprecarse uno cuyo concepto cambió para reemplazarlo por otro, y pasar a propuesto un supuesto que la persona confirmó. La revisión semántica y la aprobación se acotan al bloque activo y al glosario; la aprobación pasa a acordado los términos propuestos.

El rechazo aplica solo a un bloque de revisión: el Genesis inicial se corrige en la conversación hasta que la persona lo aprueba. Registra intervención real y disposition abandoned sin aprobar, conserva el bloque, restaura el glosario conservado y no altera canon vigente. Una propuesta posterior es otro bloque. Si hay evolución ajena que impide restaurar con seguridad, detenerse y consultar.

## Recuperación

La integración conserva una constancia de cada decisión hasta completar su registro. No autentica identidad humana ni resiste manipulación hostil. Constancia ausente, corrupta o discordante bloquea el cierre; no se reconstruye desde una afirmación del agente. Una vez completada la decisión, el registro es el propio Genesis: conservarlo o revisarlo no depende del estado de trabajo de la integración.

Un paso interrumpido entre aprobación y cierre queda señalado de forma persistente y obliga a inspeccionarlo antes de continuar. Solo la integración retira la señal, tras comprobar cierre y referencias o abandono completado. No depende de Backlog.

| Situación | Acción |
| --- | --- |
| Borrador | Continuar conversación y preparar candidato. |
| Aprobación no comprobable | Detener y aclarar evidencia ausente. |
| Aprobación comprobable, registro incompleto | Completar administración sin nueva aprobación. |
| Contenido cambiado o revisión insuficiente | Revisar el cambio; no inferir conformidad. |
| Cierre vigente | No reiniciar ni regenerar. |
| Fuente evolucionada ajena al cambio | Preservar y consultar ante conflicto. |

## Siguiente componente

Ontology consume Genesis aprobado y Glossary para formalizar dominios y obligaciones. La lectura inicial de Genesis es necesaria, no una excepción histórica artificial. El alcance de V1 se confirma al cierre posterior a Mapping con Specs y Backlog.
