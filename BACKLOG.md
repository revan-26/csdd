# Backlog De CSDD

Trabajo del proyecto fuente CSDD, no Backlog de un proyecto adoptante ni parte del payload instalable. Sigue el formato de `framework/templates/backlog.template.md`; `fr` designa la primera versión usable de la integración Claude Code.

## Ítems

### Prueba del método Genesis
[B-010 · aceptado · fr]

Conversación real de Genesis sin plugin, siguiendo `framework/protocols/genesis.md`, con revisión semántica independiente y aprobación anotada por la persona. Evalúa utilidad y fidelidad, no la operativa mecánica. Cierra con el registro de observaciones y los ajustes de método que resulten.

- Fuentes: `framework/protocols/genesis.md`

### Verificador de esqueletos
[B-001 · aceptado · fr]

Script en Python 3 con biblioteca estándar que comprueba los documentos contra sus plantillas: títulos, secciones obligatorias, líneas administrativas, condiciones de Decisión Humana y Materialización, y entradas de Glosario y Backlog. Cierra con pruebas unitarias sobre casos válidos e inválidos preparados.

- Fuentes: `framework/templates/README.md`

### Prototipo mínimo de la integración Claude Code: Genesis
[B-002 · aceptado · fr]

Primer corte limitado a Genesis: creación del esqueleto, guarda de escritura, `/csdd:aprobar`, comprobación de cierre y Materialización, y subagente Reviewer. `/csdd:doctor`, el hook SessionStart, Canon, Explorer y los componentes posteriores quedan para cortes siguientes. Cierra cuando las pruebas deterministas de hooks y scripts pasan sin modelos.

- Fuentes: `OPERATIONS.md`, `framework/protocols/genesis.md`
- Depende de: B-001

### Hechos de Claude Code no verificados
[B-003 · propuesto · fr]

Comprobar en el prototipo si los hooks reciben `agent_id` y `agent_type`, si una skill con `disable-model-invocation` puede precargarse en un subagente y qué límite de longitud tienen las descripciones de skills. Cierra con el resultado observado de cada uno.

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

Operativa de aprobación y cierre de Ontology, Topology, Mapping y CONSOLIDATION, incluido el uso de contratos en un caso material.

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
