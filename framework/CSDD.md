# CSDD - Desarrollo Guiado por Semántica Canónica

## Propósito

CSDD es un marco metodológico para transformar una intención humana en un producto comprensible, implementable y evolutivo. Su objetivo es mantener alineados el significado compartido, las decisiones, la realización y la evidencia, usando solo el rigor que justifiquen el valor, la incertidumbre y el riesgo.

CSDD no sustituye los marcos técnicos de los componentes del producto. Define la capa común que permite que esos marcos implementen el mismo producto sin redefinirlo silenciosamente.

## Principios

### Valor antes que ceremonia

Ningún documento, aprobación, control o paso adicional se justifica por existir en una plantilla. Quien proponga una práctica debe poder explicar qué riesgo, incertidumbre o decisión protege y por qué una alternativa menor no basta.

### Inferir antes que preguntar

La persona suele aportar ideas, problemas, features y ejemplos, no un modelo formal. CSDD espera que la IA transforme ese material en una propuesta comprensible, investigue lo necesario y pregunte solo por decisiones que puedan cambiar el producto.

### Significado compartido antes de dependencias

Antes de crear dependencias entre componentes o consolidar una decisión, debe ser explícita la intención vigente, su grado de certeza y el alcance en que aplica.

### Autoridad humana explícita

La IA puede investigar, inferir, desafiar, proponer y ejecutar dentro de su autorización. Solo la autoridad humana puede aceptar la interpretación del producto, cambiar decisiones de producto, aceptar riesgos relevantes o declarar First Release.

### Aplicabilidad antes que presencia

Un artefacto o control se activa cuando existe una necesidad demostrable. La ausencia de un elemento no aplicable no es deuda ni incumplimiento.

### Rigor proporcional

El rigor crece con el impacto de equivocarse, la dificultad de detectar o revertir el error y el alcance de las personas, datos o dependencias afectadas. La robustez no significa adoptar toda práctica disponible.

### Intención y realidad no se confunden

La semántica describe lo que el producto debe ser o hacer. La implementación y la observación describen lo que ocurre. Una divergencia se analiza y reconcilia; ninguna fuente sobrescribe silenciosamente a la otra.

### La implementación produce aprendizaje

CSDD no exige conocer todo antes de construir. El trabajo puede revelar que una intención, regla o prioridad debe cambiar. El aprendizaje relevante vuelve a la fuente durable correcta.

## Pilares

Los pilares colaboran, pero no deben duplicar autoridad.

| Pilar | Responsabilidad |
| --- | --- |
| Metodología | Define cómo una necesidad se convierte en valor, aprendizaje y decisiones revisables. |
| Gobierno | Define quién decide, qué alcance se autoriza y qué riesgos requieren intervención humana. |
| Orquestación | Coordina personas, responsabilidades, dependencias, secuencia y estado del trabajo. |
| Aseguramiento | Determina qué se conoce, con qué evidencia y con qué limitaciones. |

Un gate, cuando sea necesario, es una decisión de gobierno sustentada por evidencia de aseguramiento y coordinada por orquestación. No es un artefacto obligatorio del método.

## Unidad De Trabajo

La unidad metodológica es el **incremento de valor**. Puede entregar una capacidad, validar una hipótesis, reducir un riesgo o producir un aprendizaje que cambie una decisión.

Un incremento de valor debe tener, con la profundidad que corresponda:

- necesidad u oportunidad y destinatario;
- resultado observable o aprendizaje esperado;
- alcance y exclusiones;
- criterio de cierre;
- incertidumbre y riesgo principales.

Un `slice` es un incremento de valor pequeño que recorre lo necesario para demostrar su resultado. Una iniciativa puede agrupar varios incrementos cuando su alcance o riesgo lo justifica. Una tarea o interacción no es, por sí misma, una unidad de valor.

## Ciclo Metodológico

```text
Entender
  -> delimitar significado e incertidumbre
  -> seleccionar el menor incremento valioso
  -> realizar
  -> verificar comportamiento y resultado
  -> aprender y reconciliar
  -> continuar, corregir o retirar
```

El recorrido aplicable puede ser menor. No se ejecuta una etapa ni se crea un artefacto solo porque el árbol de referencia lo sugiera.

## Modelo Detallado

El contrato estable, las fronteras, las entradas, las salidas, la reentrada y el cierre de `GENESIS`, `ONTOLOGY`, `TOPOLOGY`, `MAPPING`, `CONSOLIDATION` e `IMPLEMENTATION` están definidos en [`core/components.md`](core/components.md).

