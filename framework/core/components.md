# Componentes Del Núcleo De CSDD

## Propósito Y Autoridad

Este documento define el contrato estable de los seis componentes del núcleo de CSDD: su transformación, alcance, entradas, salidas, exclusiones, autoridad, reentrada y cierre.

`components.md` no define procedimientos paso a paso, prompts, herramientas, plantillas, playbooks ni el estado de un proyecto adoptante. Los protocolos ejecutan una invocación de un componente y deben conformarse a este contrato.

La constitución general está en `../CSDD.md`. Las responsabilidades transversales están en `pillars.md`. Las contradicciones entre documentos normativos son defectos del framework y deben reconciliarse; no se resuelven por una precedencia implícita.

## Modelo Común

Los componentes son transformaciones estables, no fases rígidas, equipos, roles ni componentes del producto. Una invocación aplica un componente a un alcance concreto, normalmente un incremento de valor o un cambio.

```text
GENESIS
   -> ONTOLOGY
   -> TOPOLOGY
   -> MAPPING
   -> CONSOLIDATION (Specs + Backlog)
   -> IMPLEMENTATION <-> MAPPING (realización y evidencia)
```

Los modos de implementación (`construction` y `evolution`, ver `../CSDD.md`) no son estados de los componentes. Un componente puede invocarse varias veces, y distintos componentes pueden estar activos simultáneamente sobre alcances diferentes.

Definición comprende GENESIS, ONTOLOGY, TOPOLOGY, MAPPING y CONSOLIDATION. Implementación comprende IMPLEMENTATION en relación con MAPPING y reentradas selectivas. El recorrido expresa responsabilidades, no un orden rígido de escritura: desde cualquier componente pueden registrarse aportes pertinentes en otros documentos como pendientes. Ningún aporte equivale a aprobación, cierre o prueba ejecutada. Consultar protocols/entry.md para proyectos en blanco, referencias anteriores y continuidad/adopción de proyectos trabajados.

### Aplicabilidad Y Alcance

- Se ejecuta solo el componente necesario para el alcance activo.
- El resultado debe ser suficiente para su consumidor, no completo para todo el futuro.
- Una salida cerrada siempre está limitada a su revisión, alcance e inputs.
- El trabajo exploratorio puede ocurrir aguas abajo, pero no crea aprobaciones ni compromisos irreversibles si depende de entradas no aprobadas.

### Continuidad

- **Nueva invocación:** nuevo incremento o cambio con alcance propio.
- **Revisión:** nueva versión de una salida para el mismo propósito.
- **Reentrada:** evidencia aguas abajo demuestra que una salida es insuficiente o incorrecta.

Una reentrada conserva la salida anterior, evalúa sus impactos y obtiene la autoridad necesaria. No autoriza modificaciones silenciosas.

Los documentos base registran invocaciones y cierres; no son especificaciones operativas. Una revisión fundamental de Genesis puede añadirse sin reescribir el cuerpo ni la decisión aprobados anteriormente. La evolución compatible actualiza las fuentes vigentes; la recuperación solo completa o repara materialización. Cada revisión identifica motivo, alcance, aprobación y resultados afectados.

### Suficiencia, Cierre, Aprobación Y Gate

- **Suficiencia:** el resultado contiene lo necesario para su propósito.
- **Cierre:** el trabajo definido para la invocación terminó.
- **Aprobación:** una autoridad acepta una decisión o resultado dentro de un alcance.
- **Gate:** Gobierno autoriza, detiene o condiciona una transición usando evidencia.

Cerrar un componente no autoriza automáticamente el siguiente. Un gate solo existe cuando el riesgo o la transición lo justifican.

### Modelo Humano-Agente

Los agentes investigan, infieren, proponen, ejecutan y verifican dentro de su autorización. La persona conserva autoridad sobre significado, cambios de producto, riesgos relevantes, decisiones irreversibles, excepciones y aceptación.

La operación puede evolucionar de agent-led a human-led, pero la autoridad humana sobre el producto existe desde el inicio. Ningún agente aprueba su propio trabajo ni resuelve una contradicción semántica por mayoría.

## GENESIS

### Transformación

```text
intención informal + evidencia contextual
    -> baseline explícito, defendible y aprobado
```

### Alcance

Construye el baseline inicial del producto, su primer incremento, límites, riesgos, incertidumbres y el alcance autorizado de Ontology.

### Entradas

Admite ideas, problemas, ejemplos, restricciones, documentos existentes, comportamiento observado e investigación selectiva. No exige modelo de dominio, arquitectura ni lenguaje técnico formal. Requiere una persona con autoridad para discutir y aprobar la interpretación.

### Salidas Y Garantías

Produce `docs/base/GENESIS.md` aprobado y `docs/glossary.md` fiel al vocabulario inicial. Specs y Backlog pertenecen al cierre posterior a Mapping. Una revisión fundamental preserva historia y reconcilia solo el alcance autorizado, sin regenerar el proyecto.

