# Reglas operativas del proyecto

Complementa [AGENTS.md](AGENTS.md) con acuerdos técnicos y específicos de CSDD.
No contiene planes ni resultados de ejecución. Modificar estos acuerdos requiere
aprobación del usuario.

## Automatización y contratos

- Reservar el LLM para interpretación y juicio semántico: intención, fidelidad,
  contradicciones, hallazgos, razones y límites de evidencia. Usar código
  determinista para preparación, partición, serialización, estructura, validación
  administrativa, cálculos e integridad.
- Obtener del runtime IDs de sesión/mensaje y fechas; generar por código referencias
  administrativas y vínculos entre revisiones. No encargar esos valores al LLM para
  después validar su formato o gastar llamadas reparándolos.
- Vincular el juicio a los archivos efectivamente revisados y calcular sus huellas.
  Una huella posterior no acredita qué se revisó si el contenido cambió.
- Cada componente usa una revisión semántica independiente de sus documentos
  candidatos antes de la aprobación. Administración y cierre se comprueban por
  código, sin una segunda revisión administrativa por modelo. Si cambia significado,
  se revisa el cambio antes de reutilizar la conformidad.
- Exigir exactitud administrativa y evaluar narrativa por significado: sin frases
  obligatorias ni clasificadores de palabras clave. No admitir aliases de claves
  administrativas; sí paráfrasis narrativas fieles.
- La estructura de los documentos CSDD pertenece al código: los scripts crean el
  esqueleto desde la plantilla; el LLM edita solo el contenido de las secciones y una
  guarda rechaza, antes de escribir, cambios en títulos, IDs o cuerpos aprobados.
  La administración la escriben solo los scripts.
- Separar framework, herramientas e integración: el framework define qué se exige
  sin depender de un CLI; las herramientas deterministas son scripts independientes
  del CLI; la integración solo conecta esas piezas con el harness. No poner en la
  integración lógica que pueda vivir en un script.
- Reconciliar contratos, validadores, guardas y evaluadores antes de ejecutar: todas
  las capas deben aplicar el mismo contrato, incluido el cierre.

## Preservación y recuperación

- Conservar exactamente cuerpos, decisiones e historia protegidos. Una paráfrasis
  fiel no autoriza reescribir contenido aprobado.
- Recuperar solo el paso incompleto tras inspeccionar las fuentes existentes;
  preservar evolución ajena al cambio, sin regenerar el proyecto desde la historia.
- La procedencia de aprobación debe provenir de una intervención realmente
  registrada; no inventar aprobaciones ni transcripts.

## Pruebas y evidencia

- Probar primero sin modelos lo comprobable mediante código, incluidos acceso a
  evidencia, contratos y controles de interrupción. No usar ensayos con modelos para
  descubrir incompatibilidades administrativas evitables.
- Una conversación humana real comprueba utilidad y fidelidad. Un ensayo automatizado
  con modelos fija antes sus criterios y sus límites de llamadas y tiempo; una prueba
  manual no los requiere.
- No rebajar criterios ni ajustar ad hoc ante una respuesta inesperada. Diagnosticar
  si se trata de defecto del producto, del experimento, interrupción o evidencia
  insuficiente antes de proponer otra ejecución.
- Estructura válida, huellas coincidentes o veredicto conforme no prueban verdad
  semántica. Procedencia registrada y aprobación simulada no autentican autoridad
  humana. Pruebas técnicas no acreditan calidad semántica.

## Avance por componente

- Cada componente avanza en dos pasos: una prueba del método con integración
  provisional y los ajustes del framework que resulten; después, su integración por
  código con pruebas deterministas y una sesión real.
- Al preparar la integración provisional de un componente se aplican las lecciones
  ya adoptadas en los anteriores.
- Un componente se congela cuando el trabajo pasa al siguiente; el último merge
  previo se marca con un tag anotado `hito-<componente>-<n>`, y lo que queda
  pendiente sigue en el backlog.
- Volver a un componente congelado no lo reabre: el cambio se hace desde un ítem
  del backlog o como ajuste explícito del ítem que lo motiva.

## Entrega y validación

- La integración con Claude Code vive en el `.claude/` del proyecto que adopta CSDD,
  sin componentes globales del usuario; `install.py` instala y actualiza framework
  e integración.
- Las herramientas deterministas nuevas usan Python 3 con biblioteca estándar, sin
  dependencias de terceros.
- Usar fixtures y runtimes aislados, sin modificar instalaciones globales o proyectos
  adoptantes para facilitar pruebas. Consultar ampliaciones de permisos o cambios
  de condiciones del entorno.

## Alcance autorizado

- `docs/` contiene producto; `.csdd/`, exclusivamente framework. Lectura histórica
  selectiva y justificada, nunca por defecto.
- Macrofases: Definición e Implementación. Recorrido de referencia: Genesis (base/GENESIS.md y glossary.md), Ontology
  (base/ONTOLOGY.md, domains/ y contratos semánticos), Topology
  (base/TOPOLOGY.md, architecture.md, adrs/ y contratos técnicos), Mapping
  (docs/mapping/ en cada repo), CONSOLIDATION (specs.md y backlog.md).
  Las rutas son relativas a docs/ salvo mapping local. V1 y prioridades requieren
  confirmación humana; cierre de definición no acredita implementación o entrega.
- Los seis componentes son GENESIS, ONTOLOGY, TOPOLOGY, MAPPING,
  CONSOLIDATION e IMPLEMENTATION. Los cuatro pilares son transversales.
  El recorrido no impone orden rígido de escritura: se permiten aportes pertinentes
  pendientes a cualquier documento, sin aprobación ni cierre implícitos. La
  implementación del siguiente incremento requiere autorización explícita.
- Entrada: proyecto en blanco, nuevo con referencia anterior o ya trabajado
  (continuidad con CSDD o adopción gradual). Preservar trabajo existente; no
  convertir hallazgos antiguos en requisitos ni fabricar aprobaciones históricas.
- Contratos en docs/contracts/<nombre>/contract.md con archivos asociados opcionales.
  docs/support/ admite consulta externa e informes de exploración local/web,
  incluso del repositorio actual. Son evidencia, no decisiones. Apoyan toda
  Definición y quedan históricos tras CONSOLIDATION; ninguna decisión o
  justificación indispensable puede residir exclusivamente allí al cerrar.
- Mantener cuatro agentes: Orchestrator conversa y coordina, Canon interpreta y es
  responsable editorial de toda salida en docs/, Reviewer verifica
  independientemente y Explorer investiga para Orchestrator o Canon y solo escribe
  su propio informe en docs/support/. Encargos acotados, fuentes autorizadas y
  lectura local/web; los informes no se mantienen como especificación paralela.
- No incorporar Architect, Implementer, coordinador, MCP, ledger ni maquinaria
  Legacy sin cambio explícito de alcance aprobado.
- No modificar CSDD Legacy, Lunes, Stalwart ni proyectos adoptantes.
