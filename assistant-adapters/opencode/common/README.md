# Núcleo Compartido

## Estado Vigente Tras Simplificación

Genesis produce solo Genesis y Glossary. genesis.contract.json define esas salidas;
consolidation.contract.json define Specs/Roadmap para CONSOLIDATION.
Una revisión semántica del candidato exige intent_fidelity y preserved_rules.
V2 registra el juicio y comprueba administración por código; no exige administrative
LLM. La recuperación no depende de Roadmap. La suite vigente usa *.test.mjs;
checkpoints.historical.mjs conserva el evaluador anterior y no valida el nuevo flujo.
Las secciones de resultados siguientes documentan etapas anteriores, no el estado vigente.

## Escritura Estructurada Integrada

`lib/structure.mjs` valida entradas de las cinco plantillas de Genesis contra `framework/templates/genesis.contract.json`, renderiza Markdown y proyecta esquemas estándar. `build/structure.mjs` reexporta ese núcleo. `build/template-reference.mjs` deriva referencias humanas y `build/generate-templates.mjs` las escribe o comprueba con --check. El contrato usa un vocabulario cerrado de tipos, campos y condiciones; no evalúa código ni incorpora dependencias nuevas.

`lib/structured-write.mjs` conecta entrada única artifact/operation/data con persistencia y guardas. create crea, update parchea lo persistido y append añade una revisión fundamental; no admite content ni aliases. Recupera del archivo las zonas aprobadas y las preserva. La tool mantiene un contador por workspace/sesión/artefacto en memoria del plugin: entrega inicial y hasta cuatro reparaciones, parada por repetición o error terminal. No es durable ante reinicio. `RepairCycle` sigue como controlador puro probado; la tool implementa su contador operativo por separado. Una decisión semántica humana ausente se devuelve mediante los perfiles, no se infiere desde JSON válido ni se autentica por huella.

`lib/administrative.mjs` lee exclusivamente el bloque escalar inicial de cada administración. Escritura y recuperación comparan estados y huellas en sus campos concretos; la narrativa no autoriza cierre ni suplanta referencias. Los códigos de guarda, no sus explicaciones, controlan la reparación. El parser de notas conserva subtítulos narrativos de nivel 3 salvo encabezados administrativos generados reservados.

`lib/review-report.mjs` valida la forma del reporte JSON de Reviewer y separa revisión semantic (incluye preserved_rules con evidencia) de comprobación administrative (sin evaluación semántica nueva). Los evaluadores de pruebas contrastan sesión e identidad, cada huella en su campo y la evidencia de reglas de una revisión semántica sobre las versiones materializadas. Ni JSON válido ni veredicto declarado prueban por sí mismos la corrección del juicio.

Suite de ajuste de la frontera literal/semántica: common + V2, 64 pruebas, 62 aprobadas, 2 omitidas por permisos de symlink, ningún fallo. Incluye regresiones por cierre citado en notas, huellas incorrectas suplidas en narrativa, subtítulos permitidos, reportes citados y falsa equivalencia entre revisión administrativa y semántica. No se ejecutaron modelos. La evidencia agentic anterior no certifica el ZIP reconstruido con estos ajustes; detalle y limitaciones en v2/README.md.

Ajuste posterior del evaluador conversacional: Reviewer distingue draft (solo Genesis, intent_fidelity), semantic (las cuatro fuentes, preserved_rules) y administrative (las cuatro versiones finales y semantic_review_reference). El cierre enlaza una evaluación semántica real anterior; el registro posterior no reescribe secciones de producto de Roadmap. V2 incorpora fixtures predefinidas, checkpoints con adjudicación explícita, snapshots completos de documentos y reconstrucción temporal de versiones; no usa coincidencia narrativa para decidir qué pregunta responder. Suite common + V2: 81 pruebas, 79 aprobadas, 2 omitidas y cero fallos; sin modelos. Adjudicación semántica y robustez de los agentes siguen pendientes de ensayo, no se acreditan por la suite determinista.

`lib/artifacts.mjs`, `lib/revision.mjs` y `lib/write.mjs` contienen las operaciones deterministas de Genesis. Solo usan la biblioteca estándar de Node.js; no importan OpenCode ni conceden permisos a agentes.

`tests/` verifica destinos cerrados, canonicalización, referencias, escritura atómica y preservación de registros. La identidad del agente, las APIs de sesión, el registro de herramientas y las pruebas de delegación pertenecen a cada integración de versión.

`lib/recovery.mjs` gestiona una única marca técnica de trabajo incompleto en `docs/base/.genesis-recovery-pending`. Se crea antes de escribir Genesis y se retira únicamente con cierre coherente o rechazo dispuesto. Cubre ventanas entre escrituras, no autentica aprobación ni transforma una revisión semántica en operación determinista. Presupone un escritor por workspace. Los registros rechazados y abandonados se conservan y permiten propuestas posteriores con ID nuevo.

Las integraciones componen estos módulos dentro del workspace instalado. Ningún import de producción debe depender de la ubicación del repositorio fuente.

`prompts/` conserva instrucciones de los cuatro agentes, comunes a ambas versiones. `build/agents.mjs` solo concatena el frontmatter con el cuerpo compartido durante construcción del ZIP o preparación de fixtures fuente; no introduce un DSL ni interpretación mediante LLM. No se instala ese builder ni el directorio de prompts: cada perfil instalado es autosuficiente.
