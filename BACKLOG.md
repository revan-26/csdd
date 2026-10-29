# Backlog De CSDD

## Ítems

### Prototipo mínimo de la integración Claude Code: Genesis
[B-002 · aceptado · fr]

Primer corte limitado a Genesis. Parte del prototipo de etapa 1 en `integration/claude-code/` (skills `csdd-genesis` y `csdd-aprobar`, subagentes Canon, Reviewer y Explorer, scripts de huella, mensajes y constancia de revisión) y añade creación del esqueleto, guarda de escritura, comprobación de cierre y Materialización por código, y el empaquetado como plugin con `/csdd:aprobar`. `/csdd:doctor`, el hook SessionStart y los componentes posteriores quedan para cortes siguientes. Cierra cuando las pruebas deterministas de hooks y scripts pasan sin modelos.

- Fuentes: `OPERATIONS.md`, `framework/protocols/genesis.md`
- Depende de: B-001

### Hechos de Claude Code no verificados
[B-003 · propuesto · fr]

Comprobar en el prototipo si los hooks reciben `agent_id` y `agent_type`, si una skill con `disable-model-invocation` puede precargarse en un subagente y qué límite de longitud tienen las descripciones de skills. Comprobar también si `UserPromptSubmit` entrega el texto de la persona y si algún hook (por ejemplo `Stop`) permite obtener el último texto del asistente, para registrar los mensajes humanos con su pregunta en un archivo del proyecto en lugar de leer el transcript: `human_messages.py` depende de un formato interno, solo ve la sesión más reciente y pierde lo dicho antes de un `/clear` o en sesiones anteriores. Cierra con el resultado observado de cada uno.

- Fuentes: B-002
- Depende de: B-002

### Lanzador de Python en Windows
[B-004 · propuesto · fr]

Resolver cómo invocan los hooks los scripts cuando el sistema expone `py` en lugar de `python3`. Cierra con una invocación comprobada o una limitación documentada.

- Fuentes: `OPERATIONS.md`
- Depende de: B-002

### Ejercicio con un caso real
[B-005 · aceptado · fr]

Ejecutar el prototipo sobre una copia de un proyecto existente, sin modificar el original, con límites de llamadas y tiempo fijados antes. Cierra con evidencia de utilidad, fidelidad y consumo observado.

- Fuentes: `OPERATIONS.md`
- Depende de: B-002

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

### Verificador de esqueletos
[B-001 · cerrado]

Script en Python 3 con biblioteca estándar que comprueba los documentos contra sus plantillas: títulos, secciones obligatorias, líneas administrativas, condiciones de Decisión Humana y Materialización, y entradas de Glosario y Backlog. Cierra con pruebas unitarias sobre casos válidos e inválidos preparados.

- Cierre: `tools/csdd_check.py` con 34 pruebas sin modelos en `tools/tests/`, commit `feat(tools): agrega verificador de esqueletos con pruebas`. Las plantillas posteriores a Genesis solo se verifican en estructura hasta normalizar sus convenciones (B-006).

### Prueba del método Genesis
[B-010 · cerrado]

Conversación real de Genesis sin plugin, siguiendo `framework/protocols/genesis.md`, con revisión semántica independiente y aprobación anotada por la persona. Evalúa utilidad y fidelidad, no la operativa mecánica. Cierra con el registro de observaciones y los ajustes de método que resulten.

- Cierre: investigación «Prueba del método Genesis» (2026-10-29), dos conversaciones con el prototipo de etapa 1; ajustes en `e486803`, `c2c115a` y `docs(genesis): precisa glosario y verificacion de informes`.
