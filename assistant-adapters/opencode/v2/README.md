# Integración OpenCode V2

Baseline: OpenCode `2.0.22` y `@opencode/plugin@2.0.22`. Esta integración mantiene los selectores y garantías del núcleo compartido; no migra a Python ni añade agentes posteriores a Genesis.

## Estado Vigente: Flujo Simplificado

**Modelos fijos desplegados en Figuvault:** las fuentes y el ZIP de
dist/ contienen `71e2040ed94eb8cc17e585e7c3b6aba2bf71b18289e37ce9ed9b1a014263ca38`.
Canon devuelve status/path/reference y Orchestrator evita repetir la comprobación
de bytes por rutina. Suite: 92 aprobadas, cero fallos y cuatro omitidas, 5,856 s.
Caso de conservación aprobado: ocho llamadas, 44,294 s, dentro del máximo de diez
llamadas/tres minutos autorizado. Persistencia y respuesta final completas.
Evidencia: tests/evidence/model-assignment-conservation-prepared-ten-calls/.
Despliegue: seis archivos actualizados, 34 verificados; informe y sesiones reales
preservados. Perfiles efectivos: Orchestrator/Canon/Reviewer Sol medium, Explorer
Luna high. La hija Explorer histórica conserva Sol: usar una hija nueva para el
siguiente encargo necesario. No reiniciar la conversación principal ni reexplorar.
Ver tests/evidence/figuvault-fixed-models/ y fixed-models-status.md.

### Antecedentes preservados (estado en cada intento)

Conservación sin errores y constancia correcta, pero tres llamadas del padre más
cinco de Canon agotaron ocho antes de la respuesta final. Stopped, 42,491 s;
sin reintentos ni despliegue. Evidencia: model-assignment-conservation-prepared-verified-return/.

Antecedente a76ad14b:
Se delimitó recuperación Genesis, se alinearon esquema/validador de rutas y se
corrigió la captura de excepciones en executors de la fixture. Suite sin modelos:
92 aprobadas, cero fallos, cuatro omitidas de 96, 6,047 segundos, con reproducción
real de excepción y bloqueo posterior en 2.0.22. Una conservación posterior
escribió fielmente el informe sin errores, pero alcanzó ocho llamadas antes del
retorno final de Orchestrator: stopped, sin ampliar presupuesto ni desplegar.
Ver tests/evidence/conservation-controls-diagnosis.md. Figuvault sigue e1454a17.

Antecedentes del candidato c2f9cae8, preservados sin reclasificación:
La repetición autorizada de conservación con docs/support preparado también
quedó stopped: Canon intentó inspeccionar Genesis con csdd_document, ruta no
admitida; el control no detuvo esa excepción y continuó hasta guardar el informe.
Ocho llamadas, 51,375 segundos. Esa escritura no acredita ensayo aprobado ni
parada inmediata. Evidencia: model-assignment-conservation-prepared/. Sin despliegue.
Tras autorización, Explorer/Luna pasó el caso aislado con las mismas fuentes y
criterios (tres llamadas, 25,122 segundos). El caso siguiente de conservación se
detuvo al inspeccionar docs inexistente en la fixture (una llamada, 4,931 segundos):
el control estricto no contempló esa ausencia. No se probó la delegación/escritura
ni se desplegó. Ver model-assignment-luna-isolated/ y model-assignment-conservation/.
La suite sin modelos pasó (90/94, cero fallos, cuatro omitidas), pero el ensayo
Orchestrator→Explorer alcanzó ocho llamadas sin completar la respuesta principal.
Luna detectó los hallazgos principales y añadió una contradicción menor no
sustentada; no se ejecutó el siguiente caso ni se desplegó la sustitución.
Figuvault conserva el paquete e1454a17 descrito abajo. Canon sí guardó el informe
real completo en docs/support/exploracion-legado.md. Estado y evidencia precisa:
tests/evidence/fixed-models-status.md. No usar este ZIP como candidato validado.

Revisión integral de prompts desplegada en Figuvault. Los cuatro agentes separan
responsabilidad, contexto, operaciones, bloqueos y evidencia. La lectura externa
inicia con read y el runtime solicita permiso; no se exige una herramienta de
autorización separada. Bloqueo histórico, rechazo vigente y operación no intentada
se distinguen. Reviewer separa revisión narrativa de otros aportes y registro
Genesis/Glossary. Canon usa el respaldo/restauración automático del glosario;
la aprobación nueva explicita primera línea y última intervención humana.
El esquema de csdd_document describe sus rutas permitidas y límites reales.

ZIP anterior desplegado en Figuvault (preservado en tests/evidence/candidates/), SHA-256
`e1454a17e635d2a6f9464cf862ce0b456c8583142430111109d6f357b7006bb8`.
Suite: 94 pruebas, 90 aprobadas, cero fallos, cuatro omitidas; 5,88 segundos,
incluida instalación BAT/carga en runtime aislado 2.0.22. Dos casos puntuales
aprobados, sin reintentos: petición natural de reexploración externa (seis llamadas,
29,489 segundos) y revisión de informe sin Genesis (dos llamadas, 13,659 segundos).
Total: 23.928 tokens de entrada, 18.560 de caché leída y 1.238 de salida;
coste monetario no acreditado. La aprobación conserva las regresiones por código;
no se ejecutó otro recorrido completo de Genesis.

Evidencia en tests/evidence/prompt-review-{external,report}/ y
tests/evidence/prompt-review-suite.txt. Respaldo, comparación sin conflictos y
34 archivos verificados en tests/evidence/figuvault-prompt-review/. Los cuatro
prompts efectivos coinciden íntegramente con sus fuentes. El runtime compartido
observado en Figuvault es 2.0.26; la baseline de distribución y ensayos sigue siendo
2.0.22. Las sesiones de ensayo y temporales se retiraron; la conversación real
existente aún debe confirmar el comportamiento con su historial. El antecedente
del bloqueo en el ensayo fue contexto suministrado, no reanudación de esa sesión.

### Antecedente: ajuste inicial de exploración externa

Corrección de exploración externa desplegada en Figuvault: investigación y
reintentos se encargan a Explorer; Canon interpreta/escribe. Explorer conserva
solo lectura y solicita external_directory mediante ask, sin copiar referencias
al workspace. El runtime efectivo de Figuvault confirmó ask, edición denegada e
instrucciones de delegación actualizadas. Sin cambios locales en conflicto;
respaldo y comprobación de 34 archivos en tests/evidence/figuvault-external-fix/.

ZIP de ese ajuste `CSDD-opencode2-v0.1.0.zip`, SHA-256
`5c55c7e331a16075051f02bd8f6723e42467d3018787cf97519d25f0e091cc65`.
Suite sobre este ZIP: 90 aprobadas, cero fallos, cuatro omitidas (94 total),
5,83 segundos. Un caso real acotado Orchestrator→Explorer pasó en runtime
2.0.22: seis llamadas, 29,010 segundos, una solicitud external_directory
respondida once únicamente para la referencia ficticia autorizada. Se leyó
el archivo externo original, sin copia/escritura ni Canon. Entrada 13.721,
caché leída 21.248, salida 722; coste monetario no acreditado. Evidencia:
tests/evidence/external-exploration-fix-validated/. El primer preflight falló
antes de cargar perfiles y antes de crear sesiones/usar modelos; se conserva
en external-exploration-fix/. Una sola ejecución con modelos, sin reparación
ni reintento. Sesión raíz e hija eliminadas después de exportar la evidencia;
fixtures/runtime temporales retirados. No se exploró el legado real durante
la prueba o el despliegue.

Actualización Definición/Implementación: CONSOLIDATION es el sexto componente;
protocols/entry.md cubre las tres situaciones de entrada. Canon dispone de
csdd_document para informes nuevos y aportes pendientes a los otros documentos;
Orchestrator puede invocar Explorer directamente. La herramienta no aprueba,
migra ni cierra otros componentes, ni sustituye las guardas Genesis/Glossary.

Candidato anterior al ajuste de exploración externa: `dist/CSDD-opencode2-v0.1.0.zip`, SHA-256
`fa14113e3e0cbc1c8bf0ee0d136bfb7efe88d1bbbd7f8737ef8ccc70740f574a`.
Carpeta interna `CSDD-opencode2-v0.1.0`; VERSION y MANIFEST distinguen CSDD 0.1.0
de OpenCode V2 / baseline 2.0.22. Prueba de instalación/carga por BAT aprobada sobre
este ZIP, sin modelos; salida en `tests/evidence/package-name-0.1.0.txt`.
El candidato previo `fa5eb566af5ab49af4b0d44c966e68e37c6667f91e72486c41a9e6901b682918`
se conserva bajo `tests/evidence/candidates/` y es al que corresponde la suite siguiente.
Suite final: 90 aprobadas, cero fallos, cuatro omitidas (94 total), 5,27 segundos,
incluida instalación/carga real en 2.0.22. Tres casos puntuales pasaron sobre el
candidato anterior aedc165e; caso web quedó stopped por error del evaluador y
expectativa no sustentada en la fuente única. Sin reintentos ni éxito retroactivo.
Evidencia, diferencias de candidatos y límites precisos:
`tests/evidence/consolidation-adjustments.md` desde la raíz. La información
histórica posterior conserva su huella y resultado originales. Figuvault no se
actualizó; sus cambios requieren autorización separada.

