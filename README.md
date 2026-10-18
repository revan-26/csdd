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
- assistant-adapters/opencode/common/: núcleo determinista, prompts y pruebas.
- assistant-adapters/opencode/v1/: integración conservada, no certificada por este ajuste.
- assistant-adapters/opencode/v2/: integración activa, baseline OpenCode 2.0.22.
- dist/: `CSDD-opencode2-v0.1.0.zip`, candidato Windows para OpenCode V2, preparado para instalación por copia con BAT. `0.1.0` es la versión de la distribución CSDD; la baseline de OpenCode permanece en 2.0.22.
- AGENTS.md: colaboración; OPERATIONS.md: acuerdos técnicos.

.csdd/ contiene exclusivamente framework; docs/ contiene producto. Antes de Ontology, Genesis y Glossary son las entradas pertinentes; no se exige Specs o Roadmap prematuramente. La historia se consulta selectivamente y con motivo.

## Operativa Y Validación

La operativa agentic implementada cubre Genesis: Orchestrator conversa, Canon estructura/escribe, Reviewer revisa independientemente y Explorer investiga solo cuando aporta valor. Una revisión semántica del candidato y Glossary precede a la aprobación; el código comprueba administración y cierre, sin segunda revisión LLM obligatoria.

Canon es responsable editorial de docs/. Explorer investiga para Orchestrator o Canon, en fuentes locales y web, con objetivo y límites. csdd_document permite informes consultivos nuevos y aportes pendientes a los demás documentos preservando contenido previo; no acredita aprobación/cierre de Ontology, Topology, Mapping o CONSOLIDATION, cuya operativa completa sigue pendiente. No se incorporan agentes adicionales.

La validación usa pruebas deterministas para controles y una conversación humana real para utilidad y fidelidad. No exige repetir siete simulaciones completas después de cada cambio. Resultados anteriores permanecen históricos y no certifican candidatos nuevos.

Consultar el estado y evidencia actuales en [ROADMAP.md](ROADMAP.md) y [adapter V2](assistant-adapters/opencode/v2/README.md). La conversación humana real del flujo simplificado sigue pendiente; pruebas verdes no demuestran calidad semántica ni madurez global.

Instalación y construcción: [INSTALL.md](INSTALL.md). El receptor del ZIP no ejecuta npm ni transforma imports. La entrega es candidata; no se declara validación en máquina limpia con red físicamente bloqueada.
