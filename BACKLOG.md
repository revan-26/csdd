# Backlog De CSDD

## Ítems

### Integración de Ontology
[B-017 · propuesto · fr]

Operativa por código de Ontology en la integración Claude Code: `ONTOLOGY.md` como registro por bloques y dominios y contratos como documentos vivos, creados desde sus plantillas; aprobación y rechazo del paquete con huellas, restaurando dominios, contratos y glosario al rechazar; guarda que limita su escritura a Canon con un bloque abierto y abre el glosario mientras haya un bloque en curso; agentes por rol que leen los criterios en el protocolo de la fase activa; y scripts generalizados en lugar de duplicados, incluido `csdd_review.py` con constancia, huella y diff para que una nueva revisión se limite al cambio. Cierra cuando sus pruebas deterministas pasan y una sesión real con Claude Code completa un bloque, registrando cuántas rondas de revisión y cuánto tiempo requiere.

- Fuentes: `framework/protocols/ontology.md`, `integration/claude-code/`
- Depende de: B-016

### Lectura de PDF en Explorer
[B-018 · propuesto · fr]

Explorer no puede leer las fuentes primarias publicadas en PDF, como el Manual de Contabilidad de la SBS, y sus informes quedan basados en resúmenes de búsqueda. Decidir cómo obtiene el texto sin instalar herramientas en el equipo de la persona sin su autorización. Cierra con la lectura comprobada de un PDF real o la limitación documentada.

- Fuentes: `integration/claude-code/agents/csdd-explorer.md`, `framework/protocols/entry.md`

### Lanzador de Python en Windows
[B-004 · propuesto · fr]

Resolver cómo invocan los hooks y el instalador los scripts cuando el sistema expone `py` en lugar de `python3`. Cierra con una invocación comprobada o una limitación documentada.

- Fuentes: `OPERATIONS.md`
- Depende de: B-002

### Ejercicio con un caso real
[B-005 · aceptado · fr]

Ejecutar el prototipo sobre una copia de un proyecto existente, sin modificar el original, con límites de llamadas y tiempo fijados antes. Cierra con evidencia de utilidad, fidelidad y consumo observado.

- Fuentes: `OPERATIONS.md`
- Depende de: B-002

### Aprobación y cierre de los componentes posteriores a Ontology
[B-006 · propuesto · fr]

Ítem provisional que agrupa la operativa de aprobación y cierre de Topology, Mapping y CONSOLIDATION, incluida la normalización de sus plantillas a las convenciones de `framework/templates/README.md`. Cada fase se abre como ítems propios cuando se trabaja y sale de este. Cierra cuando no le queda ninguna fase.

- Fuentes: `framework/protocols/`
- Depende de: B-005

### Flujo de evolution
[B-008 · propuesto · posterior]

Diseñar la unidad de cambio, la revisión previa a la integración y la política de deprecación del modo `evolution` con un caso real.

- Fuentes: `framework/CSDD.md`

### Optimización de tokens
[B-009 · diferido · posterior]

Reducir el contexto que reciben los agentes, por ejemplo entregando solo los términos pertinentes del glosario.

- Fuentes: `integration/claude-code/agents/`
- Razón: se pospone hasta observar el consumo real; se reconsidera con el consumo observado en B-005.

### Comandos de Bash que no nombran una ruta protegida
[B-013 · propuesto · fr]

La guarda bloquea un comando de Bash del orquestador solo si su texto nombra una ruta protegida, así que uno que la alcanza sin nombrarla, como `rm -rf docs` o `git checkout -- .`, pasa y solo lo frenan los permisos de Claude Code. Decidir si basta la limitación ya documentada en `INSTALL.md` o si se añade una defensa. Cierra con la decisión registrada.

- Fuentes: `integration/claude-code/csdd/scripts/csdd_guard.py`, `INSTALL.md`

### Aprobación contra el veredicto de Reviewer
[B-014 · diferido · fr]

Decidir si la persona puede aprobar Genesis cuando Reviewer no da conformidad, dejando registradas las observaciones que acepta, ya que hoy la aprobación exige un veredicto conforme. Cierra con la regla registrada o descartada con su razón.

- Fuentes: `framework/CSDD.md`, `integration/claude-code/csdd/scripts/csdd_doc.py`
- Razón: no se ha observado que Reviewer bloquee una aprobación por error; se reconsidera si ocurre en un caso real.

### Operación de git según el proyecto
[B-015 · diferido · posterior]

Diseñar cómo registra CSDD en control de versiones los puntos que lo requieran sin imponer un flujo: delegar en el mecanismo del proyecto, como sus convenciones o skills propias, o en uno clásico, y considerar un agente que lo opere solo si los casos reales lo exigen. Cierra con el diseño probado en un caso de Implementation.

- Fuentes: `framework/protocols/implementation.md`
- Razón: la persona lo difiere hasta trabajar Implementation; mientras tanto la guarda solo evita interferir con el git de cada proyecto.

## Cerrados Y Descartados

### Prueba del método Ontology
[B-016 · cerrado]

Conversación real de Ontology sobre una copia de un Genesis aprobado de prueba, con skill y agentes provisionales, sin guarda ni hooks, siguiendo `framework/protocols/ontology.md`. Evalúa utilidad, fidelidad al Genesis y proporción del paquete, no la operativa mecánica. Cierra con el registro de observaciones y los ajustes de protocolo y plantillas que resulten.