Definición recorre GENESIS → ONTOLOGY → TOPOLOGY → MAPPING → CONSOLIDATION (Specs/Roadmap), sin orden rígido de escritura. Implementación usa IMPLEMENTATION ↔ MAPPING y reentradas selectivas. consolidation.contract.json separa la consolidación final del contrato de Genesis. support/ admite informes de exploración local/web, incluso del repositorio actual, durante toda Definición; al consolidar quedan antecedentes sin requisitos o justificaciones indispensables exclusivos.

La operativa implementada cubre Genesis: Canon prepara Genesis y Glossary candidatos; Reviewer registra una revisión semantic independiente antes de aprobación con intent_fidelity y preserved_rules. Código vincula las versiones, obtiene la intervención original y registra cierre. No se exige una revisión administrative por modelo ni un Roadmap temprano.

csdd_review begin devuelve referencias y snapshot_paths locales, con cuerpo activo de Genesis y Glossary, no la historia completa en una respuesta extensa. complete rechaza fuentes o snapshots alterados. El candidato de Glossary conserva su versión previa para abandono seguro; evolución ajena o escritura interrumpida no reconocible detienen la restauración/cierre. Presupone un escritor, no ofrece concurrencia hostil.

Validación vigente: pruebas por código, estados preparados para controles y una conversación humana real pendiente. No hay requisito de siete simulaciones. run-genesis-smoke.mjs se detiene antes de llamar modelos: conserva el procedimiento anterior pero no ejecuta el contrato nuevo. checkpoints.historical.mjs está fuera de la suite vigente. Resultados históricos siguientes permanecen con su clasificación y huella originales; no validan el candidato simplificado.

Comandos desde v2/: npm run test:unit para regresiones rápidas; npm test incluye instalación/carga del ZIP sin modelos. CSDD_RUNTIME_BIN permite seleccionar el ejecutable aislado 2.0.22 para distribución; se comprueba su versión, sin modificar instalaciones globales. test:runtime verifica el paquete entregado. La prueba adicional de runtime desde fuentes, que instala dependencias, es optativa con CSDD_TEST_SOURCE_RUNTIME=1; evita repetir por defecto una preparación npm además del bundle. La comprobación del mensaje original mediante API también sigue siendo optativa. Ninguna suite determinista acredita calidad semántica de un modelo.

La implementación agentic de componentes posteriores, conversación real, máquina limpia con red físicamente bloqueada y alerta transitiva http-cache-semantics siguen pendientes. No se certifica V1.

### Evidencia Del Ajuste

#### Ubicación De La Evidencia

Los temporales de pruebas se limpiaron por solicitud del usuario. La evidencia
original relevante está ahora en `tests/evidence/`, desde la raíz del repositorio;
el índice es `tests/README.md` y la correspondencia exacta entre ubicaciones
anteriores y actuales está en `tests/evidence/cleanup-manifest.json`.
Las rutas temporales que aparecen en el registro histórico de este documento
identifican procedencia, no ubicaciones todavía disponibles. Los contenedores
`csdd-*` de Temp/opencode se resuelven bajo `tests/evidence/opencode/`, los
candidatos ZIP bajo `tests/evidence/candidates/` y los ensayos de Temp bajo
`tests/evidence/legacy-temp/`. No se reescribieron resultados ni evidencia original.
El runtime aislado de pruebas también fue retirado; las instalaciones globales
y los temporales ajenos quedaron intactos.

#### Simulación Puntual De Reviewer

Caso autorizado glossary-introduces-teams, sobre ZIP 7a2549bb: Genesis individual sin equipos/colaboración y Glossary candidato que introduce registro/consulta compartidos por miembros de equipo. Preparación por código, una sesión Reviewer con openai/gpt-6.1-sol y runtime aislado 2.0.22; límites ocho llamadas y tres minutos. Sin Orchestrator, reparación de producto o flujo completo. Presupuesto y ausencia de reintento de proveedor comprobados sin modelos antes del prompt.

Duración activa 45,092 segundos, siete llamadas; entrada 11.861, caché leída 12.544 y salida 1.478 tokens, razonamiento reportado 70. Reviewer leyó ambos snapshots locales y registró non_conforming con blocking en la definición de Tarea de Glossary: añadió miembros de equipo y consulta compartida frente al uso individual y exclusiones de Genesis. Adjudicación semántica confirmó criterio, ubicaciones y consecuencias, no solo el verdict. Verificación posterior sin modelos confirmó versiones/identidad, ausencia de escrituras y delegación, estado pending y bloqueo de los requisitos de aprobación y cierre.

La ejecución estricta no pasó: Reviewer hizo una reparación de formato tras enviar result: failed/passed en semantic_checks, cuando el validador exige verdict; el esquema de la tool solo declara items object y no explicita esa estructura interna. Después el evaluador se detuvo por comparar el reporte persistido con el retorno de tool que además incluye report_path/review_message_id. Se preserva result.json con status stopped. La verificación separada contrastó juicio e identidad por separado, sin otra llamada al modelo ni éxito retroactivo. No se rebajó el criterio sin reparaciones, no se cambió producción y no se reintentó.

Evidencia: C:/Users/Michael/AppData/Local/Temp/opencode/csdd-focused-review-FL4rXJ/, con criteria.json, preflight.json, transcript.json, result.json, offline-verification.json y semantic-adjudication.json; snapshots/reporte en project/docs/base/. El caso acredita detección concreta, no el flujo global ni una conversación humana real. Queda observado un defecto administrativo del esquema y otro del evaluador puntual; no se amplía esta ejecución para corregirlos.

#### Corrección Y Repetición Puntual Autorizada

Se completaron los esquemas internos de findings y semantic_checks usando definiciones compartidas con el parser: claves cerradas, campos obligatorios y valores de severity/verdict. El validador rechaza también campos adicionales y criterio vacío. No se añaden aliases ni se rebajan requisitos. El evaluador focused-evaluator-2 compara juicio separado de report_path/review_message_id y verifica ambas identidades, no las descarta. La fixture incorpora hooks execute.after/execute.before/context: primer error de herramienta conserva evidencia y bloquea cualquier herramienta o llamada posterior; retry de proveedor deshabilitado. Estos controles pertenecen exclusivamente al ensayo, no amplían permisos ni modifican producción instalada.

Pruebas sin modelos: primero 29 regresiones relevantes, todas aprobadas; después suite completa con 89 pruebas, 85 aprobadas, cero fallos y cuatro omitidas (dos symlinks, API de intervención optativa y runtime adicional desde fuentes optativo). Duración 5,41 segundos, incluida instalación y carga real del nuevo ZIP. Candidato vigente SHA-256 538eff0eac9e59424aedaf1cda257953181663e263769097a681063964f99546. El ZIP previo 7a2549bb se conserva en C:/Users/Michael/AppData/Local/Temp/opencode/CSDD-v1-7a2549bb-before-review-schema.zip y su sidecar.

Una única repetición del mismo caso y fixture focused-review-1, sin cambiar contenido, expectativas o límites: passed tras adjudicación semántica y comprobaciones deterministas, cuatro llamadas en 21,781 segundos activos. Reviewer devolvió non_conforming, con blocking por miembros de equipo/consulta compartida frente a uso individual y exclusiones; citó las ubicaciones pertinentes y explicó el cambio indebido de alcance. No hubo error de herramienta, reparación, delegación o reintento. Genesis/Glossary permanecieron intactos y pending; no se aprobó ni cerró. Código comprobó que el reporte no satisface los requisitos de conformidad para aprobación/cierre. Consumo reportado: entrada 4.560, caché leída 6.144, salida 847, razonamiento cero; tarifa monetaria no acreditada.

Evidencia nueva en C:/Users/Michael/AppData/Local/Temp/opencode/csdd-focused-review-ZIIBlO/: criteria.json, fixture-before.json, preflight.json, session.json, transcript.json, review-report.json, result.json y adjudication.json, además de snapshots/reporte del proyecto. Sesión ses_ee1fa8e7affeHYYUhGYNvbborK, runtime aislado 2.0.22, modelo openai/gpt-6.1-sol. result.json conserva awaiting_semantic_adjudication y adjudication.json completa el resultado passed del intento nuevo; el anterior stopped queda sin modificar. Una simulación correcta no acredita todo Genesis ni sustituye conversación humana real, que es el siguiente paso, sin otra tanda extensa.

Ejecutar manualmente desde v2/ con CSDD_RUNTIME_BIN seleccionado: npm run smoke:focused. El runner verifica versión/ZIP, prepara por código, comprueba controles sin modelos y ejecuta solo una sesión de Reviewer con máximo ocho llamadas y tres minutos. No reintenta ni altera archivos tras un fallo; la adjudicación semántica sigue siendo explícita.

La suite anterior se reconcilió con el contrato nuevo: no se cambiaron resultados históricos. El primer diagnóstico local mostró expectativas obsoletas (proyecciones, metadata de Roadmap y cadena administrativa), una omisión de glossary-candidate.mjs en el instalador fuente y uso de una ruta global de runtime en la prueba de distribución. Se corrigieron esas capas; la ruta del ejecutable aislado se selecciona explícitamente y se comprueba 2.0.22. La prueba adicional desde fuentes dejó de duplicar por defecto la instalación de dependencias; permanece optativa, no se cuenta como aprobada.

