# Protocolo De Ontología

## Dependencias Normativas

- `../CSDD.md`: principios, autoridad y modos de implementación.
- `../core/components.md`: contrato del componente `ONTOLOGY`.
- `../core/pillars.md`: responsabilidades transversales aplicables.

## Objetivo

Guiar la transformación del baseline aprobado de Génesis en un modelo semántico explícito, proporcional y aprobable, antes de decidir repositorios o realización técnica.

Ontología es un componente del núcleo que puede invocarse antes o después de First Release. No es una ontología formal exhaustiva ni una fase de arquitectura. Después de First Release respeta los activos protegidos y las decisiones de compatibilidad requeridas.

## Entrada

La invocación requiere:

- `docs/base/GENESIS.md` aprobado y `docs/glossary.md` vigente en la primera invocación; dominios y contratos vigentes en reentradas;
- cierre de Genesis respaldado por su revisión semántica y materialización;
- incremento o cambio activo, alcance, riesgos y asuntos diferidos identificados; en la primera invocación corresponden al primer slice;
- decisiones vigentes y, si existe, declaración de First Release con sus activos protegidos. Specs y Backlog no se exigen antes del cierre de definición.

Si estas condiciones no se cumplen, la IA debe identificar qué falta. Un borrador vuelve a la conversación de Genesis; una aprobación comprobable con proyección pendiente requiere recuperación según `genesis.md`, no reapertura semántica del snapshot.

## Responsabilidades

La IA descubre candidatos, investiga selectivamente, aplica heurísticas, propone clasificaciones, detecta contradicciones y redacta el paquete. La persona decide el significado, el alcance, las fronteras, los riesgos aceptados y la aprobación del paquete.

La IA no puede convertir una inferencia, una puntuación heurística o un artefacto técnico en una decisión humana.

## Ciclo De Trabajo

```text
examinar baseline
  -> descubrir candidatos
  -> clasificar conceptos y capacidades
  -> evaluar activación y fronteras
  -> aplicar heurísticas relevantes
  -> modelar dominios
  -> relacionar modelos
  -> activar contratos aplicables
  -> identificar restricciones para Topology
  -> reconciliar fuentes
  -> comprobar readiness
  -> solicitar aprobación
```

## 1. Examinar El Baseline

Leer Genesis y Glossary inicialmente; después el modelo semántico vigente. La lectura inicial de Genesis es pertinente porque contiene la intención todavía no formalizada. Identificar conceptos, reglas y fronteras sin asumir divisiones obligatorias.

Separar expresamente:

- intención humana;
- inferencia de la IA;
- evidencia de implementación o investigación;
- decisión humana;
- asunto diferido.

## 2. Descubrir Y Clasificar

Para cada candidato, evaluar si describe:

- dominio de negocio;
- subdominio;
- clasificación `core`, `supporting` o `generic`;
- capability;
- modelo de dominio;
- bounded context;
- responsabilidad semántica.

No usar dominio, bounded context, equipo, servicio, módulo y repositorio como sinónimos. La clasificación estratégica puede quedar diferida si no existe evidencia suficiente.

No exigir varios dominios ni carpetas complejas. Un documento proporcional en docs/domains/ puede reunir propósito, conceptos, reglas y límites de un proyecto pequeño; Glossary conserva términos, no sustituye reglas.

## 3. Evaluar Activación Y Fronteras

Un dominio propuesto debe presentar propósito, lenguaje, reglas o invariantes propias, alcance, exclusiones y procedencia. Aplicar las pruebas de independencia y las señales de frontera artificial de `../heuristics/domain-modeling.md`.

Las heurísticas cuantitativas solo disparan revisión. No determinan división, fusión ni activación.

Para cada candidato elegir una disposición:

- `active`: se propone como dominio canónico;
- `candidate`: requiere evidencia o decisión posterior;
- `merged`: se absorbe en otro modelo;
- `deferred`: no afecta el alcance actual;
- `rejected`: la hipótesis no se sostiene.

## 4. Modelar La Huella Necesaria

Modelar solo lo necesario para el incremento o cambio activo, riesgos visibles y relaciones que puedan cambiar el diseño. Un dominio activo puede declarar reglas, invariantes, estados y transiciones; las secciones no aplicables se omiten.

Cada estado o transición debe tener intención y procedencia. Cada obligación crítica debe declarar disposición, mecanismo, evidencia, responsable y limitaciones.

## 5. Relacionar Modelos

Describir dirección, propósito, conceptos cruzados, traducciones, invariantes locales y posibilidad de evolución independiente. Una relación no obliga a compartir modelo interno.

La relación se marca como frontera contractual candidata solo cuando exista independencia evolutiva o significado que deba preservarse entre responsabilidades.

