# Protocolo De CONSOLIDATION

Aplicar CSDD.md y core/components.md. CONSOLIDATION es el sexto componente del núcleo y cierra la macrofase de Definición; no es un pilar ni implementación.

## Entrada

Genesis aprobado, Glossary vigente, dominios y contratos semánticos, arquitectura, ADR y contratos técnicos aplicables, y mappings de cada repositorio. Una asignación no exige que el producto esté implementado. Los cierres identifican el alcance de sus decisiones; no se presume aprobación de toda V1. Los aportes anticipados a Specs/Backlog son propuestas pendientes, no consolidación aprobada.

## Procedimiento

1. Integrar resultados sin duplicar reglas, contratos o ADR.
2. Detectar contradicciones, dependencias y costos que afecten V1 o prioridades.
3. Presentar conjuntamente alcance propuesto de V1, prioridades y diferidos con razones.
4. Obtener confirmación humana de decisiones pendientes; los hallazgos de Ontology/Topology recomiendan, no autorizan recortes o ampliaciones.
5. Escribir docs/specs.md y docs/backlog.md desde las mismas decisiones y comprobar coherencia y referencias.
6. Comprobar que los informes de exploración usados durante Definición no contienen requisitos, decisiones o justificaciones indispensables exclusivos. Incorporar lo pertinente en la fuente competente; conservar en support/ la evidencia histórica sin reescribir lo observado.
7. Solicitar autorización explícita antes de comenzar un incremento de Implementación. La confirmación de Specs/Backlog no ejecuta ese incremento automáticamente.

## Specs

Definición global legible: propósito, actores, capacidades, comportamientos, alcance de V1, exclusiones, restricciones y síntesis semántica/arquitectónica. Referenciar dominios, contratos, arquitectura y mappings; no reproducir sus catálogos ni introducir condiciones normativas propias en resúmenes. La sección First Release existe solo tras la declaración humana descrita en `../CSDD.md`.

## Backlog

Lista ordenada del trabajo que la persona decide o necesita ver: incrementos, ajustes, investigaciones y revisiones de fuentes. El orden es la prioridad. No registra la descomposición interna del trabajo de un agente.

Cada ítem indica resultado esperado, criterio de cierre, fuentes afectadas y dependencias. Un ítem no cambia alcance ni significado: si el trabajo lo requiere, referencia la revisión de la fuente competente. Su cierre es una referencia a evidencia (mapping verificado, revisión de documento o cambio integrado) escrita por el código; el estado de implementación se lee en Mapping, no se duplica. Los ítems que propone un agente quedan propuestos hasta que la persona decida. Antes de First Release cada ítem indica si pertenece al alcance de V1 o es posterior; el alcance mismo reside en Specs. Los diferidos indican razón y condición para reconsiderarlos.

El Backlog no se cierra con CONSOLIDATION: durante Implementación la conversación con la persona añade, reordena o difiere ítems. No inventar fechas ni presentar verificaciones futuras como ejecutadas.

## Cierre y evolución

Ambos documentos parten de las mismas decisiones; el alcance de V1 reside solo en Specs. El cierre no demuestra implementación, uso real ni First Release. No exige una cadena adicional de revisiones LLM administrativas. Cambios posteriores reconcilian solo las fuentes afectadas, preservando historia y decisiones ajenas. Los diferidos propios del proyecto pertenecen a Backlog y fuentes competentes, nunca a support/.

Registrar en los documentos correspondientes alcance, revisión y procedencia de la confirmación humana, sin inventar aprobaciones retrospectivas. No se requiere docs/base/CONSOLIDATION.md. La suficiencia se limita a V1 y al siguiente incremento ejecutable, no a especificar todo el futuro. Reentrar cuando un cambio afecte alcance, prioridad, dependencia o secuencia.