Verificación final sin modelos: 85 pruebas, 81 aprobadas, cero fallos, cuatro omitidas (dos por permisos de symlink, lectura de intervención por API optativa y runtime adicional desde fuentes optativo). Duración final observada 8,15 segundos consumiendo el ZIP existente con CSDD_DISTRIBUTION_ZIP. Incluye manifiesto, BAT, rutas especiales/conflictos y carga real del bundle en runtime aislado 2.0.22 con PATH sin Node/npm. No equivale a red físicamente bloqueada. Las pruebas de juicio usan fixtures deterministas y no acreditan juicio real de un LLM.

Se verificaron aprobación ambigua/incorrecta/obsoleta, cierre con solo Genesis/Glossary, snapshots locales alterados o extensos, preservación, recuperación desde otra sesión, rechazo y nuevo ID, restauración limitada del glosario y parada ante evolución externa. No se ejecutaron modelos ni la matriz histórica.

El candidato anterior f03710bb se conserva como C:/Users/Michael/AppData/Local/Temp/opencode/CSDD-v1-f03710bb-before-simplification.zip y su sidecar. ZIP del ajuste inicial: 7a2549bb0d7cf2291e136112727b83090911749628369702e5312f8077549a24; el candidato vigente figura en la corrección posterior y dist/CSDD-v1.zip.sha256. Salida de aquellas pruebas preservada en C:/Users/Michael/AppData/Local/Temp/opencode/csdd-simplified-validation-7a2549bb.txt. No se heredan sus seis recorridos aprobados. La conversación real queda pendiente con la persona, no se simula.

## Recursos

- `agents/`: frontmatter V2 con reglas ordenadas `permissions`; el cuerpo proviene de `../common/prompts/`.
- `plugins/csdd/`: plugin `csdd.genesis`, registrado explícitamente en la configuración.
- `lib/tools.mjs`: registro de csdd_revision, csdd_review, csdd_write y csdd_document mediante JSON Schema y tools directas. csdd_write protege Genesis/Glossary; csdd_document permite solo a Canon informes nuevos consultivos y aportes pendientes sin sobrescribir contenido previo. No certifica aprobación/cierre de otros componentes.
- `lib/install.mjs`: composición de fixtures fuente nuevas, sin sobrescribir `.csdd/` o `.opencode/` existentes. No es el instalador entregado al usuario.
- `build/distribution.mjs`: composición de perfiles y bundle antes de producir `dist/CSDD-opencode2-v0.1.0.zip`; `build/release.mjs` define nombre, versión CSDD y baseline OpenCode. El BAT entregado solo copia.
- `opencode.json`: `experimental.subagent_depth: 2`, sin cambiar agente predeterminado.

La tool recibe identidad y sesión del runtime, no de argumentos del modelo. Resuelve el directorio desde la sesión y lo contrasta con la ubicación del plugin; ante traslado o identidad indebida falla cerrado. La cancelación se comprueba antes de iniciar la operación, pero no se promete interrumpir una escritura atómica ya iniciada.

Los subagentes son descubribles en V2: `hidden: true` los quitaría del catálogo. No concede shell, edición general, skills ni Code Mode a los perfiles CSDD. Solo Canon escribe mediante `csdd_write`; Orchestrator y Reviewer pueden calcular referencias. La aprobación humana y la lectura histórica selectiva siguen siendo controles del flujo, no autenticación ni prohibición técnica implementadas por el plugin.

## Instalación Y Pruebas

Consultar [INSTALL.md](../../../INSTALL.md). El usuario recibe perfiles completos y plugin empaquetado. La distribución no lleva node_modules ni dependencias npm sin resolver: su package.json interno solo declara el punto de entrada. El código fuente conserva imports al núcleo compartido; la construcción los resuelve antes de entregar. No se instalan wrappers V1 ni referencias al repositorio fuente. Configurar el directorio `./plugins/csdd`, no el archivo .mjs: el runtime 2.0.22 rechaza la ruta de archivo explícita aunque algunos ejemplos actuales de documentación la admitan.

```powershell
# Desde v2/
npm ci --ignore-scripts
npm test
npm run build:dist

# Regresiones rápidas sin modelos
npm run test:unit
```

`runtime.test.mjs` arranca un servidor privado autenticado, espera activación del plugin y comprueba el registro real, perfiles, permisos y configuración, sin llamar modelos. Lo termina antes de limpiar su fixture. Las pruebas unitarias invocan los executors con contextos simulados; eso no sustituye un recorrido con delegación real.

El smoke usa la API V2 de sesión/mensajes, no `export` ni campos V1 de `task`. Recoge sesiones hijas por `parentID` y pagina mensajes. Preserva fixture y transcript si falla, y reporta tokens/coste del runtime si termina. No usa autoaprobación de permisos.

Los escenarios `positive`, `guards`, `recovery`, `nested`, `compatible`, `fundamental` y `rejection` consumen un ZIP existente mediante descompresión y BAT; no instalan npm. `--zip` selecciona el archivo; por defecto usa dist/CSDD-v1.zip. Conservan evidencia en éxito y fallo por defecto; `--discard` permite limpiar únicamente un éxito. El harness agrega un plugin de presupuesto sin dependencia npm, no incluido en la entrega. Las respuestas se extraen de mensajes V2 type: assistant / content, sin mezclar prompts o resultados de tools. Se exige que Orchestrator presente la huella y que el Reviewer responda en una sesión independiente terminada correctamente.

La recuperación usa una marca durable docs/base/.genesis-recovery-pending. Un rechazo con disposition: abandoned conserva el bloque y permite un ID nuevo; no reinicia lifecycle. Las pruebas deterministas cubren ventanas de escritura; no certifican por sí solas que un modelo seguirá el procedimiento.

## Historia Del Presupuesto Y Validación Anterior

Antes de ejecutarlo, seleccionar modelo y revisar su precio. Estimación inicial del positivo: 5–10 invocaciones de agentes, 50–150 mil tokens de entrada acumulada y 5–20 mil de salida, con variación por revisión y caché. Los escenarios extensos necesitan una estimación separada. Límites: 16 pasos por agente, 48 llamadas al modelo por proceso, hasta 6 mil tokens de salida por llamada y diez minutos por interacción. El límite de llamadas no equivale a un tope monetario ni a la estimación de consumo; no escalar automáticamente tras un fallo. El contador se mantiene en el plugin de fixture: no recargarlo ni reiniciar el servidor durante el recorrido.

La evidencia siguiente documenta el flujo anterior y sus huellas originales. Sus requisitos de batería no rigen el flujo simplificado descrito al inicio. No se reclasifican intentos ni se sustituye una conversación real por simulaciones.

Validación de esta entrega con Node.js `24.13.1`: suite common + V2, 35 pruebas, 33 aprobadas y 2 omitidas por permisos de symlink, sin fallos. Incluye instalación del ZIP con rutas de espacios/acentos/!, conflictos y paquete incompleto; carga en el host con PATH vacío y registry npm inválido, sin paquetes externos en destino. No equivale a red físicamente bloqueada ni máquina limpia: el análisis del bundle comprueba también que solo quedan imports node:. No se usaron modelos durante esta validación. V1 mantiene evidencia histórica y requiere su runtime propio para revalidación.

## Ensayo Agentic Del 2026-10-04

Tres intentos del positivo con `openai/gpt-6.1-sol`, ZIP SHA-256 `683bf64d45bf41827fd58b449408ea399e54c7980534e49487521d979771db14`. Ninguno acredita cierre:

- `csdd-v2-genesis-NcDvJH/project`: borrador creado mediante Orchestrator → Canon; extracción detenida por interpretar incorrectamente el cursor de sesiones. Transcript recuperado sin llamadas nuevas al modelo.
- `csdd-v2-genesis-Jb6w7R/project`: huella presentada y aprobación simulada registrada; no hubo proyecciones porque el ensayo mantenía su prohibición explícita. El agente respetó el límite.
- `csdd-v2-genesis-YbI67f/project`: autorización explícita de materialización, pero timeout de diez minutos en esa interacción. Llamada csdd_write de Canon incompleta e interrumpida, sin revisión ni cierre; causa no determinada. No se reintentó después.

Las carpetas permanecen en `C:/Users/Michael/AppData/Local/Temp/`, con `transcript.json` y `smoke-result.json`. Consumo acumulado reportado: 161.510 tokens de entrada, 709.376 de caché, 18.303 de salida y 347 de razonamiento; son campos del runtime, no se presume que sean categorías disjuntas. Coste reportado cero no demuestra gratuidad.

Corregidos en el harness: paginación de sesiones, separación de borrador/presentación/aprobación con autorización administrativa explícita, y herramientas V2 identificadas por name, no tool. El ZIP no cambió. Suite posterior: 35 pruebas, 33 aprobadas, 2 omitidas, ningún fallo. Antes de la prueba humana falta diagnosticar el timeout y completar el positivo, luego ampliar incrementalmente a los demás escenarios.

## Repetición Agentic: Positivo Conforme Y Límite De Guards