- Cierre: una conversación de prueba sobre el Genesis del ERP de microfinanzas, aprobada tras seis revisiones; ajustes en `b7affa6`: marcas solo en las excepciones, paquete sin estado del proceso, `ONTOLOGY.md` sin síntesis ni registro de confirmaciones, lenguaje local con matiz propio y revisión según `genesis.md`, que pregunta a la persona solo los hallazgos que cambian significado.

### Revisión de la historia de git
[B-007 · descartado]

Decidir si la historia requiere limpieza antes de publicar el repositorio.

- Razón: la publicación se hace como una instantánea sin historial, así que la historia de trabajo no se publica.

### Revisión fundamental de Genesis
[B-011 · cerrado]

Operativa por código para revisar un Genesis cerrado según «Revisión y rechazo» de `framework/protocols/genesis.md`: bloque nuevo al final con huella, decisión y cierre acotados a él, cuerpo y bloques anteriores congelados, glosario conservado al abrir y restaurado si la revisión se rechaza, y cambios de términos acordados o supuestos solo dentro del bloque. El rechazo deja de aplicar al Genesis inicial. Cierra cuando sus pruebas deterministas pasan.

- Cierre: `csdd_hash.py`, `csdd_review.py` y `csdd_doc.py` operan por bloques (`revise`, decisión, cierre, restauración del glosario y recuperación por bloque) y `csdd_guard.py` limita la escritura al bloque activo y aplica las reglas del glosario dentro de una revisión, con pruebas sin modelos en `tests/`; ramas `feat/bloques-genesis` y `feat/guarda-revision`. Falta observar una revisión con Claude Code real.

### Términos de investigación en el glosario
[B-012 · cerrado]

Decidir si los términos que Genesis toma de una investigación, sin que la persona confirme cada uno, entran al glosario como `supuesto` en lugar de `propuesto`, para que la aprobación de Genesis no los convierta en acordados. Cierra con la regla registrada en `framework/protocols/genesis.md` o descartada con su razón.

- Cierre: regla en `framework/protocols/genesis.md` («Candidato») y en las convenciones de `framework/templates/README.md`: el vocabulario estándar que pide la persona entra como `supuesto` salvo confirmación explícita, y un supuesto pasa a `propuesto` solo dentro de una revisión (B-011).

### Hechos de Claude Code no verificados
[B-003 · cerrado]

Comprobar en una sesión real que, sin bloquear `/csdd-approve` ni `/csdd-reject`, la persona ve el `systemMessage` del hook y el modelo recibe su `additionalContext` junto con la skill expandida. Comprobar también si una skill con `disable-model-invocation` puede precargarse en un subagente, qué límite de longitud tienen las descripciones de skills, si `MultiEdit` existe como herramienta y si la asignación de IDs obliga a Canon a releer sin fricción. Cierra con el resultado observado de cada uno.

- Cierre: los hooks reciben `agent_type` dentro de los subagentes; `UserPromptSubmit` recibe `/csdd-approve` antes que su skill y, sin bloquearlo, entrega `systemMessage` a la persona y `additionalContext` al modelo en el mismo turno (`8296208`); `Stop` entrega `last_assistant_message`; la asignación de IDs exige una sola relectura. No se observó `MultiEdit`, que la guarda cubre igual. La precarga de skills en subagentes y el límite de longitud de las descripciones no intervienen en este corte.

### Verificador de esqueletos
[B-001 · cerrado]

Script en Python 3 con biblioteca estándar que comprueba los documentos contra sus plantillas: títulos, secciones obligatorias, líneas administrativas, condiciones de Decisión Humana y Materialización, y entradas de Glosario y Backlog. Cierra con pruebas unitarias sobre casos válidos e inválidos preparados.

- Cierre: `tools/csdd_check.py` con 34 pruebas sin modelos, hoy en `tests/test_csdd_check.py`, commit `feat(tools): agrega verificador de esqueletos con pruebas`. Las plantillas posteriores a Genesis solo se verifican en estructura hasta normalizar sus convenciones (B-006).

### Prototipo mínimo de la integración Claude Code: Genesis
[B-002 · cerrado]

Primer corte limitado a Genesis. Parte del prototipo de etapa 1 en `integration/claude-code/` (skills `csdd-genesis` y `csdd-aprobar`, subagentes Canon, Reviewer y Explorer, scripts de huella, mensajes y constancia de revisión) y añade el instalador en el `.claude/` del proyecto, creación del esqueleto, guarda de escritura, decisión humana por hook con `/csdd-approve` y `/csdd-reject`, comprobación de cierre y Materialización por código, asignación de IDs del glosario y registro de mensajes por hooks, con el transcript como respaldo. `/csdd:doctor`, el hook SessionStart, las revisiones fundamentales (B-011) y los componentes posteriores quedan para cortes siguientes. Cierra cuando las pruebas deterministas de hooks y scripts pasan sin modelos.

- Cierre: `install.py`, `csdd_doc.py`, `csdd_guard.py` y `csdd_hook.py` con pruebas sin modelos en `tests/`, ramas `feat/instalador-proyecto`, `feat/operaciones-documento`, `feat/hooks-genesis` y `feat/integracion-adaptada`. La observación con Claude Code real queda en B-003; las revisiones fundamentales, en B-011.

### Prueba del método Genesis
[B-010 · cerrado]

Conversación real de Genesis sin plugin, siguiendo `framework/protocols/genesis.md`, con revisión semántica independiente y aprobación anotada por la persona. Evalúa utilidad y fidelidad, no la operativa mecánica. Cierra con el registro de observaciones y los ajustes de método que resulten.

- Cierre: dos conversaciones de prueba con el prototipo de etapa 1; ajustes en `e486803`, `c2c115a` y `345e276`.