## 6. Activar Contratos

Crear contratos solo cuando sean aplicables, en docs/contracts/<nombre>/contract.md. Ontology define acuerdos semánticos; no endpoints, payloads, tablas, serialización o frameworks. Los archivos asociados opcionales se alojan en la misma carpeta; no se envían a support/.

El contrato debe hacer observables las obligaciones de cada parte y declarar evidencia o limitaciones. Versionado, compatibilidad, migración, coexistencia y deprecación se añaden únicamente si existe un consumidor independiente o un compromiso explícito de estabilidad.

## 7. Transferir Restricciones A Topology

Registrar decisiones semánticas en el dominio o contrato competente, con razones relevantes. Identificar restricciones o dudas arquitectónicas para Topology; no crear ADR arquitectónicos prematuros.

Las decisiones que dependan de repositorios, paquetes, endpoints, bases de datos o frameworks se difieren a `TOPOLOGY` o a los componentes posteriores.

## 8. Reconciliar

Comprobar que dominios y contratos respeten la intención aprobada y no contradigan Glossary ni decisiones vigentes. Si aparece una contradicción:

1. clasificarla como `deriva`, `deuda` o `cambio_intencional`;
2. identificar la fuente durable que debe cambiar;
3. obtener decisión humana cuando cambie significado;
4. actualizar las referencias afectadas;
5. no resolverla por precedencia silenciosa.

Una evolución compatible no requiere leer ni actualizar Genesis. Si cambia fundamentos o falta procedencia necesaria, Canon activa la consulta selectiva según `../CSDD.md`; una nueva revisión preserva decisiones anteriores.

Formalizar reglas de Genesis en dominios o contratos sin reescribir el registro aprobado. El paquete identifica procedencia y destino normativo vigente. Specs se consolidará al cierre mediante síntesis y referencias, no como catálogo paralelo. En reentradas conservar significado y referencias al transferir una regla; cambios semánticos necesitan decisión humana.

## Readiness

Ontología está lista para aprobación cuando:

1. El alcance del incremento o cambio activo está cubierto.
2. Los candidatos tienen disposición explícita.
3. Cada dominio activo tiene evidencia semántica y fronteras positivas y negativas.
4. Las clasificaciones estratégicas están justificadas o diferidas.
5. Las reglas, invariantes, estados y transiciones relevantes son coherentes.
6. Las relaciones entre dominios tienen significado y dirección cuando aplica.
7. Los contratos aplicables tienen partes y obligaciones observables.
8. Las restricciones transferidas a Topology están explícitas sin decisiones técnicas prematuras.
9. Glossary y el paquete no se contradicen ni duplican definiciones normativas.
10. Las incertidumbres bloqueantes están resueltas.
11. Los riesgos y asuntos diferidos son visibles.
12. No se han definido repositorios, mappings ni decisiones técnicas prematuras.

Readiness no es un estado del producto.

## Aprobación

La persona puede aprobar, solicitar modificaciones, rechazar una clasificación o diferir un artefacto. La aprobación conjunta de `ONTOLOGY.md` cubre el paquete exacto y debe identificar persona, fecha, decisión, revisión del informe, revisiones de artefactos incluidos y referencia de aprobación.

Una solicitud de modificación mantiene el paquete en `proposed`. La aprobación no autoriza contenido que no esté en el paquete leído.

## Materialización Y Versionado

La aprobación no declara First Release. `ONTOLOGY.md` conserva el manifiesto de la revisión aprobada. Una modificación semántica crea una nueva propuesta y conserva la aprobación anterior hasta que la nueva sea aceptada.

La materialización reconcilia dominios, contratos y Glossary. Relaciones y reglas vigentes no quedan exclusivamente en el registro base: ONTOLOGY.md conserva manifiesto aprobado, resultados y pendientes sin duplicar el paquete. Pueden registrarse aportes pendientes pertinentes a Specs o Backlog, sin confundirlos con CONSOLIDATION aprobada. Revisiones preservan aprobaciones anteriores y actualizan solo consumidores existentes afectados.

Las actualizaciones del framework pueden modificar protocolos, heurísticas y plantillas, pero no sobrescriben instancias ontológicas de un proyecto adoptante.

## Frontera Con Topology

La invocación termina antes de decidir:

- cuántos repositorios existen;
- qué repositorio corresponde a un dominio;
- qué equipo o servicio posee una frontera técnica;
- paquetes, módulos, endpoints o tablas;
- topología física, repositorios y playbooks.

La siguiente transformación es `TOPOLOGY`. Desde el modelo aprobado deriva las responsabilidades físicas necesarias para el incremento activo y decide repositorios solo cuando la independencia de realización esté justificada. No existe relación 1:1 obligatoria entre dominio y repositorio.
