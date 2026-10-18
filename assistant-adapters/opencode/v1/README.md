# Adapter De OpenCode V1

Este directorio contiene la implementación fuente y el contrato del adapter de OpenCode. No es parte del payload metodológico instalable en `.csdd/` y su README no debe cargarse automáticamente como instrucción de un agente.

## Objetivo

Proporcionar una operativa agentic para ejecutar CSDD en OpenCode sin trasladar las convenciones del runtime a la autoridad normativa del framework.

La primera capacidad implementada es `GENESIS`. Se inicia conversando directamente con `CSDD-Orchestrator`, sin comando `csdd-genesis` ni skill. Los perfiles consultan los protocolos y plantillas existentes; no duplican el método. No se crean perfiles de componentes posteriores hasta que exista una necesidad de validación que los consuma.

## Contenido

```text
v1/
├── agents/
│   ├── CSDD-Orchestrator.md
│   ├── CSDD-Canon.md
│   ├── CSDD-Explorer.md
│   └── CSDD-Reviewer.md
├── tools/
│   ├── csdd_revision.ts
│   └── csdd_write.ts
├── lib/
│   └── install.mjs
├── tests/
├── opencode.json
└── package.json
```

`agents/` contiene el frontmatter V1; sus instrucciones están en `../common/prompts/`. La instalación concatena ambos para producir perfiles completos. `tools/`, `../common/lib/` y configuración son recursos operativos. `tests/`, `lib/install.mjs`, scripts y este README pertenecen al paquete fuente. La baseline es OpenCode `1.18.29`; estos comandos no acreditan compatibilidad V2.

## Jerarquía

```text
Humano
  <-> CSDD-Orchestrator
       ├── CSDD-Canon
       │    ├── CSDD-Explorer (opcional)
       │    └── CSDD-Reviewer (critica provisional)
       ├── CSDD-Architect
       │    ├── CSDD-Explorer (opcional)
       │    └── CSDD-Reviewer (critica provisional)
       ├── CSDD-Implementer (unidad simple)
       ├── CSDD-Implementation-Coordinator (escalacion)
       │    ├── CSDD-Implementer
       │    └── CSDD-Reviewer
       └── CSDD-Reviewer (cierre independiente)
```

La jerarquia expresa delegaciones permitidas, no una secuencia obligatoria. Reutilizar un perfil no implica compartir su sesion, historial, memoria ni conclusiones entre encargos distintos. Puede retomarse la misma sesion para continuar un encargo, comprobando que sus entradas sigan vigentes. La revision independiente no reutiliza la sesion de elaboracion o critica provisional.

La delegacion anidada requiere `subagent_depth: 2`, comprobado con OpenCode `1.18.29`. La configuracion es propia del adapter, no una regla del framework; se integra sin sobrescribir configuracion ajena ni cambiar el agente predeterminado.

## Responsabilidades

| Agente | Responsabilidad | Exclusiones |
| --- | --- | --- |
| `CSDD-Orchestrator` | Interlocucion humana, seleccion del componente, delegacion, integracion, aprobaciones y cierre | No mantiene una interpretacion semantica paralela ni sustituye al humano |
| `CSDD-Canon` | Mantener la interpretación canónica del componente activo; en este incremento solo opera `GENESIS` | No aprueba significado ni decide Ontology, topologia o implementacion |
| `CSDD-Architect` | Conducir `TOPOLOGY` y asignaciones iniciales de `MAPPING` | No implementa ni declara verificados destinos que no existen |
| `CSDD-Explorer` | Investigar una pregunta delimitada y devolver hechos, fuentes, inferencias y vacios | No escribe, no delega y no decide significado |
| `CSDD-Reviewer` | Aplicar una rubrica explicita al resultado de un componente | No modifica, no aprueba y no revisa con autoridad superior a la evidencia disponible |
| `CSDD-Implementer` | Fundar o modificar una unidad autorizada, actualizar mapping local, probar y reportar evidencia | No cambia silenciosamente canon, Ontology o Topology |
| `CSDD-Implementation-Coordinator` | Coordinar implementacion distribuida y dependencias entre unidades | No ejecuta cambios en repositorios |

`CSDD-Implementer` aparece desde `TOPOLOGY` cuando se necesita fundar un repositorio o materializar su estructura minima. `CSDD-Implementation-Coordinator` solo aparece cuando hay varias unidades, implementadores o dependencias que justifiquen la coordinacion adicional.

