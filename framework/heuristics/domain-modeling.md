# Heurísticas De Modelado De Dominios

## Propósito

Esta biblioteca ayuda a la IA a descubrir, clasificar y revisar dominios durante la fase de Ontología. Las heurísticas son instrumentos de razonamiento, no sustituyen evidencia ni aprobación humana.

La IA debe usarlas internamente para construir propuestas comprensibles. `ONTOLOGY.md` solo conserva la síntesis de las evaluaciones que influyeron en una decisión.

## Disposición De Las Heurísticas

Cada heurística se trata como una de estas clases:

| Disposición | Uso |
| --- | --- |
| `normative` | Regla que no debe violarse. |
| `consultative` | Señal para orientar una evaluación. |
| `risk_activated` | Se usa cuando el riesgo o el alcance la hacen relevante. |
| `deferred` | Pertenece a realización, repositorios o mappings. |
| `discarded` | Se excluye por sesgo, duplicación o falta de valor. |

Un resultado heurístico usa uno de estos valores: `supports`, `weakens`, `inconclusive` o `not_applicable`.

## Reglas De Descubrimiento

1. Conservar primero la expresión literal de la persona.
2. Clasificar cada elemento como objetivo, comportamiento observable, restricción, pista de solución o detalle visual.
3. Tratar toda ampliación no confirmada como supuesto visible.
4. Expandir desde consecuencias, precondiciones, resultados, fallos y límites observables.
5. No deducir dominios desde pantallas, navegación, formularios, tablas, endpoints, servicios, equipos o repositorios.
6. No importar dominios por analogía con productos similares.
7. Preguntar primero por lo que pueda cambiar el propósito, el alcance, el primer slice o la seguridad de ejecución.
8. Explicitar siempre el dominio del problema. No exigir varios dominios cuando un documento proporcional en domains/ y Glossary expresen suficientemente conceptos, reglas y límites. No depender de Specs antes del cierre de definición. Esta proporcionalidad documental es una decisión de CSDD, no una afirmación de que DDD prescinda del dominio.

## Tipos Que No Deben Colapsarse

| Tipo | Pregunta principal |
| --- | --- |
| Dominio de negocio | ¿Qué espacio de problema se quiere comprender? |
| Subdominio | ¿Qué parte diferenciable tiene reglas y lenguaje propios? |
| `core` | ¿Dónde está la diferenciación principal del producto? |
| `supporting` | ¿Qué capacidad específica soporta el producto sin diferenciarlo principalmente? |
| `generic` | ¿Qué capacidad común podría resolverse con una solución estándar? |
| Capability | ¿Qué resultado debe poder producir el producto? |
| Modelo de dominio | ¿Qué conceptos y reglas son coherentes dentro de una frontera? |
| Bounded context | ¿Dónde conserva consistencia un lenguaje y modelo concretos? |
| Responsabilidad | ¿Quién tiene autoridad sobre una decisión o regla? |
| Repositorio | ¿Dónde se materializa código o documentación? |

La clasificación `core/supporting/generic` es estratégica y no determina por sí sola una frontera. Un dominio no equivale automáticamente a un subdominio, bounded context, equipo, servicio o repositorio.

## Activación De Un Dominio

Un candidato puede proponerse como dominio activo cuando existe evidencia suficiente de:

- propósito de negocio expresable en una oración;
- lenguaje y conceptos coherentes dentro de la frontera;
- decisiones, reglas o invariantes propias;
- alcance incluido y exclusiones explícitas;
- comportamiento o ciclo de vida que la frontera pueda explicar;
- procedencia en intención humana, comportamiento confirmado o decisión aprobada.

La evidencia debe ser semántica. Un agregado puede aportar claridad, pero no es obligatorio; tampoco lo son una entidad, una máquina de estados o una implementación táctica.

## Pruebas De Independencia

Usar como pruebas consultivas. Una frontera que pasa tres o más pruebas merece atención favorable, pero el número no es una demostración ni un gate.

| Prueba | Pregunta |
| --- | --- |
| Autonomía de trabajo | ¿Puede evolucionar el modelo sin coordinar continuamente su significado con otro? |
| Invariantes internas | ¿Puede preservar sus reglas sin una transacción síncrona con otro modelo? |
| Evento decisivo | ¿Cambia lenguaje, responsabilidad o regla en la frontera? |
| Capacidad de rechazo | ¿Puede rechazar una solicitud por reglas propias? |
| Ritmo de cambio | ¿Cambia por razones distintas de los modelos vecinos? |
| Explicabilidad | ¿Puede explicarse completo sin contradicciones? |