Dentro del alcance aprobado garantiza comprensión suficiente, límites visibles y ausencia de contradicciones materiales conocidas. No garantiza viabilidad técnica total, completitud semántica, product-market fit ni autorización de implementación.

### Exclusiones Y Cierre

No aprueba dominios, repositorios, APIs, tablas, frameworks ni tecnología. Cierra con aprobación humana identificable del contenido exacto, incremento inicial observable, Genesis/Glossary revisados por significado, bloqueantes resueltos y diferidos explícitos. Una revisión semántica independiente del candidato basta; administración y escritura se comprueban por código.

La aprobación congela el cuerpo de esa revisión, no el archivo para siempre. Los cambios fundamentales generan propuesta y aprobación propias. Aprobación, materialización y cierre son hechos distintos; Materialización registra cierre y evidencia sin depender de Backlog.

## ONTOLOGY

### Transformación

```text
canon aprobado + alcance activo
    -> semántica estructurada, referenciable y aprobada
```

### Alcance

Explicita conceptos, vocabulario, reglas, invariantes, estados, relaciones, fronteras y obligaciones necesarias. No exige múltiples dominios: un documento de dominio proporcional puede reunir la semántica de un proyecto pequeño. No depende de Specs prematuro.

### Entradas

Consume inicialmente Genesis aprobado y Glossary, alcance, riesgos y heurísticas pertinentes. En reentradas consume dominios y contratos vigentes. Evidencia técnica informa, pero no crea decisiones semánticas.

### Salidas Y Garantías

Produce `docs/base/ONTOLOGY.md`, `docs/domains/`, contratos semánticos aplicables en `docs/contracts/<nombre>/contract.md` y actualización de Glossary. El registro base referencia el paquete aprobado sin duplicarlo. ADR arquitectónicos pertenecen a Topology; no se exige Specs o Backlog todavía.

No garantiza una realización técnica correcta, una frontera de despliegue, una API, una tabla, un repositorio ni una verificación ejecutada.

### Exclusiones Y Cierre

No decide ownership técnico, paquetes, endpoints, tablas, payloads, transporte o frameworks. Cierra cuando las fronteras y obligaciones aplicables son explícitas, no hay contradicciones bloqueantes y la revisión exacta fue aprobada.

Puede reentrar si la implementación revela una regla, relación o frontera incorrecta. La nueva revisión evalúa selectivamente sus impactos aguas abajo.

## TOPOLOGY

### Transformación

```text
responsabilidades semánticas + incremento + realidad física
    -> organización física mínima y disponible
```

### Alcance

Define unidades físicas y repositorios reales, responsabilidades, dependencias dirigidas, interfaces relevantes, playbooks activados, estados de disponibilidad y decisiones topológicas.

### Entradas

Consume Ontology aprobada, el incremento activo, repositorios existentes, restricciones técnicas, ADR aplicables y dependencias observadas.

### Salidas Y Garantías

Produce `docs/base/TOPOLOGY.md`, `docs/architecture.md`, ADR aplicables en `docs/adrs/` y contratos técnicos aplicables. Puede vincular o fundar repositorios solo con autorización. Mapping consume arquitectura y contratos vigentes; los ADR explican decisiones sin sustituir la vista consolidada.

No garantiza cobertura detallada, implementación, compatibilidad funcional ni cierre del incremento.

### Exclusiones Y Cierre

No impone una arquitectura universal, no crea un repositorio por dominio y no registra símbolos, tablas o tests. `APP`, `SERVICES`, `DB`, `INFRA` y `WORKER` son playbooks activables, no capas obligatorias.

Cierra cuando las responsabilidades necesarias tienen destinos existentes o fundados, los estados y dependencias son comprobables, los playbooks están seleccionados y las decisiones humanas requeridas fueron obtenidas.

## MAPPING

### Transformación

```text
obligación referenciable + responsabilidad topológica
    <-> destino material + verificación + evidencia
```

### Alcance

Conecta una obligación semántica con una o más unidades topológicas, destinos materiales, verificaciones, evidencias, diferimientos o desviaciones. Su unidad es la relación entre obligación y aterrizaje, no un repositorio completo como narración.

### Entradas Y Salidas

Consume IDs semánticos estables, revisiones de fuente, IDs topológicos y destinos locales. Produce mappings bajo `<repo>/docs/mapping/` con estados como `assigned`, `implemented`, `verified`, `deferred` y `deviated`.

`assigned` permite comenzar cuando existe responsabilidad y destino topológico, aunque todavía falte el símbolo concreto. `implemented` exige un destino material. `verified` exige verificación pertinente y evidencia vigente; completar una fila no basta.

### Exclusiones Y Cierre