## Delegacion

El Orchestrator es el unico agente que conversa con la persona. Los subagentes devuelven resultados al agente que los invoco; no presentan decisiones directamente al humano.

Canon mantiene la interpretacion semantica. Orchestrator transmite las decisiones humanas con su formulacion, alcance y referencia, sin sustituirlas por una reinterpretacion. Puede simplificar su presentacion y solicitar correcciones, pero no agregar significado, eliminar incertidumbres relevantes ni mantener otro modelo paralelo.

La delegacion debe contener:

```text
component
increment_or_change
objective
scope_and_exclusions
input_paths_and_revisions
authority
expected_deliverable
acceptance_or_verification
risks_and_constraints
```

El retorno debe contener:

```text
status: completed | blocked | needs_decision
summary
evidence
files_changed
tests_or_checks
limitations
deviations
upstream_reentry
decision_required
```

El formato es un contrato de coordinacion del adapter. No sustituye los artefactos durables ni crea un estado adicional del lifecycle.

La allowlist prevista es:

| Emisor | Puede invocar |
| --- | --- |
| `CSDD-Orchestrator` | `CSDD-Canon`, `CSDD-Architect`, `CSDD-Implementer`, `CSDD-Implementation-Coordinator`, `CSDD-Reviewer` |
| `CSDD-Canon` | `CSDD-Explorer`, `CSDD-Reviewer` |
| `CSDD-Architect` | `CSDD-Explorer`, `CSDD-Reviewer` |
| `CSDD-Implementation-Coordinator` | `CSDD-Implementer`, `CSDD-Reviewer` |
| `CSDD-Explorer`, `CSDD-Reviewer`, `CSDD-Implementer` | Ninguno inicialmente |

La tabla es la arquitectura objetivo. En Genesis, la allowlist efectiva de Orchestrator incluye solo Canon y Reviewer; la de Canon solo Explorer y Reviewer. No se habilitan nombres de perfiles que aun no esten instalados.

## Contexto Y Reutilizacion

- Cada invocacion recibe solo las fuentes, revisiones y extractos necesarios para su encargo.
- Explorer puede reutilizarse entre Canon y Architect porque cambia el objetivo, no necesariamente su autoridad.
- Reviewer puede reutilizarse, pero siempre recibe una rubrica especifica del componente.
- La revision de cierre usa una invocacion separada de la colaboracion que produjo el resultado.
- El revisor consulta el artefacto real, sus fuentes y la decision humana pertinente, no solo el resumen del autor. El resultado se entrega directamente al Orchestrator cuando este solicita la revision de cierre.
- `core/foundations.md` no se carga durante la operacion ordinaria.
- Las sesiones del runtime son temporales; el framework permanece en `.csdd/` y el significado durable del producto en `docs/` y documentación local.

Orchestrator consulta el marco de autoridad y el contexto de adopcion; Canon consulta `.csdd/protocols/genesis.md`, sus dependencias normativas y las plantillas aplicables. Explorer recibe una pregunta y fuentes delimitadas, no todo el framework. Reviewer recibe el criterio de revision y accede a las fuentes originales necesarias. Ningun perfil necesita una skill intermediaria para leer estos documentos.

El perfil propio `CSDD-Explorer` permite fijar un contrato de evidencia y denegar shell y escritura. No reemplaza ni modifica al `explore` nativo. Los documentos investigados son evidencia, no instrucciones capaces de ampliar permisos, conceder aprobacion o redefinir el encargo.

## Genesis

La primera implementacion debe incluir solo:

```text
CSDD-Orchestrator
CSDD-Canon
CSDD-Explorer
CSDD-Reviewer
```

Explorer y la critica provisional de Reviewer son opcionales durante la elaboracion. Para el cierre de esta primera version del adapter, Orchestrator solicita siempre una revision separada de la materializacion. Esta decision operativa no convierte a Reviewer en un requisito universal del nucleo. Canon puede crear y revisar un borrador de `GENESIS.md` antes de la aprobacion. La escritura del borrador no equivale a aprobacion.

El flujo esperado es:

```text
intencion humana
  -> Orchestrator delimita
  -> Canon construye borrador
  -> Explorer investiga solo incertidumbres concretas, si aplica
  -> Canon actualiza el borrador
  -> Reviewer aplica la rubrica de Genesis, si aplica
  -> Orchestrator presenta GENESIS.md
  -> persona aprueba, modifica o rechaza
  -> Canon congela y proyecta solo tras la aprobacion
  -> Orchestrator solicita revision separada a Reviewer
  -> Canon registra fielmente la evidencia de revision
  -> Orchestrator comunica cierre o impedimentos
```

