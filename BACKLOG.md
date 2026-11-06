# Backlog De CSDD

## Ítems

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

### Revisión fundamental de Genesis
[B-011 · propuesto · fr]

Operativa por código para añadir un bloque de revisión después de uno cerrado o rechazado, con huella, decisión y cierre acotados al bloque activo y restauración del glosario vigente. Mientras no exista, un Genesis rechazado o cerrado no puede continuar con una propuesta nueva. Cierra cuando sus pruebas deterministas pasan.

- Fuentes: `framework/protocols/genesis.md`
- Depende de: B-002

### Términos de investigación en el glosario
[B-012 · propuesto · fr]

Decidir si los términos que Genesis toma de una investigación, sin que la persona confirme cada uno, entran al glosario como `supuesto` en lugar de `propuesto`, para que la aprobación de Genesis no los convierta en acordados. Cierra con la regla registrada en `framework/protocols/genesis.md` o descartada con su razón.

- Fuentes: `framework/protocols/genesis.md`

### Aprobación y cierre de los componentes posteriores a Genesis
[B-006 · propuesto · fr]

Operativa de aprobación y cierre de Ontology, Topology, Mapping y CONSOLIDATION, incluido el uso de contratos en un caso material y la normalización de sus plantillas a las convenciones de `framework/templates/README.md`.

- Fuentes: `framework/protocols/`
- Depende de: B-005

### Revisión de la historia de git
[B-007 · propuesto · fr]

Decidir si la historia requiere limpieza antes de publicar el repositorio.

- Fuentes: `OPERATIONS.md`

### Flujo de evolution
[B-008 · propuesto · posterior]

Diseñar la unidad de cambio, la revisión previa a la integración y la política de deprecación del modo `evolution` con un caso real.

- Fuentes: `framework/CSDD.md`

### Optimización de tokens
[B-009 · diferido · posterior]

Reducir el contexto que reciben los agentes, por ejemplo entregando solo los términos pertinentes del glosario.

- Fuentes: `OPERATIONS.md`
- Razón: OPERATIONS la pospone; se reconsidera con el consumo observado en B-005.

## Cerrados Y Descartados

### Hechos de Claude Code no verificados
[B-003 · cerrado]

Comprobar en una sesión real que, sin bloquear `/csdd-approve` ni `/csdd-reject`, la persona ve el `systemMessage` del hook y el modelo recibe su `additionalContext` junto con la skill expandida. Comprobar también si una skill con `disable-model-invocation` puede precargarse en un subagente, qué límite de longitud tienen las descripciones de skills, si `MultiEdit` existe como herramienta y si la asignación de IDs obliga a Canon a releer sin fricción. Cierra con el resultado observado de cada uno.

- Cierre: los hooks reciben `agent_type` dentro de los subagentes; `UserPromptSubmit` recibe `/csdd-approve` antes que su skill y, sin bloquearlo, entrega `systemMessage` a la persona y `additionalContext` al modelo en el mismo turno (`8296208`); `Stop` entrega `last_assistant_message`; la asignación de IDs exige una sola relectura. No se observó `MultiEdit`, que la guarda cubre igual. La precarga de skills en subagentes y el límite de longitud de las descripciones no intervienen en este corte.

### Verificador de esqueletos
[B-001 · cerrado]

Script en Python 3 con biblioteca estándar que comprueba los documentos contra sus plantillas: títulos, secciones obligatorias, líneas administrativas, condiciones de Decisión Humana y Materialización, y entradas de Glosario y Backlog. Cierra con pruebas unitarias sobre casos válidos e inválidos preparados.

- Cierre: `tools/csdd_check.py` con 34 pruebas sin modelos en `tools/tests/`, commit `feat(tools): agrega verificador de esqueletos con pruebas`. Las plantillas posteriores a Genesis solo se verifican en estructura hasta normalizar sus convenciones (B-006).

### Prototipo mínimo de la integración Claude Code: Genesis
[B-002 · cerrado]

Primer corte limitado a Genesis. Parte del prototipo de etapa 1 en `integration/claude-code/` (skills `csdd-genesis` y `csdd-aprobar`, subagentes Canon, Reviewer y Explorer, scripts de huella, mensajes y constancia de revisión) y añade el instalador en el `.claude/` del proyecto, creación del esqueleto, guarda de escritura, decisión humana por hook con `/csdd-approve` y `/csdd-reject`, comprobación de cierre y Materialización por código, asignación de IDs del glosario y registro de mensajes por hooks, con el transcript como respaldo. `/csdd:doctor`, el hook SessionStart, las revisiones fundamentales (B-011) y los componentes posteriores quedan para cortes siguientes. Cierra cuando las pruebas deterministas de hooks y scripts pasan sin modelos.

- Cierre: `install.py`, `csdd_doc.py`, `csdd_guard.py` y `csdd_hook.py` con pruebas sin modelos en `tests/`, ramas `feat/instalador-proyecto`, `feat/operaciones-documento`, `feat/hooks-genesis` y `feat/integracion-adaptada`. La observación con Claude Code real queda en B-003; las revisiones fundamentales, en B-011.

### Prueba del método Genesis
[B-010 · cerrado]

Conversación real de Genesis sin plugin, siguiendo `framework/protocols/genesis.md`, con revisión semántica independiente y aprobación anotada por la persona. Evalúa utilidad y fidelidad, no la operativa mecánica. Cierra con el registro de observaciones y los ajustes de método que resulten.

- Cierre: dos conversaciones de prueba con el prototipo de etapa 1; ajustes en `e486803`, `c2c115a` y `345e276`.