Dos macrofases organizan el trabajo: **Definición** (GENESIS → ONTOLOGY → TOPOLOGY → MAPPING → CONSOLIDATION) e **Implementación** (IMPLEMENTATION ↔ MAPPING con reentradas selectivas). El recorrido no obliga a escribir en orden: cualquier componente puede originar aportes pendientes en los documentos pertinentes. Registrar una entrada no aprueba, ejecuta ni cierra el componente destinatario. La definición suficiente no exige conocer todo el futuro; implementar el siguiente incremento requiere autorización explícita.

Las entradas son proyecto en blanco, proyecto nuevo con referencia anterior y proyecto ya trabajado, con o sin CSDD. Aplicar [protocols/entry.md](protocols/entry.md): continuidad o adopción gradual, nunca regeneración automática ni aprobación retrospectiva.

La ejecución concreta de cada componente está definida en `protocols/`. Los pilares transversales, su desarrollo proporcional y su aplicación por componente están definidos en [`core/pillars.md`](core/pillars.md). Las influencias metodológicas se explican, sin autoridad normativa, en [`core/foundations.md`](core/foundations.md).

## Autoridad Del Framework

| Documento | Responsabilidad |
| --- | --- |
| `CSDD.md` | Constitución: propósito, principios, composición del núcleo, lifecycle y autoridad global. |
| `core/components.md` | Contrato de los seis componentes, sus fronteras, reentrada y cierre. |
| `core/pillars.md` | Responsabilidades transversales, proporcionalidad, evidencia y gobierno de los pilares. |
| `protocols/*.md` | Procedimientos para ejecutar invocaciones conforme al contrato del componente. |
| `heuristics/*.md` | Instrumentos de razonamiento; no originan autoridad autónoma. |
| `templates/*.md` | Formas iniciales; no activan obligaciones por sí mismas. |
| `core/foundations.md` | Explicación consultiva de influencias y decisiones; no es normativa. |

Una contradicción entre documentos normativos es un defecto del framework. Debe reconciliarse y no resolverse mediante una precedencia implícita del documento más específico.

## Lifecycle

El lifecycle inicial es:

```text
genesis -> pre_fr -> post_fr
```

- `genesis`: se está construyendo y discutiendo el informe; todavía no existe aprobación.
- `pre_fr`: Génesis fue aprobada. El diseño semántico posterior puede comenzar una vez completadas y verificadas sus proyecciones. El modelo vivo puede evolucionar dentro de su autorización; una revisión fundamental conserva el acuerdo inicial y requiere una nueva aprobación.
- `post_fr`: una persona declaró formalmente First Release. El comportamiento, datos, contratos, consumidores y otros activos identificados en esa declaración quedan protegidos por defecto.

No existe `fr_ready`. La preparación para FR es una evaluación, no un estado durable.

Antes de CONSOLIDATION, aprobación y cierres se registran en los artefactos competentes; Roadmap puede recibir aportes pendientes, sin representar alcance consolidado ni aprobación. Después, `docs/roadmap.md` conserva el lifecycle y la dirección actual. Una revisión fundamental no reinicia el lifecycle ni reescribe decisiones anteriores.

Genesis cierra con Genesis y Glossary aprobados y verificados. La ausencia de Specs o Roadmap es normal antes del cierre posterior a Mapping; no invalida ninguna aprobación ni obliga a recuperación.

## Autoridad Documental

| Documento | Autoridad |
| --- | --- |
| `docs/base/GENESIS.md` | Procedencia, decisiones, aprobación, resultados y cierre de la definición inicial y sus revisiones fundamentales. |
| `docs/specs.md` | Definición global consolidada y alcance acordado de V1, después de Mapping. |
| `docs/glossary.md` | Significado y nombre preferido de términos compartidos. |
| `docs/roadmap.md` | Secuencia hacia V1, lifecycle, posibilidades posteriores y diferidos con razones; después de Mapping. |
| `docs/base/ONTOLOGY.md` | Registro de invocaciones, evaluaciones, manifiestos aprobados, resultados y cierres semánticos. |
| `docs/domains/*` | Significado, reglas, invariantes y estados dentro de una frontera semántica. |
| `docs/contracts/<nombre>/contract.md` | Acuerdos semánticos o técnicos según su alcance, con archivos asociados opcionales en la misma carpeta. |
| `docs/adrs/*` | Contexto, alternativas y consecuencias de decisiones arquitectónicas durables. |
| `docs/base/TOPOLOGY.md` | Registro de invocaciones, decisiones, resultados y cierres de organización física. |
| `docs/architecture.md` | Unidades reales, rutas, responsabilidades, dependencias, interfaces, disponibilidad y playbooks vigentes. |
| `<repo>/docs/mapping/*` | Asignaciones desde obligaciones semánticas hacia destinos de implementación y su evidencia. |
| Implementación | Código, datos, configuración, pruebas y evidencia de la realidad materializada. |
| `docs/support/*` | Consulta externa e informes de exploración local/web, sin autoridad normativa ni compromisos. |

