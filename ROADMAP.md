# Roadmap De CSDD

Documento del framework fuente, no Roadmap de un proyecto adoptante ni parte del payload instalable.

## Estado Vigente

| Área | Estado | Pendiente |
| --- | --- | --- |
| Macrofases | Definición: GENESIS → ONTOLOGY → TOPOLOGY → MAPPING → CONSOLIDATION; Implementación: IMPLEMENTATION ↔ MAPPING | Ejercitar componentes posteriores incrementalmente |
| Integración Claude Code | Plugin no iniciado. Decidido: Orchestrator como rol de la sesión principal con skills, subagentes y hooks; estructura de documentos a cargo del código; herramientas en Python 3 con biblioteca estándar. El framework ya describe esa escritura, sin implementación todavía | Prototipo mínimo; plantillas como esqueletos junto con el verificador |
| Contratos | Carpetas contract.md + archivos asociados; alcance semántico/técnico distinguido | Uso en un caso material |
| Entradas y exploración | En blanco, con referencia anterior y trabajado; Explorer local/web para Orchestrator o Canon | Validación humana en caso real |
| Escritura y Support | Canon persiste informes consultivos nuevos y aportes pendientes con preservación; support apoya toda Definición | Aprobación/reconciliación operativa de documentos posteriores a Genesis |
| Ontology/Topology/Mapping/CONSOLIDATION | Contratos y protocolos; aportes documentales pendientes disponibles | Operativa de aprobación/cierre completa |
| Implementation | Protocolo metodológico existente | Caso real con código, evidencia y reconciliación |

## Prioridad

Construir el prototipo mínimo de la integración Claude Code y ejercitarlo con un caso real. Corregir defectos mediante reproducciones pequeñas, sin anticipar perfiles o infraestructura.

## Validación Proporcional

- Código para escritura, aprobación, preservación, rechazo, recuperación, acceso a evidencia e instalación.
- Casos preparados para regresiones; no reconstruir todas las conversaciones.
- Una conversación humana real para comprobar utilidad, fidelidad y fluidez.
- Modelos con objetivo y límites explícitos; sin reintentos ni aumentos automáticos.
- Recorrido completo repetido solo ante cambios sustanciales del flujo.

## Historia Y Límites

El adapter OpenCode (V1 y V2), su distribución ZIP y su evidencia de ensayos fueron retirados del árbol; la historia de git los conserva. Esa evidencia no certifica la integración Claude Code.

Se mantienen cuatro roles; no se incorporan Architect, Implementer, coordinador, MCP o ledger. No se modifican proyectos adoptantes.
