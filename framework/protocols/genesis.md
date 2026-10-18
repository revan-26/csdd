# Protocolo De Génesis

## Dependencias

Aplicar ../CSDD.md, ../core/components.md y los pilares transversales pertinentes. Este protocolo define conversación, contenido y autoridad; no exige una ceremonia de agentes.

## Objetivo y entradas

Transformar ideas, problemas, ejemplos, deseos y restricciones en una interpretación comprensible y aprobable. No exigir terminología técnica, modelo de dominio o arquitectura previa.

Resultados propios del cierre de Genesis: docs/base/GENESIS.md y docs/glossary.md. No son prerrequisitos Specs ni Roadmap. La conversación puede originar aportes pendientes a cualquier documento pertinente mediante Canon, sin ejecutar ni cerrar el componente destinatario. Specs y Roadmap se consolidan en CONSOLIDATION.

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

Preparar Genesis con síntesis, intención, interpretación, vocabulario inicial, incremento, riesgos, procedencia y límites de la siguiente fase. El registro distingue borrador, aprobación y materialización. Los campos opcionales solo se completan si aportan información real.

Preparar Glossary como candidato: términos y definiciones presentes en Genesis, sin ampliación por inferencia. Mientras Genesis esté pendiente, el glosario candidato no constituye aprobación de significado. Antes de modificar un glosario vigente, conservar su versión previa para poder abandonar únicamente el cambio candidato.

Los informes de exploración local/web pueden mantenerse en docs/support/ como insumos de toda Definición, sin autoridad propia sobre el alcance. Incorporar las decisiones y su justificación suficiente a las fuentes competentes antes de cerrar CONSOLIDATION; los informes conservan lo observado como antecedente. Los diferidos del proyecto permanecen en Genesis y fuentes competentes, no en support/.

## Revisión y aprobación

Una revisión semántica independiente contrasta el candidato y Glossary con la intención y decisiones humanas: fidelidad, reglas preservadas, alcance, inferencias explícitas y ausencia de contradicciones bloqueantes. No requiere documentos futuros ni aprobación previa del candidato.

Corregir hallazgos concretos; revisar de nuevo únicamente cuando cambie el significado examinado. Un gusto editorial no bloquea. La revisión no sustituye autoridad humana ni demuestra implementación.

Presentar Genesis y Glossary para aprobar, corregir o rechazar. La aprobación identifica persona declarada, intervención y revisión exacta del cuerpo de Genesis. En V2 la declaración es Apruebo sha256:<digest>; el vocabulario presentado se vincula a ese cuerpo y al reporte de sus versiones. Si cambia el candidato o el glosario, no reutilizar conformidad ni presentar la aprobación anterior como aceptación del cambio.

El cuerpo comprende título y secciones anteriores a Decisión Humana. Metadatos de decisión y materialización quedan fuera de esa huella. La aprobación no autoriza automáticamente Ontology, decisiones técnicas o implementación.

En la integración V2 instalada, una aprobación nueva exige esa declaración exacta como primera línea de la última intervención humana de la sesión raíz. La identidad declarada puede indicarse antes o en la segunda línea. Registrar la decisión antes de pedir otra intervención; si llega una corrección o mensaje posterior antes del registro, inspeccionar el estado y aclarar lo necesario sin atribuirle una aprobación que no contiene. Una constancia ya registrada permite recuperar el paso incompleto sin pedir aprobación de nuevo.

## Escritura y cierre

La interfaz recibe exclusivamente {artifact, operation, data}. Código renderiza, valida y obtiene del runtime IDs, fechas y procedencia. create crea; update parchea preservando lo omitido; append añade una revisión fundamental. No acepta content ni Markdown completo.

Tras aprobación comprobable y revisión semantic conforme de las versiones actuales, código completa Materialización con referencias de Genesis/Glossary, reporte real y límites. La escritura de administración no obliga a otra revisión LLM. Si cambió significado, la conformidad previa deja de servir.

El cierre exige cuerpo aprobado intacto, glosario fiel, revisión suficiente, decisiones bloqueantes resueltas y persistencia comprobada. Se registra stage closed. No se crea Roadmap para señalarlo; no se declara V1 implementada ni First Release.

La reparación admite una entrega inicial y hasta cuatro correcciones agrupadas; repetición inválida, agotamiento o modificación protegida detienen la operación. No se elude el límite mediante otra sesión.

## Revisión fundamental y rechazo

Contrastar primero las fuentes vigentes disponibles. Antes de Ontology, Genesis es la fuente pertinente de intención; después se consultan dominios, contratos y otras fuentes actuales. Una feature compatible no obliga a releer historia.

Cambios de propósito, destinatarios o límites fundamentales requieren nueva propuesta y aprobación propia. Añadir un bloque Revisión de GENESIS con identidad generada desde el runtime, después de un bloque cerrado o rechazado y abandonado. Preservar completos cuerpo y decisión anteriores. No regenerar fuentes posteriores ni reiniciar lifecycle.

El rechazo registra intervención real y disposition abandoned sin aprobar. Conserva el bloque, restaura exclusivamente el candidato de Glossary cuando corresponda y no altera canon vigente. Una propuesta posterior tiene identidad propia. Si hay evolución ajena que impide restauración segura, detenerse y consultar.

## Recuperación V2

La constancia docs/base/.approval-<digest>.json conserva la intervención original y permite comprobar procedencia entre sesiones. No autentica identidad humana ni resiste manipulación hostil. Constancia ausente, corrupta o discordante bloquea el cierre; no se reconstruye desde una afirmación del agente.

La marca docs/base/.genesis-recovery-pending obliga a inspeccionar el paso incompleto. Código la retira tras comprobar cierre y referencias o abandono completado; no se borra manualmente. No depende de Roadmap.

| Situación | Acción |
| --- | --- |
| Borrador | Continuar conversación y preparar candidato. |
| Aprobación no comprobable | Detener y aclarar evidencia ausente. |
| Aprobación comprobable, registro incompleto | Completar administración sin nueva aprobación. |
| Contenido cambiado o revisión insuficiente | Revisar el cambio; no inferir conformidad. |
| Cierre vigente | No reiniciar ni regenerar. |
| Fuente evolucionada ajena al cambio | Preservar y consultar ante conflicto. |

Reviewer usa begin para obtener rutas de snapshots locales acotados al bloque activo y Glossary; complete registra únicamente juicio semántico y comprueba que no cambiaron fuentes ni snapshots. latest entrega el reporte real. La respuesta de begin no transporta toda la historia ni depende de acceso a tool-output externo.

## Siguiente componente

Ontology consume Genesis aprobado y Glossary para formalizar dominios y obligaciones. La lectura inicial de Genesis es necesaria, no una excepción histórica artificial. El alcance de V1 se confirma al cierre posterior a Mapping con Specs y Roadmap.
