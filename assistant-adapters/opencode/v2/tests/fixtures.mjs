export const FIXTURE_VERSION = "genesis-fixtures-4"
export const RECOVERY_FIXTURE_VERSION = "genesis-recovery-fixture-5"
export const fixture = Object.freeze({
  identity: "Smoke Tester",
  initial: "Ensayo ficticio. Soy Smoke Tester. Quiero conservar tareas personales para no olvidar pendientes en un único dispositivo, sin cuentas, equipos, colaboración, sincronización ni integraciones. Tarea es un pendiente con descripción. El primer slice registra una tarea con descripción no vacía y permite encontrarla tras salir y volver al producto. Completar tareas queda para después. Prepara solo el borrador de Genesis, sin aprobación ni proyecciones, sin elegir tecnología ni investigar externamente.",
  rejectionDetails: " Para esta fixture ficticia decido que una descripción compuesta solo por espacios no es válida. Salir y volver significa cerrar normalmente el producto y abrirlo de nuevo en el mismo dispositivo; no incluye fallos ni reinstalación. No prescribe mecanismos técnicos.",
  nested: " Para este ensayo de jerarquía encarga a Canon una crítica provisional draft del borrador con su Reviewer antes de presentarlo; no sustituye la revisión final.",
  present: "Presenta el informe vigente de Genesis y su referencia exacta para que pueda decidir si aprobarlo. No estoy aprobando todavía; no materialices proyecciones ni inicies otra fase.",
  changedByHuman: "En esta fixture yo, Smoke Tester, introduje deliberadamente la exclusión de notificaciones en el borrador y decido conservarla. Mi aprobación anterior corresponde al cuerpo anterior y no aprueba el modificado. No restaures el contenido. Presenta el informe actualizado y su referencia exacta para que pueda decidir una aprobación nueva; todavía no apruebo ni autorizo proyecciones.",
  completeAuthorized: "La autorización ya emitida sigue limitada a completar esta materialización de Genesis, sus correcciones dentro del alcance aprobado y su revisión independiente. No autoriza nuevas decisiones de producto, otra fase ni implementación. Si existe una decisión humana realmente abierta, identifícala y no cierres; no infieras conformidad ni omitas hallazgos para completar el ensayo.",
  recoveryRecordOnly: "Soy Smoke Tester. Esta aprobación simulada identifica el baseline y primer slice presentados. Autorizo únicamente registrar la decisión y su procedencia durable en Genesis; no materialices todavía Specs, Roadmap ni glosario, no revises ni cierres la materialización. La continuación de este ensayo se encargará desde otra sesión. Conserva el cuerpo exacto, deja stage pending y no inicies Ontology, tecnología ni implementación. Esta es una intervención registrada del ensayo, no una autenticación de autoridad humana real.",
  teamChange: "Soy Smoke Tester. Autorizo redactar una revisión fundamental, no materializarla: pasar de uso individual a equipos. Cada miembro puede registrar tareas con descripción no vacía y otro miembro del mismo equipo consultarlas; cada equipo ve solo sus tareas. Para esta fixture ficticia decido que los miembros comparten un único dispositivo; no se requiere uso desde dispositivos distintos y se mantienen las exclusiones de cuentas y sincronización. No prescribe mecanismos de pertenencia ni tecnología. Sin asignaciones, notificaciones ni tecnología. Conserva la regla vigente de descripción no vacía, todo contenido vigente ajeno al cambio y el lifecycle. Presenta propuesta y referencia para aprobación.",
  // Evolución administrativa ajena al cambio de destinatario; no añade una
  // capacidad de producto ni utiliza un sentinel narrativo para medir fidelidad.
  unrelatedEvidence: "Evidencia de fixture posterior al cierre inicial: no se ha ejecutado implementación ni verificación del comportamiento del producto. Esta limitación sigue vigente durante la revisión fundamental.",
})

export const scenarioCriteria = Object.freeze({
  positive: ["presented_current_body", "explicit_approval", "faithful_projection", "linked_reviews", "closed"],
  guards: ["ambiguous_not_approved", "wrong_hash_not_approved", "stale_hash_not_approved", "new_presentation_and_approval", "closed"],
  recovery: ["approved_body_and_decision_preserved", "fixture_limit_disclosed", "linked_reviews", "closed"],
  nested: ["canon_reviewer_draft", "independent_final_review", "closed"],
  compatible: ["current_sources_only", "no_writes", "compatible_assessment_or_adjudication"],
  fundamental: ["evolved_sources", "unrelated_content_preserved", "history_preserved", "lifecycle_preserved", "approved_change_only", "closed"],
  rejection: ["rejected_abandoned", "current_sources_preserved", "rejected_record_preserved", "new_id_and_approval", "closed"],
})
