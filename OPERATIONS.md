# Reglas operativas del proyecto

Complementa [AGENTS.md](AGENTS.md) con acuerdos técnicos y específicos de CSDD.
No contiene planes ni resultados de ejecución. Modificar estos acuerdos requiere
aprobación del usuario.

## Automatización y contratos

- Antes de implementar, consultar el scaffold y los estándares locales y comprobar
  su cumplimiento. Consultar cualquier cambio de una decisión vigente fuera del
  alcance autorizado.
- Reservar el LLM para interpretación y juicio semántico: intención, fidelidad,
  contradicciones, hallazgos, razones y límites de evidencia. Usar código
  determinista para preparación, partición, serialización, estructura, validación
  administrativa, cálculos e integridad.
- Obtener del runtime IDs de sesión/mensaje y fechas; generar por código referencias
  administrativas y vínculos entre revisiones. No encargar esos valores al LLM para
  después validar su formato o gastar llamadas reparándolos.
- Vincular el juicio a los archivos o snapshots efectivamente revisados y calcular
  sus huellas. Una huella posterior no acredita qué se revisó si el contenido cambió.
- Genesis utiliza una revisión semántica independiente de Genesis y Glossary
  candidatos antes de aprobación. Administración y cierre se comprueban por código,
  sin segunda revisión administrativa obligatoria por modelo. Si cambia significado,
  se revisa el cambio antes de reutilizar conformidad.
- Exigir exactitud administrativa y evaluar narrativa por significado: sin frases
  obligatorias ni clasificadores de palabras clave. No admitir aliases de claves
  administrativas; sí paráfrasis narrativas fieles.
- La estructura de los documentos CSDD pertenece al código: los scripts crean el
  esqueleto desde la plantilla; el LLM edita solo el contenido de las secciones y una
  guarda rechaza, antes de escribir, cambios en títulos, IDs o cuerpos aprobados.
  Glosario, decisiones y hallazgos se escriben mediante comandos con campos planos.
  La administración la escriben solo los scripts.
- Separar framework, herramientas e integración: el framework define qué se exige
  sin depender de un CLI; las herramientas deterministas son scripts independientes
  del CLI; la integración solo conecta esas piezas con el harness. No poner en la
  integración lógica que pueda vivir en un script.
- Canon es responsable editorial de toda salida en docs/. Los aportes entre
  componentes y los informes usan escritura controlada sin reinterpretar ni
  sobrescribir cuerpos o decisiones protegidos. Explorer solo investiga; no edita.
- Reconciliar contratos, validadores, guardas y evaluadores antes de ejecutar: todas
  las capas deben aplicar el mismo contrato, incluido el cierre.

## Preservación y recuperación

- Conservar exactamente cuerpos, decisiones e historia protegidos. La libertad de
  paráfrasis de una proyección no autoriza reescribir contenido aprobado.
- Recuperar solo el paso incompleto tras inspeccionar las fuentes existentes;
  preservar evolución ajena al cambio, sin regenerar el proyecto desde la historia.
- La procedencia de aprobación debe provenir de una intervención realmente
  registrada; no inventar aprobaciones ni transcripts.
- Permitir una entrega inicial y hasta cuatro reparaciones; detenerse por repetición,
  agotamiento o cambio protegido. No reiniciar sesiones o runtimes para eludirlo.

## Ensayos, recursos y evidencia

- Definir fixtures, decisiones simuladas, aclaraciones y criterios antes de gastar
  llamadas. Resolver preguntas solo con esas decisiones; ante una situación no
  prevista, detenerse y consultar sin improvisar para conseguir el cierre.
- Probar primero sin modelos lo comprobable mediante código, incluidos acceso a
  evidencia, contratos y controles de interrupción. No usar ensayos LLM para
  descubrir incompatibilidades administrativas evitables.
- Supervisar los checkpoints y conservar solicitud, decisión y evidencia. Un accept
  requiere invariantes deterministas y evidencia semántica suficientes; no sustituye
  las comprobaciones posteriores.
- No rebajar criterios ni ajustar ad hoc ante una respuesta inesperada. Diagnosticar
  si se trata de defecto del producto, del experimento, interrupción o evidencia
  insuficiente antes de proponer otra ejecución.
- Ejecutar recorridos secuencialmente, con parada ante el primer fallo o situación
  no prevista y sin reintentos automáticos. Una repetición autorizada es un intento
  nuevo, no una continuación que reinicie el presupuesto. Conservar reportes,
  snapshots, transcripts y consumo originales, sin sobrescribir ni reclasificar
  resultados históricos.
- Estimar entradas, salidas, revisiones y trabajo repetido y fijar límites antes de
  ensayos LLM. Si la viabilidad es incierta, probar en pequeño y revisar el consumo
  observado antes de escalar o prometer una corrida extensa.
- Validar primero por código; los casos de límites, rechazo y recuperación parten
  de estados preparados. Una conversación humana real comprueba utilidad y fidelidad.
  Antes de usar modelos fijar límite de llamadas y tiempo activo para ese caso;
  no ejecutar tandas extensas ni aumentar límites automáticamente.
- Contrastar timeouts con tiempos y logs reales; distinguir límite configurado de
  tiempo activo. Investigar suspensión, transporte y runtime antes de atribuir una
  ausencia de progreso al modelo.
- Informar consumo parcial o faltante. Uso ausente no significa cero; coste reportado
  cero no demuestra gratuidad sin tarifa verificable.
- Estructura válida, huellas coincidentes o verdict conforme no prueban verdad
  semántica. Procedencia registrada y aprobación simulada no autentican autoridad
  humana. Pruebas técnicas no acreditan calidad semántica ni robustez estadística;
  tres ejecuciones solo exploran variabilidad.
- Compactar sin perder evidencia; distinguir ahorro de esfuerzo de cambios en las
  condiciones del experimento.

## Entrega y validación

- La integración objetivo es un plugin de Claude Code. El adapter OpenCode, su ZIP
  y su BAT fueron retirados; la historia de git los conserva y no se mantienen.
- Las herramientas deterministas nuevas usan Python 3 con biblioteca estándar, sin
  dependencias de terceros.
- Usar fixtures y runtimes aislados, sin modificar instalaciones globales o proyectos
  adoptantes para facilitar pruebas. Consultar ampliaciones de permisos o cambios
  de condiciones del entorno.
- Identificar candidatos distribuibles por SHA-256. Si cambia producción, reconstruir
  el candidato y comprobar instalación y regresiones afectadas, sin heredar
  aprobaciones anteriores.
  No es obligatorio repetir siete recorridos con modelos. Repetir un recorrido
  completo solo si cambia sustancialmente su flujo; conservar evidencia histórica.

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
- Mantener cuatro agentes: Orchestrator conversa/coordina, Canon interpreta/escribe,
  Reviewer verifica independientemente y Explorer investiga para Orchestrator
  o Canon. Encargos acotados, fuentes autorizadas y lectura local/web; Canon
  persiste los informes relevantes sin mantenerlos como especificación paralela.
- No incorporar Architect, Implementer, coordinador, MCP, ledger ni maquinaria
  Legacy sin cambio explícito de alcance aprobado.
- No modificar CSDD Legacy, Lunes, Stalwart ni proyectos adoptantes. La
  optimización de tokens queda pospuesta.