## Señales De Frontera Artificial

Dos o más señales deben provocar reevaluación, no una división automática:

- cirugía de escopeta para cambiar un solo concepto;
- comunicación de modelo excesiva;
- concepto central dividido entre dos fronteras;
- núcleo de vocabulario compartido que crece sin control;
- ausencia de cambio de lenguaje, responsabilidad o reglas;
- modelo anémico sin decisiones, invariantes o transformación propia;
- el límite existe solo para reflejar una capa técnica;
- la mayoría de cambios afecta siempre ambas fronteras.

## Señales De Sobredimensionamiento

Evaluar división cuando varias señales convergen:

- un término tiene significados distintos;
- demasiadas decisiones o ciclos de vida independientes;
- demasiadas invariantes o comportamientos no relacionados;
- dependencias significativas en varias direcciones;
- ritmos de cambio claramente distintos;
- el modelo se vuelve difícil de revisar o explicar;
- una frontera contiene capacidades con propósitos diferentes.

Los umbrales heredados de cantidad de raíces, entidades, invariantes, casos de uso, dependencias, palabras o minutos de explicación son señales consultivas sin validación empírica. Nunca son gates automáticos.

## Señales De Subdimensionamiento

Evaluar fusión o absorción cuando varias señales convergen:

- no existe propósito propio claro;
- no hay reglas, decisiones o invariantes propias;
- solo retransmite información;
- no tiene lenguaje local ni comportamiento diferenciable;
- cambia siempre junto al dominio vecino;
- su tamaño reducido refleja una división artificial;
- solo existe para justificar una futura estructura técnica.

La ausencia de una entidad raíz, un ciclo de vida o varios casos de uso no invalida por sí sola un dominio basado en políticas, cálculos, conocimiento o decisiones.

## Relaciones Entre Dominios

Para cada relación identificar:

- dirección, si existe: upstream, downstream o par;
- propósito de la relación;
- conceptos que cruzan la frontera;
- traducción necesaria entre modelos;
- invariantes que permanecen locales;
- posibilidad de evolucionar independientemente;
- frontera contractual candidata.

Una relación no implica compartir entidades, estados, persistencia ni lenguaje completo. Una identidad estable puede conectar modelos sin convertirlos en uno solo.

## Contratos Semánticos

Activar contrato solo si:

- dos responsabilidades pueden evolucionar de manera independiente; o
- deben preservar un significado compartido.

Una interfaz local, un módulo, un tipo o una API bajo una sola responsabilidad no activa un contrato canónico por sí solo. El contrato debe declarar propósito, partes, obligaciones observables, resultados, violaciones, evidencia y limitaciones, sin elegir transporte ni tecnología.

## Reglas, Invariantes Y Estados

- Una regla describe comportamiento esperado.
- Una invariante declara lo que debe permanecer verdadero.
- Un estado describe una condición significativa del ciclo de vida.
- Una transición declara origen, disparador, condiciones, resultado observable y posibles rechazos.
- No inferir estos elementos desde columnas, botones o nombres técnicos.
- Estados complejos, concurrencia o interleavings activan análisis de riesgo proporcional.
- Cada obligación relevante declara disposición: `enforced`, `automated_check`, `manual_check` o `not_checked`.
- Una obligación crítica no puede cerrarse como `not_checked` sin bloqueo o excepción humana explícita.

## ADR

Crear ADR solo cuando la decisión sea durable y además costosa de revertir, irreversible o transversal con efecto persistente. Una preferencia local, una elección reversible o una nota de diseño no basta.

Un ADR explica contexto, alternativas, decisión, consecuencias, supuestos y revisión. No sustituye una regla funcional, un dominio ni un contrato.

## Brownfield

En un sistema existente, usar como evidencia adicional:

- historia de cambios;
- incidentes y correcciones;
- ownership observado;
- dependencias runtime;
- consultas y flujos reales;
- vocabulario utilizado por personas usuarias y operadores;
- divergencias entre documentación y comportamiento.

La implementación y su historial aportan evidencia, pero no cambian silenciosamente la autoridad semántica. Clasificar una divergencia como `deriva`, `deuda` o `cambio_intencional`.

## Evolución De Fronteras

Una división, fusión, absorción, renombre, deprecación o retirada requiere:

1. Evidencia del problema o aprendizaje.
2. Evaluación de impacto en vocabulario, reglas, invariantes, estados y contratos.
3. Propuesta de nueva frontera y alternativas consideradas.
4. Reconciliación de artefactos afectados.
5. Aprobación humana cuando cambia significado.

Los mappings y repositorios solo se evalúan después de que exista una decisión ontológica y una materialización real.

## Anti-Patrones

- Crear un dominio por pantalla, tabla, equipo, servicio o repositorio.
- Forzar un dominio por simetría documental.
- Crear un repositorio por dominio.
- Crear contratos porque existen varias capas.
- Usar conteos como prueba ontológica.
- Usar DDL como autoridad del significado.
- Convertir toda capacidad transversal en dominio sin comprobar ownership e invariantes.
- Repetir una regla global en cada dominio sin declarar autoridad.
- Crear archivos vacíos para aparentar cobertura.

## Registro De Evaluación

## Catálogo De Heurísticas Rescatadas

Este catálogo conserva la trazabilidad de las heurísticas identificadas en CSDD Legacy y CF-SDD Legacy. La numeración es estable dentro de esta biblioteca; no convierte una heurística consultiva en norma.

| ID | Heurística | Disposición |
| --- | --- | --- |
| H01 | Conservar entrada literal antes de interpretar | `normative` |
| H02 | Hacer visibles los supuestos no confirmados | `normative` |
| H03 | Explorar límites proporcionalmente al alcance | `consultative` |
| H04 | Expandir desde consecuencias semánticas | `consultative` |
| H05 | No importar dominios por analogía | `normative` |
| H06 | Traducir UI a comportamiento antes de modelar | `normative` |
| H07 | Preguntar primero por impacto en el primer slice | `normative` |
| H08 | Separar candidato de dominio activo | `normative` |
| H09 | Comprender el dominio sin forzar divisiones ni documentos separados | `normative` |
| H10 | Clasificar límites como activos, candidatos o inexistentes | `consultative` |
| H11 | Activar solo lo necesario para el slice | `normative` |
| H12-H16 | Lenguaje, propósito, reglas, invariantes, alcance y términos estables | `normative` |
| H17 | Exigir evidencia y procedencia de activación | `normative` |
| H18-H19 | Usar señales de capacidad y propósito para abrir evaluación | `consultative` |
| H20 | Activar artefactos solo cuando apliquen | `normative` |
| H21 | No equiparar dominio, contexto, equipo o repositorio | `normative` |
| H22 | Exigir autoridad humana para activar o cambiar fronteras | `normative` |
| H23-H28 | Pruebas de independencia | `consultative` |
| H29-H37 | Señales de frontera artificial y separación conceptual | `consultative` |
| H38-H43 | Señales cuantitativas de tamaño y revisabilidad | `consultative` |
| H44-H47 | Relaciones tipadas y obligaciones contractuales | `normative` |
| H48-H50 | Mappings y enforcement material | `deferred` |
| H51-H52 | Glosario, homónimos, alias y contraejemplos | `normative` |
| H53 | No usar tecnología como sustituto de contexto | `normative` |
| H54 | Coherencia estructural | `normative` |
| H55-H59 | Disposición, evidencia, estados complejos y oráculos | `risk_activated` |
| H60-H63 | Reconciliación y clasificación de divergencias | `normative` |
| H64 | No heredar correspondencia material comprobada | `deferred` |
| H65-H67 | Evolución de términos, ADR y estabilidad contractual | `risk_activated` |
| H68 | Impacto persistido o multidominio | `deferred` |
| I01-I07 | Casos conceptuales de identidad, publicación, representación y sincronización | `consultative` |
| I08 | Revisar políticas transversales que se presenten como dominios | `consultative` |
| I09 | Usar ejemplos pequeños como evidencia, no como taxonomía | `consultative` |
| I10 | Tratar patrones externos como investigación, no como norma | `consultative` |

Los rangos agrupados comparten la misma disposición, pero sus criterios detallados están descritos en las secciones anteriores. H48-H50, H64 y H68 se conservan como referencia de continuidad, pero pertenecen a la frontera posterior a Ontología.

Cuando una heurística influya en una propuesta, registrar internamente:

```text
heuristic_id:
subject:
result: supports | weakens | inconclusive | not_applicable
evidence:
limitations:
provenance:
```

La síntesis que llegue a `ONTOLOGY.md` debe indicar qué cambió la evaluación y qué incertidumbre permanece.
