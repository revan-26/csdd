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

Preparar Glossary como candidato: términos y definiciones presentes en Genesis, sin ampliación por inferencia. Mientras Genesis esté pendiente, el glosario candidato no constituye aprobación de significado. Antes de modificar un glosario vigente, conservar su versión previa para poder abandonar únicamente el cambio candidato.

Los informes de exploración local/web pueden mantenerse en docs/support/ como insumos de toda Definición, sin autoridad propia sobre el alcance. Incorporar las decisiones y su justificación suficiente a las fuentes competentes antes de cerrar CONSOLIDATION; los informes conservan lo observado como antecedente. Los diferidos del proyecto permanecen en Genesis y fuentes competentes, no en support/.

## Revisión y aprobación

Una revisión semántica independiente contrasta el candidato y Glossary con la intención y decisiones humanas: fidelidad, reglas preservadas, alcance, inferencias explícitas y ausencia de contradicciones bloqueantes. No requiere documentos futuros ni aprobación previa del candidato.

Corregir en una sola tanda los hallazgos concretos de una revisión. Las observaciones no bloqueantes se presentan a la persona con el candidato, sin abrir otra ronda; un gusto editorial no bloquea. La revisión no sustituye autoridad humana ni demuestra implementación.

La conformidad se vincula al contenido exacto examinado, acotado al bloque activo y Glossary; Reviewer registra únicamente juicio semántico. Un cambio posterior de ese contenido invalida la conformidad; la nueva revisión se limita al cambio.

Presentar Genesis y Glossary para aprobar, corregir o rechazar. La persona puede no leer el documento completo, por lo que la presentación indica las decisiones registradas, las inferencias y términos que la aprobación convierte en acordados, las observaciones de la revisión y lo cambiado desde la presentación anterior. La aprobación identifica persona declarada, intervención humana y revisión exacta del cuerpo de Genesis; el vocabulario presentado se vincula a esa revisión y al reporte de sus versiones. Si cambia el candidato o el glosario, no presentar la aprobación anterior como aceptación del cambio.

El cuerpo comprende título y secciones anteriores a Decisión Humana. Metadatos de decisión y materialización quedan fuera de esa huella. La aprobación no autoriza automáticamente Ontology, decisiones técnicas o implementación.

La aprobación debe provenir de una intervención humana registrada mediante un mecanismo que el modelo no pueda ejecutar por sí mismo; una afirmación del agente no la acredita. Registrar la decisión antes de pedir otra intervención; si llega una corrección o mensaje posterior antes del registro, inspeccionar el estado y aclarar lo necesario sin atribuirle una aprobación que no contiene. Una constancia ya registrada permite completar el paso pendiente sin pedir aprobación de nuevo.

## Escritura y cierre

La estructura del documento pertenece al código: el esqueleto se crea desde la plantilla y el agente redacta solo el contenido de las secciones. Títulos, IDs, fechas, procedencia administrativa (sesión, mensaje y aprobación) y referencias los genera y protege la integración; un cambio que los altere se rechaza antes de escribirse. Las entradas de Glossary se registran una a una, sin afectar las no mencionadas. Una revisión fundamental se añade como bloque nuevo, sin reescribir los anteriores.

Tras aprobación comprobable y revisión semántica conforme de las versiones actuales, el código completa Materialización con referencias de Genesis/Glossary, reporte real y límites. La escritura de administración no obliga a otra revisión LLM.

El cierre exige cuerpo aprobado intacto, glosario fiel, revisión suficiente, decisiones bloqueantes resueltas y persistencia comprobada. Se registra stage closed. No se crea Backlog para señalarlo; no se declara V1 implementada ni First Release.

La reparación admite una entrega inicial y hasta cuatro correcciones agrupadas; repetición inválida, agotamiento o modificación protegida detienen la operación. No se elude el límite mediante otra sesión.

## Revisión fundamental y rechazo

Contrastar primero las fuentes vigentes disponibles. Antes de Ontology, Genesis es la fuente pertinente de intención; después se consultan dominios, contratos y otras fuentes actuales. Una feature compatible no obliga a releer historia.

Cambios de propósito, destinatarios o límites fundamentales requieren nueva propuesta y aprobación propia. Añadir un bloque Revisión de GENESIS con identidad generada desde el runtime, después de un bloque cerrado o rechazado y abandonado. Preservar completos cuerpo y decisión anteriores. No regenerar fuentes posteriores ni reiniciar el proyecto.

El rechazo registra intervención real y disposition abandoned sin aprobar. Conserva el bloque, restaura exclusivamente el candidato de Glossary cuando corresponda y no altera canon vigente. Una propuesta posterior tiene identidad propia. Si hay evolución ajena que impide restauración segura, detenerse y consultar.

## Recuperación

La integración conserva una constancia de cada aprobación que permite comprobar su procedencia entre sesiones. No autentica identidad humana ni resiste manipulación hostil. Constancia ausente, corrupta o discordante bloquea el cierre; no se reconstruye desde una afirmación del agente.

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