Tras la hipótesis humana de demora al conceder acceso, se repitió con el mismo ZIP y modelo. No se verificó retrospectivamente que aquella demora causara el timeout. La primera repetición (`csdd-v2-genesis-FJyd9y/project`) llegó a proyecciones y Reviewer conforme, pero falló por UND_ERR_HEADERS_TIMEOUT al esperar la etapa final. Se cambió el harness para esperar en intervalos de veinte segundos manteniendo el límite total de diez minutos; ahora consulta permisos pendientes y detiene con evidencia, sin aprobarlos automáticamente. Dos pruebas deterministas cubren ambas condiciones.

- **positive: passed**, `csdd-v2-genesis-mOyJ82/project`, sesión `ses_ef6ebf3f6ffesyFMc09bFatLGH`: huella presentada y aprobación simulada, tres proyecciones, Reviewer con referencias finales, stage closed y marca de recuperación retirada. Sin permiso pendiente detectado. Consumo: 87.158 entrada, 785.536 caché y 19.286 salida; coste cero reportado no acredita gratuidad.
- **guards: failed por presupuesto**, `csdd-v2-genesis-mJoc8v/project`: las tres comprobaciones previas de no materialización ante aceptación ambigua, huella incorrecta y huella desactualizada pasaron. Después de aprobación válida y comprobación del Reviewer, una corrección menor de precisión probatoria consumió el límite de 48 llamadas antes de cerrar. No se registra el escenario entero como aprobado ni se amplió el límite. Sin permiso pendiente detectado.

Evidencia en C:/Users/Michael/AppData/Local/Temp/, archivos transcript.json y smoke-result.json de cada fixture. Solo el positivo está cerrado; recovery, nested, compatible, fundamental y rejection siguen sin ejecutar. Falta resolver el presupuesto del escenario guards antes de ampliar la tanda y declarar la batería agentic completa. El ZIP permanece sin cambios; los ajustes son del harness.

## Riesgo De Dependencias (Detalle)

## Guards Con Presupuesto Autorizado De 72 Llamadas

Se ejecutó guards con --max-calls 72 y el mismo ZIP/modelo. Fixture: `C:/Users/Michael/AppData/Local/Temp/csdd-v2-genesis-IIOE25/project`. Las comprobaciones de aprobación inválida, cuerpo congelado, stage closed y huellas registradas pasaron; la aceptación se detuvo al exigir lifecycle_state: pre_fr: Roadmap contiene lifecycle: pre_fr. La plantilla local especifica lifecycle_state. No se relajó el oráculo ni se registró el escenario como aprobado; las comprobaciones posteriores de Reviewer final y retirada de marca no llegaron a ejecutarse en este intento. Debe revisarse la coherencia entre contrato administrativo, perfiles y rúbrica antes de decidir la corrección.

Consumo reportado: 114.656 tokens de entrada, 869.632 de caché y 18.468 de salida. Evidencia completa en transcript.json y smoke-result.json. Se detuvo la tanda ante este nuevo fallo según el límite acordado; recovery, nested, compatible, fundamental y rejection siguen sin ejecutar. El harness admite --max-calls entre 1 y 72, conserva 48 por defecto y registra el límite usado en el reporte.

La instalación anterior reportó 12 alertas altas. Al agregar esbuild 0.25.12 para construir la distribución, npm resolvió nuevamente parte de las transitivas: el audit actual reporta una alerta alta en http-cache-semantics (GHSA-ch52-4w7c-c8xp), con corrección disponible. No se ejecutó npm audit fix ni se introdujeron overrides. Es un riesgo del árbol de desarrollo; el bundle solo incorpora los módulos con bytes efectivos identificados en BUNDLE-REPORT.json y no necesita descargar ese árbol en destino. No se afirma que el entorno OpenCode ni todo el código esté libre de vulnerabilidades. Revisar el reporte al cambiar dependencias y revalidar.

## Integración Estructurada Y Evidencia Del Candidato Actual

csdd_write recibe únicamente artifact/operation/data. Plantillas Markdown derivadas del contrato JSON, parches de fuentes vigentes, preservación desde archivo de cuerpo y decisión aprobados y límite operativo de cuatro reparaciones están conectados. Suite common + V2: 59 pruebas, 57 aprobadas, 2 omitidas por permisos de symlink, cero fallos; incluye distribución y carga sin npm en destino. V1 adaptado en fuentes, sin certificación de su runtime.

Modelo de todos los ensayos siguientes: openai/gpt-6.1-sol; máximo 72 llamadas por proceso. Evidencia en C:/Users/Michael/AppData/Local/Temp/<fixture>/project, transcript.json y smoke-result.json. Aprobaciones simuladas, no humanas reales.

ZIP anterior estructurado SHA-256 a3998952eb053c0e99a47c9032e44d3a25bb229cfe52207012f06c4f13c2ee56:
- positive passed: csdd-v2-genesis-BmtF9x.
- guards passed: csdd-v2-genesis-DGpmqA, tras corregir una alteración de fixture fuera del contrato (fallo preservado en csdd-v2-genesis-bs9Gq6).
- recovery passed: csdd-v2-genesis-CuPT1Q.
- nested failed: csdd-v2-genesis-1pZg0o; cierre obtenido, pero sin delegación real Canon → Reviewer. Se aclaró en el perfil el permiso de crítica provisional por encargo explícito; esto cambió el ZIP.

ZIP anterior a los ajustes de frontera literal/semántica SHA-256 65c714be97634f6e8bd3d860a050a28fa168a1ebfe7e1b8e15e52cbf57c7c7e0:
- nested passed: csdd-v2-genesis-C0A8tw.
- compatible passed: csdd-v2-genesis-CaesTJ.
- fundamental failed: csdd-v2-genesis-zbQdeT; el harness aprobaba sin levantar la prohibición previa de materializar. Se corrigió la autorización simulada, no el ZIP ni el oráculo.
- fundamental failed por presupuesto: csdd-v2-genesis-24wifB; agotó 72 llamadas tras aplicar revisión y registrar primera conformidad, antes de verificación final y cierre. Consumo reportado: 229.914 entrada, 1.680.512 caché y 27.385 salida. No se amplió el límite, no se reinició la fixture y no se atribuye cierre al resultado parcial.

Se autorizó elevar el máximo a 120 llamadas únicamente para fundamental y rejection, manteniendo parada ante otro fallo. El harness acepta ese máximo solo en esos dos escenarios; los demás conservan techo de 72 y el valor por defecto sigue siendo 48.

- fundamental failed con máximo 120: csdd-v2-genesis-Kz03eZ. No agotó el presupuesto: Canon y Orchestrator identificaron una decisión abierta sobre compartir dispositivo o usar dispositivos distintos. El harness envió aprobación y autorización sin responderla; el agente mantuvo correctamente el bloque pendiente, por lo que falló la exigencia de cierre. Consumo reportado: 158.923 entrada, 1.136.384 caché y 17.211 salida. Se detuvo la tanda, sin ejecutar rejection ni cambiar el ZIP. Falta decidir una aclaración explícita de la fixture; no se fuerza una opción ni se reclasifica el fallo como éxito.

Se autorizó aclarar exclusivamente la fixture: los miembros comparten un dispositivo y se mantienen las exclusiones de cuentas y sincronización. No cambia el ZIP ni representa una decisión de producto real. La nueva propuesta posterior a un rechazo conserva explícitamente esos límites.

- fundamental passed con máximo 120: csdd-v2-genesis-pXrO4q, sesión ses_ef0ff95a8ffeZ3Z47QirDSth0U. Pasó conservación de historia, huella aprobada, regla de descripción no vacía y lifecycle pre_fr, reconciliación sobre fuentes actuales, revisión independiente final, cierre y retirada de marca. Consumo reportado: 212.803 entrada, 2.197.504 caché y 30.514 salida.
- rejection failed con máximo 120: csdd-v2-genesis-f0SOTH. Falló en el cierre del acuerdo inicial, antes de ejecutar el rechazo. Reviewer confirmó fidelidad y huellas, pero devolvió non_conforming por decisiones abiertas sobre descripciones de solo espacios y alcance de salir/volver. Genesis y Roadmap permanecieron pending y se conservó la marca. Consumo reportado: 82.431 entrada, 521.472 caché y 10.731 salida. No se demuestra un fallo de la operación de rechazo; tampoco se acredita ese escenario. Se detuvo la tanda sin modificar el ZIP ni omitir hallazgos.

Se autorizaron dos aclaraciones adicionales solo para la fixture inicial de rejection: descripción de solo espacios inválida y cierre normal/reapertura en el mismo dispositivo, sin fallos ni reinstalación. Se incluyeron exclusivamente en el prompt inicial de ese escenario.

- rejection failed por oráculo textual con máximo 120: csdd-v2-genesis-7n6ICX. El recorrido ejecutó rechazo/abandono, preservó el bloque y añadió una propuesta con ID nuevo; tras aprobación simulada, obtuvo revisión independiente conforme y cierre. El harness falló al buscar /no vací|no vaci|no.*vacío/ en Specs, que expresa la regla como «Una descripción vacía no es válida». La revisión independiente inicial de la nueva propuesta verifica explícitamente descripción vacía/solo espacios inválida. Consumo: 256.156 entrada, 2.537.984 caché y 34.271 salida. No se modificó la fixture ni se reclasificó su smoke-result.json.
- Comprobación posterior sin modelos y de solo lectura de esa misma evidencia: tres registros, segundo rejected/abandoned y tercero approved/closed; lifecycle pre_fr; indicador pendiente ausente; tres huellas finales coincidentes con Materialización; Reviewer final conforme independiente con esas huellas; marca técnica ausente. Pasaron las comprobaciones posteriores que el fallo textual había impedido ejecutar. Esto no convierte el reporte automático original en passed ni acredita siete recorridos sobre el mismo ZIP.