`.csdd/` contiene exclusivamente el framework; las salidas del producto pertenecen a `docs/` y a la documentación local de sus unidades. Los nombres abreviados de artefactos en los protocolos se resuelven según esta tabla. Las carpetas se crean solo con contenido aplicable. `AGENTS.md` conserva reglas de colaboración, no significado del producto.

Cada regla tiene una única ubicación normativa vigente. Inicialmente Genesis expresa la intención; Ontology formaliza reglas en dominios y contratos, sin copiar su catálogo en el registro base. Specs consolida después una síntesis con referencias, no una especificación paralela. Los registros base conservan procedencia y decisiones; no duplican los artefactos especializados.

El recorrido de Definición es GENESIS → ONTOLOGY → TOPOLOGY → MAPPING → CONSOLIDATION con Specs y Roadmap. Este cierre confirma con la persona alcance de V1 y prioridades, no acredita implementación ni First Release. Ver protocols/consolidation.md. Glossary evoluciona con los componentes. Reentradas posteriores afectan únicamente el alcance necesario. GENESIS y los demás documentos informan cualquier componente pertinente, no solo al siguiente.

support/ admite informes de exploración del proyecto anterior o del repositorio actual además de consulta externa. Son insumos para toda Definición, no decisiones ni requisitos vigentes. Canon incorpora lo confirmado y su justificación suficiente a las fuentes competentes; al cerrar CONSOLIDATION, retirarlo debe dejar completa la definición y su justificación necesaria. Conserva lo observado como antecedente histórico, no como documento sincronizado con el producto. No aloja diferidos propios ni soportes normativos de contratos; se consulta selectivamente.

## Registros Base Y Lectura Selectiva

Un cierre corresponde a una invocación, alcance y revisión, no es permanente para el componente. Los registros base pueden incorporar revisiones sucesivas con identidad, motivo, decisiones sustituidas, aprobación y resultados exactos. Se preservan los cuerpos y decisiones aprobados anteriores. Las correcciones editoriales no alteran su significado; los metadatos de materialización pueden completarse durante recuperación.

El trabajo consume las fuentes pertinentes que ya existen en su punto del ciclo. Ontology inicialmente consume Genesis y Glossary; después se usan dominios, contratos, arquitectura y mappings. Specs y Roadmap solo se exigen después del cierre de definición. Una feature compatible posterior no obliga a releer Genesis. La historia restante se consulta durante elaboración, aprobación, recuperación, cambio fundamental o procedencia justificada.

La consulta identifica pregunta, fuente pertinente, alcance y motivo. Orchestrator o Canon pueden encargar a Explorer investigación local o web. Canon mantiene la interpretación y es responsable editorial de docs/, incluidos los informes de Explorer. Reviewer verifica independientemente cuando se le encarga. Si falta significado, se solicita reconciliación, no se reconstruye el producto desde toda la historia. Esta es una política de contexto, no un bloqueo técnico de lectura.

Un cambio de propósito, destinatarios o límites fundamentales puede activar Genesis; uno de significado o fronteras activa Ontology; uno de organización física activa Topology. No se reabren todos por defecto. Después de First Release se evalúan también compatibilidad, migración y compromisos protegidos. Si una consulta descubre información vigente omitida, se completa la fuente competente para evitar repetir la consulta.

## Evidencia Y Reconciliación

La evidencia debe responder a una incertidumbre, criterio de aceptación o riesgo concreto. Su suficiencia depende de pertinencia, capacidad para detectar un fallo relevante, limitaciones explícitas y costo proporcional.

Cuando intención y realización divergen, se decide si debe cambiar la intención, la implementación o ambas. Las decisiones relevantes se incorporan a la fuente durable correspondiente. La coordinación temporal se retira o se convierte en conocimiento durable cuando deja de ser necesaria.

## Evolución De La Metodología

La baseline metodológica solo debe crecer cuando exista un problema observado que lo justifique. Todo nuevo artefacto, estado, aprobación o control debe tener un consumidor, un riesgo cubierto y un criterio de retirada.
