# Protocolo De CONSOLIDATION

Aplicar CSDD.md y core/components.md. CONSOLIDATION es el sexto componente del núcleo y cierra la macrofase de Definición; no es un pilar ni implementación.

## Entrada

Genesis aprobado, Glossary vigente, dominios y contratos semánticos, arquitectura, ADR y contratos técnicos aplicables, y mappings de cada repositorio. Una asignación no exige que el producto esté implementado. Los cierres identifican el alcance de sus decisiones; no se presume aprobación de toda V1. Los aportes anticipados a Specs/Roadmap son propuestas pendientes, no consolidación aprobada.

## Procedimiento

1. Integrar resultados sin duplicar reglas, contratos o ADR.
2. Detectar contradicciones, dependencias y costos que afecten V1 o prioridades.
3. Presentar conjuntamente alcance propuesto de V1, secuencia y diferidos con razones.
4. Obtener confirmación humana de decisiones pendientes; los hallazgos de Ontology/Topology recomiendan, no autorizan recortes o ampliaciones.
5. Escribir docs/specs.md y docs/roadmap.md desde las mismas decisiones y comprobar coherencia y referencias.
6. Comprobar que los informes de exploración usados durante Definición no contienen requisitos, decisiones o justificaciones indispensables exclusivos. Incorporar lo pertinente en la fuente competente; conservar en support/ la evidencia histórica sin reescribir lo observado.
7. Solicitar autorización explícita antes de comenzar un incremento de Implementación. La confirmación de Specs/Roadmap no ejecuta ese incremento automáticamente.

## Specs

Definición global legible: propósito, actores, capacidades, comportamientos, alcance de V1, exclusiones, restricciones y síntesis semántica/arquitectónica. Referenciar dominios, contratos, arquitectura y mappings; no reproducir sus catálogos ni introducir condiciones normativas propias en resúmenes.

## Roadmap

Secuencia de incrementos hacia V1, resultados esperados, criterios previstos y dependencias. Distinguir compromisos aprobados de posibilidades posteriores y diferidos; indicar razón y condición para reconsiderarlos. No inventar fechas ni presentar verificaciones futuras como ejecutadas.

## Cierre y evolución

Ambos documentos expresan el mismo alcance confirmado. El cierre no demuestra implementación, uso real ni First Release. No exige una cadena adicional de revisiones LLM administrativas. Cambios posteriores reconcilian solo las fuentes afectadas, preservando historia y decisiones ajenas. Los diferidos propios del proyecto pertenecen a Roadmap y fuentes competentes, nunca a support/.

Registrar en los documentos correspondientes alcance, revisión y procedencia de la confirmación humana, sin inventar aprobaciones retrospectivas. No se requiere docs/base/CONSOLIDATION.md. La suficiencia se limita a V1 y al siguiente incremento ejecutable, no a especificar todo el futuro. Reentrar cuando un cambio afecte alcance, prioridad, dependencia o secuencia.