Pendiente: corregir la comprobación semántica de conservación de la regla sin listas de aliases ni exigir una formulación literal, repetir rejection con harness corregido, revalidar positive/guards/recovery sobre la huella actual y conversación humana real. No hay siete escenarios aprobados sobre un mismo ZIP. Siguen pendientes máquina limpia y red físicamente bloqueada. Coste cero reportado por runtime no acredita gratuidad.

## Ajustes De La Frontera Literal/Semántica

ZIP de los ajustes iniciales de frontera dist/CSDD-v1.zip SHA-256 e98158b164aa6c5dc7528f17c70d1144a24d06eb9d29b079f24702f4f59d5a33. No hereda la validación agentic de las huellas anteriores.

- Guardas de cierre y recuperación: estados y referencias exclusivamente en sus campos administrativos; se retiraron variantes textuales heredadas y búsquedas de huellas en narrativa.
- Reparación: clasificación mediante códigos de guarda, independiente de la redacción del mensaje.
- Notas: el parser conserva subtítulos narrativos admitidos; encabezados administrativos generados permanecen reservados para delimitar campos.
- Reviewer: reporte JSON sin texto exterior, referencias por artefacto y sesión real; distingue semantic (criterio preserved_rules con evidencia) de administrative. El harness exige ambos tipos de evidencia sobre las versiones correspondientes y no busca frases del producto ni acepta veredictos citados. Valida coherencia estructural del reporte, no demuestra por sí solo la corrección del juicio semántico.
- Las comparaciones exactas de snapshots, IDs, campos y huellas se conservan. Se actualizaron las fixtures deterministas al nombre canónico de las referencias, sin añadir compatibilidad con aliases. Los controles textuales análogos V1 se ajustaron en fuentes, sin certificar su runtime ni migrar todas sus fixtures históricas.

Suite common + V2 posterior a los ajustes: 64 pruebas, 62 aprobadas, 2 omitidas por permisos de symlink y cero fallos. Incluye instalación BAT, carga real sin modelos y regresiones de la frontera administrativa/narrativa. No se ejecutaron nuevas llamadas a modelos ni se modificó evidencia histórica. Falta revalidar los siete escenarios sobre este ZIP, luego conversación humana real; red físicamente bloqueada y máquina limpia siguen pendientes.

## Revalidación Del ZIP e98158b

Modelo openai/gpt-6.1-sol, runtime 2.0.22, máximo 72 llamadas por proceso; recorridos secuenciales con parada al primer fallo. No se modificó el ZIP ni se reintentaron escenarios.

- positive passed: csdd-v2-genesis-JqlFwJ/project, sesión ses_ef08b0180ffeXGLMlRd6fvJ7Pm. Pasaron aprobación simulada, proyecciones, evaluación semántica explícita sobre versiones materializadas, revisión independiente final, referencias por campo, cierre y retirada de marca. Consumo reportado: 111.637 entrada, 1.031.808 caché y 18.157 salida.
- guards failed: csdd-v2-genesis-6iYLeL/project, sesión ses_ef0852964ffe4Rg4WZQPhCPVEJ. No hubo proyecciones ante aceptación ambigua, referencia incorrecta ni referencia desactualizada. Falló la exigencia de que Orchestrator presentara la nueva huella antes de la aprobación válida. El harness añadió una exclusión de notificaciones sin informar su procedencia al agente; Canon detectó la diferencia, mantuvo pending y pidió decidir si conservarla o restaurar el cuerpo presentado. Orchestrator trasladó esa decisión sin presentar la nueva huella. La evidencia no demuestra fallo de la guarda de aprobación; el recorrido completo permanece failed. Consumo reportado: 78.763 entrada, 269.312 caché y 5.079 salida.

Evidencia preservada en transcript.json y smoke-result.json de ambas fixtures bajo C:/Users/Michael/AppData/Local/Temp/. No se modificaron esos reportes. Coste cero reportado no acredita gratuidad. Recovery, nested, compatible, fundamental y rejection no se ejecutaron en esta tanda. Queda abierta una aclaración de la fixture guards sobre la procedencia y decisión humana de conservar el cambio inyectado; no se aplicó ni se rebajó la comprobación de presentación de huella.

## Evaluador Por Puntos De Control

ZIP actual dist/CSDD-v1.zip SHA-256 d6b7b1397db309d8818ebb05e3f57c0bd300cbb9be976a22606754bac82a2caa. Cambiaron perfiles y protocolo: no hereda certificación de recorridos de paquetes anteriores. No se ejecutaron modelos en este ajuste.

Versiones del experimento: genesis-fixtures-2 y genesis-checkpoints-2. `tests/fixtures.mjs` fija intención, límites, decisiones, aclaraciones autorizadas y criterios de los siete escenarios antes de ejecutar. El caso guards mantiene la aprobación obsoleta y su comprobación de no aprobación/proyección; después resuelve explícitamente el cambio introducido por la persona simulada, conservándolo sin aprobarlo todavía. No se modifica ni reclasifica el fallo histórico.

`tests/checkpoints.mjs` separa invariantes deterministas de adjudicación semántica supervisada. Acepta variaciones conversacionales sin clasificarlas por palabras. Cada punto puede enviar como máximo dos aclaraciones predefinidas, nunca una respuesta libre inventada para alcanzar cierre. Si falta una decisión, se detiene como experimento no resuelto. Un criterio semántico incumplido se atribuye al producto únicamente con adjudicación explícita y evidencia. Aserciones no adjudicadas conservan categoría unattributed; permisos pendientes, timeout de interacción y sesiones no exitosas registran interrupción, sin atribuir automáticamente un defecto al producto.

### Supervisión

Ejemplo de ejecución desde v2: `node tests/run-genesis-smoke.mjs --scenario guards --model openai/gpt-6.1-sol --max-calls 72 --supervised`. Sin --supervised el harness rechaza iniciar llamadas. No hay simulador LLM adicional ni aprobación de permisos automática.

En cada pausa imprime una ruta `project/supervision/NNN.request.json`, con estado, snapshots, familia de sesiones, criterio y acciones disponibles. El supervisor debe contrastarlos con fixture.json y las fuentes reales. Para responder crea junto a ella `NNN.decision.json`:

```json
{
  "checkpoint": "001",
  "request_digest": "<copiar el digest del request concreto>",
  "action": "<una clave de actions del request>",
  "evidence": "Criterio, ubicación y contraste que justifican la acción; no solo un verdict."
}
```

`accept` solo está disponible cuando se cumple el punto de control determinista. No basta ver una huella: para presentación debe existir informe actual aprobable, no cita ni ejemplo; para revisión debe haber fidelidad real y evidencia suficiente. Las acciones de aclaración envían exclusivamente mensajes de la fixture. `stop` detiene por condición no resuelta; `violation` requiere incumplimiento semántico demostrado. La respuesta se valida contra checkpoint/digest, se conserva como NNN.adjudication.json y no se sobrescribe. Espera máxima de adjudicación: diez minutos, sin nuevas llamadas durante esa pausa. No editar evidencia de corridas anteriores ni automatizar accept para conseguir resultados.

### Cobertura Y Límites

- Critica provisional draft: solo Genesis e intent_fidelity. No exige proyecciones inexistentes ni acredita cierre.
- Evaluación semantic: cuatro referencias y preserved_rules. La comprobación administrative final identifica semantic_review_reference, anterior y real, y las cuatro versiones finales.
- `tests/review-chain.mjs` reconstruye versiones de Roadmap desde escrituras estructuradas realizadas, ordenadas por tiempo. Resuelve placeholders solo desde resultados administrativos de csdd_revision anteriores. Si no puede reproducir la versión referenciada, no acredita la cadena. No sustituye evidencia ausente con una huella citada en narrativa.
- Tras semantic, el registro de cierre puede cambiar campos administrativos y Procedencia Y Evidencia, no Now ni otras secciones de producto. El contenido de evidencia también se adjudica por significado: su ubicación no lo convierte automáticamente en administrativo.
- Compatible protege todos los documentos existentes, no solo Genesis y Specs. Propuesta fundamental permite exclusivamente el indicador pendiente en Roadmap antes de aprobación, sin proyección semántica. Rechazo preserva canon vigente y bloque abandonado antes de abrir otro ID.
- Fundamental/rejection incluyen evolución explícita de evidencia vigente posterior al cierre inicial y ajena al cambio de destinatario. Se conserva un snapshot con su procedencia ficticia y fecha, así como su contenido protegido; no demuestra por sí solo conservación de toda evolución posible ni migración post_fr.
- Los invariantes se comprueban en los puntos de control y las escrituras de Roadmap se reconstruyen desde el transcript. No se declara protección frente a concurrencia hostil ni observación universal de toda escritura transitoria fuera de las tools.