No redefine obligaciones, no sustituye Topology ni es backlog. El cierre inicial de asignación admite `assigned` con destino topológico real y verificación prevista, sin símbolos ni pruebas todavía inexistentes. El cierre posterior de realización exige destinos y evidencia materiales. Cada obligación tiene disposición explícita; las desviaciones tienen decisión o deuda.

Reentra si cambia la fuente, Topology, destino, verificación, entorno o evidencia. La invalidación debe ser selectiva y referenciada.

## CONSOLIDATION

Transforma definiciones parciales y decisiones vigentes en alcance, prioridades y secuencia coherentes y confirmados. Consume Genesis, Glossary, dominios, contratos, arquitectura, ADR, mappings y evidencia pertinentes. Produce `docs/specs.md` y `docs/backlog.md` según protocols/consolidation.md; los aportes anticipados a esos archivos no sustituyen esta transformación.

Specs ofrece definición global y alcance de V1 con referencias a detalle; Backlog prioriza el trabajo, sus dependencias y diferidos. Cierra con contradicciones bloqueantes resueltas, confirmación humana trazable del alcance/prioridades y fuentes consistentes. No añade requisitos por inferencia ni exige definir exhaustivamente el futuro. No necesita un registro base adicional, un agente nuevo ni demuestra First Release. La implementación del siguiente incremento requiere autorización explícita.

Reentra ante cambios de alcance, dependencias, prioridades o secuencia; preserva historia y reconcilia solo documentos afectados. Los informes de exploración quedan como antecedentes: ninguna decisión o justificación indispensable reside exclusivamente en support/ al cerrar.

## IMPLEMENTATION

### Transformación

```text
obligaciones asignadas + topología + contexto local
    -> realidad material + evidencia + aprendizaje reconciliado
```

### Alcance

Materializa comportamiento, datos, schemas, configuración, pruebas, documentación local necesaria y evidencia para un incremento de valor.

### Entradas Y Salidas

Consume canon, Ontology, Topology, mappings, playbooks y criterios de aceptación aplicables. Devuelve destinos materiales, verificaciones ejecutadas, mappings actualizados, limitaciones, riesgo residual y propuestas de reconciliación.

No requiere que todo el mapping del incremento esté terminado para comenzar, pero sí una asignación suficiente para el trabajo concreto.

### Exclusiones Y Cierre

No redefine significado silenciosamente, no convierte compilación o una suite verde en conformidad y no declara First Release por sí sola. Cierra cuando existe el comportamiento acordado, la evidencia pertinente, los mappings localizados, las desviaciones visibles, los consumidores reconciliados y las decisiones humanas necesarias.

Implementation puede provocar reentrada selectiva en componentes anteriores. Las fuentes vigentes reciben el cambio aprobado; una revisión fundamental se registra sin reescribir acuerdos anteriores. En modo `evolution`, los cambios sobre activos protegidos requieren evaluación proporcional de compatibilidad, migración y autoridad.

## Dependencias E Impacto

| Cambio | Consumidores principales | Impacto |
| --- | --- | --- |
| Recuperación de proyecciones de Genesis | Fuentes derivadas y entrada a Ontology | Completar o reparar sin cambiar el snapshot ni sobrescribir fuentes ya evolucionadas. |
| Cambio de canon | Ontology, Mapping e Implementation | Revisar obligaciones y mappings afectados. |
| Revisión de Ontology | Topology, Mapping e Implementation | Evaluar fronteras, responsabilidades y realizaciones. |
| Cambio de Topology | Mapping e Implementation | Revisar unidades, destinos y dependencias. |
| Cambio de Mapping | Implementation y Aseguramiento | Ajustar trabajo, pruebas o evidencia. |
| Cambio material | Mapping y upstream aplicable | Actualizar destino, evidencia y clasificación de divergencia. |

No todo cambio invalida todo el trabajo. La propagación debe basarse en referencias y alcance.

Las consultas y revisiones de registros base se rigen por `../CSDD.md`: primero se contrastan fuentes vigentes, se justifica la procedencia necesaria y se transfieren los resultados al artefacto competente. Los cierres identifican revisiones exactas y pendientes, sin convertirse en otra especificación vigente.

## Validación Del Método

La madurez del componente no es un estado del producto ni una puntuación global. Puede afirmarse, con alcance y limitaciones explícitos, que un componente está:

- `defined`: contrato y protocolo coherentes;
- `exercised`: una invocación real fue cerrada;
- `feedback_exercised`: se probó reentrada por aprendizaje aguas abajo;
- `replicated`: funcionó en otro caso materialmente diferente;
- `operationally_observed`: se observó bajo uso real, cuando aplique.

La validación del núcleo debe recorrer un caso con aprobaciones, destino real, mapping inicialmente asignado, implementación, evidencia y una divergencia que provoque reentrada.
