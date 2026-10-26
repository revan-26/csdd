# CSDD

CSDD transforma intención humana en una definición comprensible, implementable y evolutiva, con rigor proporcional. La IA estructura y revisa; la persona decide significado, alcance y prioridades.

## Macrofases Y Componentes

Definición recorre GENESIS → ONTOLOGY → TOPOLOGY → MAPPING → CONSOLIDATION.
Implementación materializa incrementos mediante IMPLEMENTATION ↔ MAPPING, con
reentrada selectiva. El recorrido no impone un orden rígido de escritura: Canon
puede registrar aportes pendientes donde correspondan desde cualquier componente.

| Componente | Resultado del proyecto |
| --- | --- |
| GENESIS | docs/base/GENESIS.md y docs/glossary.md |
| ONTOLOGY | docs/base/ONTOLOGY.md, docs/domains/ y contratos semánticos aplicables |
| TOPOLOGY | docs/base/TOPOLOGY.md, docs/architecture.md, docs/adrs/ y contratos técnicos aplicables |
| MAPPING | docs/mapping/ en cada repositorio, inicialmente con asignaciones |
| CONSOLIDATION | docs/specs.md y docs/roadmap.md, con alcance de V1 y prioridades confirmados |
| IMPLEMENTATION | Comportamiento materializado, verificaciones y aprendizaje reconciliado |

El cierre de definición no demuestra implementación ni entrega de First Release. Implementation materializa después y devuelve aprendizaje; la reentrada afecta solo las fuentes necesarias.

Cada contrato ocupa docs/contracts/<nombre>/contract.md y puede incluir YAML, JSON, XML u otros archivos asociados. Glossary evoluciona con los componentes. Specs sintetiza y referencia, sin duplicar reglas; Roadmap conserva secuencia, posibilidades posteriores y diferidos con razones.

docs/support/ admite consulta externa e informes de exploración local/web del proyecto anterior o actual. Apoyan toda Definición y quedan como antecedentes tras CONSOLIDATION: entonces ninguna decisión o justificación indispensable reside exclusivamente allí. No se sincronizan con el producto ni aprueban alcance.

Entradas: proyecto en blanco, nuevo con referencia anterior y ya trabajado (continuidad CSDD o adopción gradual). Ver framework/protocols/entry.md. Preservar trabajo, distinguir hallazgos de decisiones y no inventar aprobaciones retrospectivas.

## Estructura Fuente

- framework/: metodología, protocolos y plantillas; se instala como .csdd/.
- La integración objetivo es un plugin de Claude Code, todavía no disponible; sus herramientas deterministas usarán Python 3 con biblioteca estándar.
- AGENTS.md: colaboración; OPERATIONS.md: acuerdos técnicos.

.csdd/ contiene exclusivamente framework; docs/ contiene producto. Antes de Ontology, Genesis y Glossary son las entradas pertinentes; no se exige Specs o Roadmap prematuramente. La historia se consulta selectivamente y con motivo.

## Operativa Y Validación

No hay operativa agentic implementada: el adapter OpenCode fue retirado y la integración con Claude Code está por construir. Los roles se mantienen: Orchestrator conversa y coordina, Canon estructura y escribe, Reviewer revisa independientemente y Explorer investiga solo cuando aporta valor. Una revisión semántica del candidato y Glossary precede a la aprobación; el código comprueba administración y cierre, sin segunda revisión LLM obligatoria.

Canon es responsable editorial de docs/. Explorer investiga para Orchestrator o Canon, en fuentes locales y web, con objetivo y límites. No se incorporan agentes adicionales.

La validación usa pruebas deterministas para controles y una conversación humana real para utilidad y fidelidad. No exige repetir siete simulaciones completas después de cada cambio. Resultados anteriores permanecen históricos y no certifican candidatos nuevos.

Consultar el estado actual en [ROADMAP.md](ROADMAP.md). Pruebas verdes no demuestran calidad semántica ni madurez global.

Instalación del framework: [INSTALL.md](INSTALL.md).