Suite common + V2: 81 pruebas, 79 aprobadas, 2 omitidas por permisos de symlink y cero fallos. Incluye conversaciones sintéticas con paráfrasis y órdenes distintos, preguntas no previstas, aclaraciones repetidas, referencias de otras sesiones/versiones, revisión draft confundida con cierre, cambios transitorios de Roadmap y preservación de fuentes. Estas pruebas validan mecanismos deterministas con adjudicaciones simuladas; no prueban la calidad del supervisor ni robustez estadística de los agentes.

Pendiente: piloto guards supervisado, siete recorridos completos sobre esta huella, luego repeticiones con condiciones congeladas y presupuesto revisado. No se realizaron esas corridas, conversación humana real ni certificación V1. El máximo propuesto de la tanda es 600 llamadas (cinco casos de 72 y dos de 120), sin reintentos automáticos y con parada ante incumplimiento o situación no prevista; una repetición extensa requiere revisar el consumo observado y su autorización.

## Piloto Supervisado Del ZIP d6b7b139

guards failed con máximo 72, modelo openai/gpt-6.1-sol y runtime 2.0.22. Fixture: C:/Users/Michael/AppData/Local/Temp/opencode/csdd-supervised-smDSdU/csdd-v2-genesis-vDnI6T/project; sesión ses_eec24ab93ffebP31SS1PMqB2A3. SHA-256 del ZIP: d6b7b1397db309d8818ebb05e3f57c0bd300cbb9be976a22606754bac82a2caa. No se cambió el paquete ni se ejecutaron los seis casos siguientes.

Los tres checkpoints adjudicados aceptaron borrador, presentación inicial y presentación del cuerpo modificado. Las comprobaciones de aceptación ambigua, referencia incorrecta y referencia obsoleta mantuvieron decisión pending y ninguna proyección. Ante el cambio, Orchestrator pidió decidir su conservación; la resolución fue la fijada en la fixture antes del ensayo, no una respuesta improvisada. Presentó correctamente la nueva versión y referencia, sin aprobarla todavía.

Tras la aprobación simulada válida, se registró approved y se crearon las tres proyecciones. Mientras el harness esperaba la sesión, fetch falló con causa estructurada ECONNRESET/read. La extracción del transcript final también falló. El reporte original mantiene status failed y failure_category unattributed; no se editó para atribuir fallo de producto ni para hacerlo pasar. La causa del corte de transporte no está establecida. Los logs del servidor privado, run 4ef6e9cc, no aportaron una terminación fatal explícita; los HTTP 499 de wait también ocurrieron antes en interacciones exitosas y no se consideran causa demostrada.

Lectura posterior sin modelos: cuerpo aprobado conserva su referencia 78cac76799569e9ff641ce3fb315cc7ee6d7a437d8a85f946f0fbb07c995b449; Genesis stage pending, Roadmap genesis_closure pending y lifecycle pre_fr; marca de recuperación presente. No se acreditaron revisión final ni cierre. Las familias de sesiones disponibles están dentro de supervision/001–003.request.json; las decisiones y adjudicaciones se conservaron junto a ellas. stdout.log y stderr.log están en el contenedor csdd-supervised-smDSdU. diagnosis-readonly.json registra la comprobación posterior, sin alterar evidencia original.

Consumo parcial al checkpoint 003: 58.416 entrada, 484.480 caché, 6.468 salida y 97 razonamiento. No incluye la materialización posterior y no permite calcular consumo total; usage vacío en el reporte fallido no significa consumo cero. La supervisión fue juicio semántico del asistente, no nuevas llamadas del simulador de fixture ni aprobación humana real. Se detuvo la tanda al primer fallo, sin reintento ni reinicio del servidor para continuar el experimento. Falta diagnosticar/capturar el corte y acordar repetición del piloto antes de reanudar los recorridos.

## Repetición Autorizada Tras El Corte

El usuario indicó que cerró una ventana CMD y autorizó repetir lo pendiente. Ese cierre es una hipótesis plausible del ECONNRESET anterior, no causa confirmada. El intento anterior y su reporte permanecen intactos.

Mismo ZIP d6b7b1397db309d8818ebb05e3f57c0bd300cbb9be976a22606754bac82a2caa, modelo openai/gpt-6.1-sol, runtime 2.0.22, fixtures genesis-fixtures-2 y evaluador genesis-checkpoints-2. Máximo 72 llamadas por caso ejecutado; sin modificación del ZIP ni reintentos automáticos.

| Escenario | Resultado | Fixture bajo C:/Users/Michael/AppData/Local/Temp/opencode/ | Entrada | Caché leída | Salida |
| --- | --- | --- | ---: | ---: | ---: |
| guards | passed | csdd-supervised-DV5qQJ/csdd-v2-genesis-WufHMA/project | 126.875 | 1.409.536 | 23.205 |
| positive | passed | csdd-supervised-8mrjfE/csdd-v2-genesis-Iu0SQz/project | 111.906 | 901.760 | 15.953 |
| recovery | unresolved | csdd-supervised-R2xhsp/csdd-v2-genesis-GeO3Pd/project | 91.560 | 208.128 | 5.726 |