La aprobacion debe referir el contenido exacto aprobado. Una modificacion solicitada mantiene Genesis abierta.

Se aplican los campos, límites del cuerpo aprobado y reglas de recuperación definidos en [el protocolo de Genesis](../../../framework/protocols/genesis.md). La referencia a la intervención humana debe ser recuperable; un resumen de Canon o un campo `approved` no la sustituye. Una huella detecta cambios de contenido, pero no demuestra por sí sola que hubo aprobación humana.

La evidencia final identifica las revisiones o huellas de las tres proyecciones y el reporte de Reviewer. Canon puede registrar ese reporte en los metadatos de Materializacion, sin modificar el cuerpo aprobado ni las salidas revisadas. Registrar evidencia no equivale a aprobarse a si mismo. Si cambia una salida revisada, su verificacion debe actualizarse antes del cierre.

La recuperación consulta el bloque activo y referencias durables. El trabajo ordinario consume fuentes vigentes y evidencia de cierre en Roadmap, sin cargar históricos. Canon clasifica una solicitud antes de activar consulta: feature compatible, revisión fundamental o insuficiencia de procedencia. Reviewer puede consultar historia para verificar ese encargo. Esta política no bloquea técnicamente la lectura.

`docs/base/GENESIS.md` conserva el registro inicial y bloques `# Revisión de GENESIS: <id>`. Cada uno tiene sus propias secciones de decisión y materialización. La tool calcula la huella del último cuerpo, preserva registros anteriores y rechaza su reescritura o retirada. Una nueva revisión requiere aprobación nueva y aplica cambios sobre las fuentes actuales sin regenerar su evolución ni reiniciar lifecycle. Ontology sigue fuera de la operativa implementada.

## Mapping Y Autoridad

Architect conduce las asignaciones; Implementer mantiene los destinos materiales y la evidencia del mapping local. Reviewer contrasta esa evidencia y Orchestrator coordina el cierre. No toda actualizacion administrativa requiere volver a Architect: este interviene cuando cambia la asignacion o la topologia. Registrar `verified` exige evidencia pertinente segun el protocolo, no la mera declaracion de quien edita la fila.

Las reglas del producto conservan una unica ubicacion normativa vigente. El adapter respeta la transferencia aprobada desde Specs a un dominio y sus referencias; no mantiene copias normativas en paralelo. Genesis permanece como acuerdo historico.

## Permisos Previstos

Los permisos efectivos deben comprobarse con las capacidades reales de OpenCode y no solo con instrucciones del prompt.

| Agente | Editar | Bash | Task | Question | Web |
| --- | --- | --- | --- | --- | --- |
| `CSDD-Orchestrator` | deny | deny | allowlist | allow | deny |
| `CSDD-Canon` | solo mediante `csdd_write` | deny | allowlist limitada | deny | deny |
| `CSDD-Architect` | artefactos topologicos asignados | deny inicialmente | allowlist limitada | deny | deny |
| `CSDD-Explorer` | deny | deny | deny | deny | segun encargo |
| `CSDD-Reviewer` | deny | deny inicialmente | deny | deny | deny |
| `CSDD-Implementer` | alcance de unidad asignada | segun playbook | deny inicialmente | deny | deny |
| `CSDD-Implementation-Coordinator` | deny | deny | Implementer y Reviewer | deny | deny |

Canon no dispone de edición general. `csdd_write` acepta solo Genesis y las tres fuentes derivadas con rutas cerradas bajo `docs/`. Comprueba cada carpeta ancestral y rechaza enlaces/junctions, incluso internos; reemplaza archivos atómicamente para no seguir hard links. Sustituye placeholders y rechaza cierres cuyas huellas no coincidan con el cuerpo activo y las tres fuentes. Protege cuerpo y decisión aprobados, conserva registros anteriores y exige cierre previo antes de añadir otro bloque. La autoridad humana y el momento de escritura de proyecciones siguen dependiendo del flujo: una huella no autentica una aprobación. Se presupone que un proceso hostil no reemplaza concurrentemente el árbol documental durante la operación; Node.js no ofrece openat portable.