guards pasó las tres protecciones de aprobación, presentó la versión actualizada después de la resolución predefinida, materializó proyecciones fieles, vinculó reportes semantic/administrative a versiones, cerró y retiró la marca. Positive pasó presentación, aprobación simulada, proyecciones, ambas revisiones vinculadas, cierre y retirada de marca. Sus reportes están en smoke-result.json y transcript.json; cada juicio se conserva en supervision/*.request.json, *.decision.json y *.adjudication.json. No se acredita autoridad humana real ni comportamiento funcional.

Recovery no presentó corte de conexión ni agotamiento de presupuesto. El agente preservó el cuerpo y la decisión inyectados, no creó proyecciones y mantuvo la marca; negó materialización porque el registro declara aprobación ficticia sin transcript verificable. Se usó únicamente clarify_authorized_scope, disponible y fijada antes de ejecutar. La respuesta mantuvo el bloqueo de evidencia, no identificó una decisión nueva de producto; al agotarse esa aclaración se adjudicó stop y el reporte registró unresolved/experiment_unresolved. No se inventó intervención humana ni se forzó cierre.

Revisión posterior de fuentes sin modelos: protocols/genesis.md exige referencia a la intervención humana y dispone detenerse ante aprobación declarada no comprobable; la recuperación no requiere repetir una aprobación que sigue siendo comprobable. El perfil Orchestrator también indica que un campo approved no constituye aprobación. La fixture actual, en cambio, usa opencode-session:ses_recovery_fixture_001 y declara expresamente que ese transcript no existe. Esta discrepancia fue omitida por la revisión anterior del diseño. No se atribuye el bloqueo a falta de robustez del LLM ni se reclasifica el intento como pasado: falta representar un estado interrumpido con una intervención de aprobación simulada realmente registrada e identificable, y evaluar separadamente el rechazo de un registro sin esa evidencia.

Se detuvo la tanda ante la situación no prevista, sin ejecutar nested, compatible, fundamental ni rejection. Consumo reportado de los tres casos: 330.341 entrada, 2.519.424 caché leída y 44.884 salida; categorías del runtime, no se presupone que sean disjuntas. Coste cero reportado no acredita gratuidad. Falta aprobar el ajuste de preparación de recovery, conservar criterios y evidencia histórica, probarlo sin modelos y después repetir lo pendiente; no se implementó ese ajuste.

### Recuperación Con Aprobación Registrada

Con autorización del usuario, la preparación recovery usa genesis-recovery-fixture-3: mensaje de aprobación realmente registrado, comprobación determinista de intervención/decisión/referencia y pausa sin proyecciones antes de crear la sesión de recuperación. No cambia el ZIP ni autentica autoridad humana real. El intento csdd-supervised-oPJ3y4/csdd-v2-genesis-KwP5fg/project quedó interrupted/execution_interrupted: los eventos de Windows acreditan suspensión entre 01:41 y 02:43 UTC, coincidente con la ausencia de actividad; no demuestra una hora de bloqueo del modelo ni fallo del temporizador durante ejecución activa.

La repetición autorizada csdd-supervised-mpZ5XW/csdd-v2-genesis-ibhQbJ/project, misma huella d6b7b1397db309d8818ebb05e3f57c0bd300cbb9be976a22606754bac82a2caa, terminó unresolved/experiment_unresolved. Pasó borrador, presentación y aprobación durable en sesión real ses_eeb4421e0ffejuMHQGFqSD7qHZ, mensaje msg_114beb2d5001zZLHRUlcYEjLT0. La sesión nueva no pudo comprobar esa intervención: subagent rechazó la sesión original por no ser hija de la actual; glob/read externos fueron rechazados por external_directory. No hubo proyecciones, modificación de cuerpo/decisión ni cierre. Se adjudicó stop en checkpoint 004; aclarar alcance no resolvería el acceso, por lo que no se envió una aclaración inútil ni se ampliaron permisos.

Esta evidencia corrige la suficiencia supuesta del ajuste anterior: registrar realmente la aprobación no garantiza que otra sesión pueda consultarla. Queda por decidir el mecanismo autorizado de consulta de procedencia entre sesiones y su suficiencia para recuperación ordinaria, antes de otro ensayo; no se implementó un mecanismo nuevo ni se atribuyó por omisión el bloqueo al producto. Consumo reportado de esta repetición: 93.647 entrada, 372.352 caché leída y 7.662 salida; coste monetario no acreditado. Se mantuvo parada secuencial y no se ejecutaron nested, compatible, fundamental ni rejection. Guards y positive conservan sus resultados anteriores; los intentos de recovery permanecen sin reclasificar.

### Constancia Local De Aprobación V2

Cambio de producto autorizado: `csdd_write` obtiene la intervención original mediante `ctx.session.context`, comprueba sesión/workspace, tipo user, ID, fecha y frase exacta contra el cuerpo vigente; persiste `docs/base/.approval-<digest>.json` antes de la decisión. `csdd_revision:genesis` devuelve approval_evidence recorded solo si constancia, decisión y cuerpo coinciden. Los escritores V2 bloquean continuación de un registro approved sin esa evidencia. No requiere reabrir una sesión anterior ni leer bases externas; no autentica identidad humana ni resiste manipulación hostil del workspace. El contrato y los tres perfiles explicitan su uso. No se importa evidencia histórica automáticamente.

Comprobación sin modelos: API real del plugin 2.0.22 recuperó el mensaje original conservado del ensayo anterior. Prueba de tools registra aprobación desde runtime y verifica recuperación desde otra sesión sin acceso al historial; ausencia de evidencia bloquea escrituras. Se verifican constancia huérfana sin aprobación, idempotencia, fuente de otro workspace, cancelación, corrupción, cuerpo/decisión discordantes y rechazo de citas/sintéticos. Suite completa: 91 pruebas, 89 aprobadas, cero fallos, dos omitidas por permisos de symlink. El ejecutable global era 2.0.24; se utilizó 2.0.22 instalado aisladamente en `C:/Users/Michael/AppData/Local/Temp/opencode/csdd-runtime-approved-2.0.22`, sin modificar el global ni la baseline.

ZIP reconstruido: f2bb723e1069db28aa0f63a68a1d0d191ad29149f76c76f5400bbe3eb49722e3. ZIP previo conservado en `C:/Users/Michael/AppData/Local/Temp/opencode/CSDD-v1-d6b7b1397db309d8818ebb05e3f57c0bd300cbb9be976a22606754bac82a2caa.zip`. Evaluador genesis-checkpoints-3 incluye comprobación determinista de constancia; permite únicamente el archivo exacto de evidencia validado al registrar aprobación, no una excepción genérica de archivos. Fixtures genesis-fixtures-3, recovery genesis-recovery-fixture-4. Juicio narrativo y demás invariantes se mantienen.

| Escenario | Resultado | Fixture bajo C:/Users/Michael/AppData/Local/Temp/opencode/ |
| --- | --- | --- |
| recovery | passed | csdd-supervised-1CdSCD/csdd-v2-genesis-7HYX5o/project |
| nested | failed/unattributed | csdd-supervised-cqPctr/csdd-v2-genesis-pM83Xb/project |

Recovery completó aprobación real del ensayo, constancia durable y recuperación desde otra sesión sin aprobar de nuevo ni reabrir la original; proyecciones fieles, reportes semantic/administrative vinculados, conservación del cuerpo/decisión, cierre y retirada de marca. Aprobación simulada no demuestra autoridad humana real ni comportamiento implementado.

Nested alcanzó cierre documental observado y adjudicación semántica favorable en checkpoint 003, pero la comprobación posterior rechazó referencia administrativa: Reviewer real ses_ee68ea03cffeZZAHSrBOJ14hs4 emitió review_reference `opencode-session:ses_ee68ea03cffeZZAHSrBOJ14hs4#administrative-01`, registrada también en Materialización. El contrato exige exactamente `opencode-session:<ID de tu sesión real>`; conformingReview exige esa identidad y no aceptó el sufijo. El reporte administrative existe con huellas finales, pero la referencia incumple el contrato. No se llegó al checkpoint de cadena/validación final de nested. El parser compartido acepta startsWith y la escritura no detectó ese sufijo antes del cierre: queda pendiente reconciliar la validación de reportes con la identidad exacta requerida, no relajar el evaluador para aprobar la respuesta. Reporte original conservado sin reclasificación y tanda detenida sin reintento.

Consumo reportado: recovery 167.877 entrada, 983.168 caché leída y 18.456 salida; nested 115.876 entrada, 1.036.544 caché leída y 17.961 salida. No se acredita tarifa monetaria. Positive, guards, compatible, fundamental y rejection no ejecutados sobre esta nueva huella. No se heredan aprobaciones de ZIPs anteriores; batería completa y conversación humana siguen pendientes.

### Separación De Juicio Y Administración

Cambio autorizado: Reviewer V2 usa csdd_review begin/complete; begin determina tipo y captura snapshots/referencias, complete admite solo juicio semántico, rechaza metadatos del LLM y cambios de archivos durante revisión, y genera reporte con sesión/mensaje reales, huellas y vínculo temporal. Conserva reportes y snapshots en docs/base/.review-<digest>.json; latest permite consulta sin reconstrucción por el agente. La comprobación administrative solo continúa a partir de un semantic conforme de las versiones protegidas y Roadmap sin cambios de producto. Canon no entrega fechas, IDs nuevos de revisión, referencias de aprobación/rechazo ni campos de evidencia de cierre: el adapter obtiene la intervención de usuario de la raíz, calcula referencias y registra los dos reportes reales al cerrar. El indicador de revisión de Roadmap se obtiene del bloque activo. Se conservan identidad declarada, estados solicitados y narrativa como entradas que requieren autoridad/juicio, no se autentica identidad humana.

El contrato documental describe persistencia, no una obligación de que el LLM construya campos administrativos. Los perfiles, protocolo, permisos y fixtures fueron reconciliados. El parser de reportes tampoco acepta sufijos en referencias de sesión. V2 evalúa reportes emitidos por la tool, asociados al mensaje real, no JSON construido o citado por el LLM. V1 conserva fuentes y no está certificado.

Candidato nuevo: f03710bb61b304596d8ae91b19bf1b23c556a94aa10b242776878769b81f2567. ZIP anterior f2bb723e conservado en el directorio temporal aprobado. Suite posterior completa en runtime aislado 2.0.22: 95 pruebas, 93 aprobadas, cero fallos y dos omitidas por symlinks; incluye cadena automática hasta cierre, rechazo de metadatos fabricados, revisión final ausente, versiones cambiadas, snapshots reales y resolución de placeholders. No hubo modificación del runtime global.

La tanda nueva comenzó por nested, fixtures genesis-fixtures-4/evaluador genesis-checkpoints-4, máximo 72 llamadas, fixture csdd-supervised-pPhxgN/csdd-v2-genesis-bjlYFB/project. Borrador y presentación fueron aceptados; crítica draft real hija de Canon, revisión semantic/administrative independiente y cierre con constancia de aprobación se observaron. El checkpoint 003 aceptó significado sujeto a comprobaciones posteriores. La cadena final falló con "No hay snapshot reproducible de Roadmap para la evaluación semántica"; smoke-result.json permanece failed/unattributed.

Diagnóstico sin modelos: roadmapVersions tomó applied_data enriquecido pero todavía con placeholders narrativos sin resolver. Eso produjo una huella de reconstrucción distinta del archivo realmente persistido. Los snapshots reales de csdd_review begin y ambas revisiones sí estaban conservados y sus referencias eran correctas. Se corrigió únicamente el evaluador: resolución de placeholders también en applied_data e incorporación de snapshots reales de begin, contrastando su contenido con su huella. Las pruebas mantienen invariantes de cadena, temporalidad y preservación, sin excepciones narrativas. Evaluador actualizado a genesis-checkpoints-5; ZIP sin cambio. Diagnóstico de solo lectura sobre el transcript preservado reconstruyó ambas revisiones y la versión de Roadmap correctamente; no adjudica éxito retroactivo ni acredita el recorrido completo de nested.

Se detuvo la tanda ante el primer fallo, sin reintento ni ejecución de otros escenarios. Consumo reportado del intento: 147.265 entrada, 1.041.024 caché leída, 12.463 salida; categorías del runtime, tarifa no acreditada. Estimación previa de tanda: 1–2 millones entrada, 150–250 mil salida más caché, techo 600 llamadas. Quedan repetir nested con el evaluador corregido y ejecutar los otros seis sobre la huella actual; ninguna aprobación anterior se hereda. Batería completa y conversación humana real no completadas.

### Tanda Autorizada Posterior Con Evaluador Corregido

La solicitud «ok completemos lo faltante» autorizó un intento nuevo, secuencial y supervisado sobre la misma huella f03710bb61b304596d8ae91b19bf1b23c556a94aa10b242776878769b81f2567, runtime aislado 2.0.22, modelo openai/gpt-6.1-sol, evaluador genesis-checkpoints-5, fixtures genesis-fixtures-4 (recovery: genesis-recovery-fixture-5). Antes de ejecutar se comprobaron de nuevo las 24 pruebas de checkpoints/reviews/transcript sin modelos, todas aprobadas, y la huella real del ZIP. No hubo cambios de producción ni herencia de aprobaciones de otro ZIP. Límites 72/120 por caso y techo de tanda 600, parada ante primer fallo o interrupción.

Resultados y rutas relativas al directorio temporal aprobado C:/Users/Michael/AppData/Local/Temp/opencode/:

| Escenario | Resultado | Evidencia (directorio de proyecto) | Entrada | Caché leída | Salida |
| --- | --- | --- | ---: | ---: | ---: |
| nested | passed | csdd-supervised-ZBF7yk/csdd-v2-genesis-Hb5khY/project | 139.060 | 1.041.792 | 11.870 |
| positive | passed | csdd-supervised-THyJdm/csdd-v2-genesis-e3y6nj/project | 126.408 | 932.992 | 11.179 |
| guards | passed | csdd-supervised-xtkAvU/csdd-v2-genesis-4ZWwTY/project | 115.241 | 1.293.952 | 12.945 |
| recovery | passed | csdd-supervised-fcxqbV/csdd-v2-genesis-0j4t8V/project | 178.168 | 1.036.544 | 14.141 |
| compatible | passed | csdd-supervised-kA52P2/csdd-v2-genesis-uV21vP/project | 181.414 | 985.600 | 13.981 |
| fundamental | interrupted / execution_interrupted | csdd-supervised-DJ58R0/csdd-v2-genesis-MvYpFC/project | 153.867 | 973.952 | 13.043 |
| rejection | no ejecutado: parada de tanda | — | — | — | — |

Los cinco recorridos aprobados completaron sus comprobaciones finales, cadena de versiones, adjudicaciones semánticas y preservación. nested incluye crítica draft hija de Canon y revisiones finales independientes; guards bloquea conformidad ambigua, huella incorrecta y aprobación obsoleta y cierra solo tras aprobar cuerpo actualizado; recovery completa desde segunda sesión sin duplicar aprobación ni alterar decisión/cuerpo; compatible evalúa completar como incremento posterior desde fuentes vigentes sin lectura de Genesis por agentes, escrituras ni implementación. compatible señala una tensión temporal de la narrativa de evidencia anterior frente al cierre observado; no la repara ni la utiliza para bloquear la propuesta. Los límites de evaluación y las propuestas no decididas permanecen visibles.

fundamental pasó su cierre inicial y cadena, pero se interrumpió preparando la propuesta para equipos antes del checkpoint fundamental_proposal. La última lectura terminó a 15:15:23.590Z; el fragmento de llamada csdd_write comenzó a 15:15:27.748Z sin argumentos completos y sin ejecución. Windows System registra Kernel-Power 42, razón Button or Lid; Power-Troubleshooter 1 confirma suspensión de 2026-10-08T15:15:55.2418555Z a 16:04:12.6373191Z y reactivación por botón de inicio/apagado. Kernel-General 1 registra sincronización de reloj desde 15:15:59.4089229Z a 16:04:07.5Z. Al reanudar, Canon terminó con provider.transport: Timed out waiting for WebSocket data, y Orchestrator fue interrumpido por el timeout configurado de 600000 ms. No se añadió bloque fundamental ni se llegó a ejecutar esa escritura. La espera del puente de checkpoints también alcanzó su límite de 900000 ms; no significa que ambos límites hayan transcurrido como tiempo activo del modelo.

Diagnóstico preservado en interruption-diagnosis.json dentro del proyecto interrumpido, junto con smoke-result.json, transcript.json, solicitudes, decisiones y fuentes. La suspensión explica el intervalo observado y es compatible con interrupción del transporte y agotamiento del timeout al reanudar; no hay evidencia de 49 minutos de bloqueo activo del modelo ni fallo administrativo demostrado del producto. El resultado original permanece interrupted: no se convierte su cierre inicial en recorrido fundamental aprobado. No se alteraron timeouts, energía del equipo, runtime global o producción, ni hubo reintento automático. rejection no se ejecutó por parada de tanda.

Consumo reportado agregado de esta tanda: 894.158 entrada, 6.264.832 caché leída y 77.159 salida. Es consumo reportado, no certifica generación parcial ausente ni coste monetario; cost cero del runtime no acredita gratuidad. Los límites por escenario siguieron activos; se observaron 311 mensajes assistant en transcripts, lo que no se presenta como medición exacta de hooks de presupuesto o de transporte. Se conserva también el intento fallido previo csdd-supervised-pPhxgN sin reclasificación.

Pendientes: nuevo intento autorizado de fundamental con equipo despierto, después rejection si pasa; conversación humana real solo después de los siete recorridos aprobados sobre esta misma huella. La máquina limpia con red físicamente bloqueada y la alerta del árbol de desarrollo http-cache-semantics permanecen pendientes. Batería completa y cierre global no acreditados todavía.

### Repetición Autorizada De Fundamental Y Ejecución De Rejection

Tras el diagnóstico de suspensión, el usuario autorizó un intento nuevo de fundamental y rejection solo si el primero pasaba, con los mismos límites de 120 llamadas por caso, runtime aislado 2.0.22, modelo openai/gpt-6.1-sol y sin cambiar energía del equipo o timeouts. Se verificó nuevamente la huella f03710bb61b304596d8ae91b19bf1b23c556a94aa10b242776878769b81f2567 y las 24 pruebas locales de checkpoints/reviews/transcript sin modelos, todas aprobadas. Producción y ZIP no cambiaron.

- fundamental: passed, evaluador genesis-checkpoints-5/fixtures genesis-fixtures-4, proyecto temporal csdd-supervised-PHCjHX/csdd-v2-genesis-tx70k9/project. Completó ocho checkpoints, nueva aprobación propia, cambio a equipos con dispositivo compartido, reglas y diferidos preservados, historial y evidencia ajena conservados, lifecycle pre_fr y cadena independiente semantic/administrative. Reviewer emitió un minor por mezcla de evidencia inicial y activa de Roadmap; se registró la separación y se comprobó administrativamente, sin ocultar ese reporte. La revisión final declaró limitaciones por truncamiento de salida de begin y acceso externo denegado, y contrastó documentos locales completos y referencias con el mecanismo de invariancia de complete; no fingió lectura íntegra de una salida inaccesible. Consumo reportado: 291.950 entrada, 2.563.200 caché leída, 26.116 salida.
- rejection: interrupted / execution_interrupted, proyecto temporal csdd-supervised-rGWTKu/csdd-v2-genesis-bKpzpJ/project. Pasó los ocho checkpoints previos al cierre final: cierre inicial y cadena, propuesta fundamental, rechazo explícito y abandono sin proyecciones, preservación del canon individual, nuevo bloque con ID distinto y presentación de nueva referencia. Tras aprobación de esa nueva propuesta, se detuvo al alcanzar 120 llamadas antes de iniciar el modelo de la revisión administrative final. La sesión de Reviewer final ses_ee37c729cffeR6AtvC4Dx6NkJX falló con "Límite del smoke: 120 llamadas al modelo" y la sesión raíz terminó failed; el resultado del runner permanece interrupted, no recorrido aprobado. Materialización activa sigue pending. Consumo reportado: 311.162 entrada, 3.447.168 caché leída, 34.154 salida.

El transcript de rejection muestra dos factores de trabajo adicional: un semantic insufficient_evidence por salida de csdd_review begin redirigida a tool-output externo e inaccesible con permisos de Reviewer, y un minor de preservación porque una proyección actualizó la narrativa administrativa de Now pese a que el cuerpo aprobado exigía mantenerla. Now se restauró dentro del alcance autorizado, el reporte insuficiente quedó conservado y una revisión semantic posterior registró conformidad, con lectura de archivos locales completos e invariancia de complete y limitaciones explícitas. No se cuantifica cuánto consumo corresponde exclusivamente a cada factor. La revisión administrativa posterior no pudo ejecutarse por presupuesto, por lo que no se llegó al checkpoint de cierre y cadena final. El acceso externo no se habilitó y no se eludió el límite iniciando otra sesión o runtime.

Diagnóstico preservado en interruption-diagnosis.json junto al resultado, transcript, snapshots y decisiones originales del proyecto rejection. La parada se respetó sin reintento automático, ampliación de presupuesto, producción nueva ni reclasificación de resultados. La suite previa no cubría suficientemente la entrega de begin con volumen histórico que el runtime redirige fuera del workspace: generar snapshots correctos no garantiza que el agente pueda leerlos. El caso fundamental pasó pese a esa limitación declarada, no prueba que su entrega sea siempre accesible.

Consumo agregado de estos dos intentos: 603.112 entrada, 6.010.368 caché leída y 60.270 salida. Acumulado de la tanda anterior y estos dos intentos: 1.497.270 entrada, 12.275.200 caché leída y 137.429 salida, excluyendo el intento anterior csdd-supervised-pPhxgN. Tarifa monetaria no acreditada. Se conservan los intentos anteriores fallidos/interrumpidos sin modificación.

Estado vigente sobre f03710bb: seis recorridos aprobados (nested, positive, guards, recovery, compatible y fundamental); rejection pendiente de recorrido completo. No se declara batería completa ni se inicia conversación humana real todavía. Sigue pendiente máquina limpia con red físicamente bloqueada y alerta http-cache-semantics del árbol de desarrollo. No se implementó una corrección de entrega de snapshots ni se autorizó otro intento posterior al agotamiento.

Fuentes: [migración](https://opencode.ai/v2/docs/migrate-v1), [plugins](https://opencode.ai/v2/docs/build/plugins), [permisos](https://opencode.ai/v2/docs/permissions) y [agentes](https://opencode.ai/v2/docs/agents).