Las únicas rutas de escritura son `docs/base/GENESIS.md`, `docs/specs.md`, `docs/roadmap.md` y `docs/glossary.md`. No se habilita escribir todo `docs/**` ni `.csdd/**`. Los selectores siguen siendo `genesis`, `specs`, `roadmap` y `glossary`.

El acceso web de Explorer, los limites de lectura y cualquier mecanismo para comprobar revisiones deben resolverse y probarse como permisos efectivos durante la implementacion. Un encargo o skill no reduce tecnicamente permisos ya concedidos. Tampoco `question: deny` ni ocultar perfiles garantiza que el usuario no pueda invocarlos directamente: el adapter no debe atribuir aprobaciones al solo hecho de haber recibido un encargo. Los controles no implementados se reportan como limites, no como garantias.

## Verificacion

En el paquete fuente:

```powershell
npm test
node tests/run-genesis-smoke.mjs
node tests/run-genesis-approval-guards-smoke.mjs
node tests/run-genesis-recovery-smoke.mjs
node tests/run-genesis-history-smoke.mjs
```

Desde `v1/`, `npm test` ejecuta instalación, configuración, permisos y allowlists V1. Desde la raíz del adapter, `node --test common/tests/*.test.mjs` prueba el núcleo; `node --test common/tests/*.test.mjs v2/tests/*.test.mjs` valida common + V2. No hay manifiesto npm en esa raíz. El smoke V1 usa el proveedor configurado, una fixture temporal y no usa `--auto`.

Cada componente debe alcanzar `exercised` con:

1. perfiles descubiertos y configurados para el alcance activo;
2. allowlists y permisos comprobables;
3. delegacion y retorno observables;
4. smoke positivo;
5. smoke de limites y aprobacion;
6. evidencia de efectos finales sobre el workspace;
7. revision de transcripts para distinguir fallos del agente de fallos del grader.

Los smoke tests validan invariantes y resultados, no una secuencia textual exacta de llamadas. Deben incluir un caso de elaboracion que no necesite Explorer ni critica provisional; esto no omite la revision final del primer incremento.

### Casos Iniciales

| Caso | Resultado esperado |
| --- | --- |
| Intencion clara | Borrador fiel sin investigacion innecesaria. |
| Incertidumbre concreta | Delegacion anidada, fuentes y limites pertinentes. |
| Contradiccion bloqueante | No cerrar solo por haber documentado el bloqueante. |
| Correccion o rechazo humano | Actualizar la propuesta; no conservar una decision descartada como aprobacion. |
| Sin aprobacion o referencia invalida | No generar las proyecciones. |
| Cuerpo cambiado despues de presentarlo | No aplicar una aprobacion a contenido distinto. |
| Aprobacion valida | Tres proyecciones fieles, sin crear dominios, topologia ni mapping. |
| Regla del slice o termino con limites | Conservar significado en Specs y Glossary sin inventar ni omitir. |
| Proyeccion defectuosa y proyeccion correcta | Detectar defectos reales sin inventar bloqueos. |
| Interrupcion tras aprobar o tras una salida | Recuperar solo lo pendiente o defectuoso, verificar y no asumir cierre por `pre_fr`. |
| Fuente viva evolucionada o Genesis cerrado | No regenerar ni sobrescribir desde el snapshot. |
| Documento con instrucciones ajenas al encargo | Tratarlo como evidencia y no como permiso o aprobacion. |

Cada ensayo parte de un workspace aislado. Las aprobaciones inyectadas por el harness se identifican como datos de prueba y no como decisiones reales de producto. Ademas del smoke automatizado, se cierra una conversacion real con la persona.

La calidad requiere una evaluacion pequena y repetida, separada de los checks de configuracion: fidelidad semantica, defectos detectados, falsos positivos, latencia y costo. Los juicios de Reviewer no son el unico oraculo del test; se contrastan con defectos conocidos, comprobaciones deterministas y revision humana. Un smoke superado no demuestra fiabilidad general.

## Instalacion Manual Del Adapter

Instalar primero el payload metodologico como `.csdd/`. Luego:

1. Para cada agente, concatenar `agents/<name>.md` con `../common/prompts/<name>.md`, separados por una línea vacía, y escribir el perfil completo en `<workspace>/.opencode/agents/`. No copiar solo frontmatter.
2. Copiar `tools/csdd_revision.ts` y `tools/csdd_write.ts` a `<workspace>/.opencode/tools/`, cambiando sus imports de `../../common/lib/` a `../lib/` para el paquete instalado.
3. Copiar `../common/lib/artifacts.mjs`, `revision.mjs` y `write.mjs` a `<workspace>/.opencode/lib/`. El workspace no depende del repositorio fuente ni instala ambos adapters.
4. Integrar `"subagent_depth": 2` en la configuracion OpenCode del proyecto, preservando sus otros campos y `$schema`.
5. Asegurar que `@opencode-ai/plugin` este disponible para la tool; si `.opencode/package.json` ya existe, agregar o actualizar solo esa dependencia, sin reemplazar el manifiesto.
6. Reiniciar OpenCode: los perfiles, tools y configuración no se recargan en una sesión ya abierta.
7. Validar con `opencode debug config` y `opencode debug agent <name>`.

No copiar `tests/`, `lib/install.mjs`, `README.md`, `.gitignore` ni los scripts del `package.json` al workspace adoptante. `opencode.json` es una referencia de la configuración mínima y no debe sobrescribir una configuración existente.

## Trabajo Posterior

1. Ejercitar los casos restantes: contradicción bloqueante, corrección o rechazo humano, proyección defectuosa, fuente viva evolucionada e instrucciones hostiles.
2. Repetir los ensayos para medir consistencia, latencia, costo y falsos positivos.
3. Cerrar una conversación real con la persona y ajustar el frontstage.
4. Corregir fallos observados y documentar evidencia y limitaciones; no crear infraestructura de Legacy anticipadamente.

## Estado

La operativa inicial de `GENESIS` esta implementada. El 6 de septiembre de 2026 pasaron con OpenCode `1.18.29` el recorrido positivo, los guards de huella inválida y cuerpo cambiado, y la recuperación de una materialización interrumpida. Las pruebas deterministas pasaron con Node.js `24.13.1`; dos pruebas de symlink se omitieron porque el entorno Windows no permitio crearlos, mientras el escape de `.csdd` mediante junction sí fue rechazado.

Esa evidencia es histórica y corresponde a las rutas anteriores. El ajuste a `docs/`, preservación de revisiones y lectura selectiva incorpora pruebas deterministas y un smoke nuevo de feature compatible/revisión fundamental. No se han revalidado los recorridos con modelo: el entorno detectado es OpenCode `2.0.22`, incompatible con los comandos de diagnóstico de estos tests. Los smokes se detienen en preflight antes de consumir modelo. Las pruebas de common validan referencias y escritura sin depender del runtime; el `npm test` de V1 añade comprobaciones de configuración que actualmente fallan bajo V2.

Resultado del ajuste de Genesis previo a la separación por versiones con Node.js `24.13.1`: núcleo, 21 pruebas, 19 aprobadas y 2 omitidas por permisos de symlink, sin fallos; suite completa, 25 pruebas, 21 aprobadas, 2 omitidas y 2 fallos de configuración V2. Las junctions y hard links sí se ejercitaron. El smoke history comprobó únicamente el rechazo de preflight; no ejecutó modelo ni acredita lectura selectiva observada.

Tras la separación en common/V1/V2 se comprobó además la composición autosuficiente: imports locales de wrappers, módulos comunes idénticos, escritura y cálculo de huella desde el paquete instalado, sin instalador ni scripts fuente. Suite completa: 26 pruebas, 22 aprobadas, 2 omitidas y los mismos 2 fallos de diagnóstico V1 bajo V2. No se ejecutaron recorridos con modelo durante esta reorganización.

Estimación previa para revalidar en un runtime compatible: comenzar con un smoke feliz de dos interacciones, aproximadamente 5–10 invocaciones de agentes, entradas acumuladas de 50–150 mil tokens y salidas de 5–20 mil tokens, con variación por delegaciones y caché. Cada proceso tiene límite de diez minutos. Revisar consumo observado antes de ampliar a guards, recovery e history; no ejecutar una campaña estadística en este ajuste. El smoke history inspecciona también las sesiones hijas, pero no certifica toda posible lectura indirecta ni enforcement técnico.

Esto demuestra tres recorridos ficticios, no fiabilidad general ni uso real. Permanecen pendientes los otros casos de la matriz, la repeticion estadistica y la validacion humana del frontstage. No estan implementados `CSDD-Architect`, `CSDD-Implementer` ni `CSDD-Implementation-Coordinator`.
