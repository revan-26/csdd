# Evidencia de pruebas

## Estado vigente

71e2040e desplegado en Figuvault. Conservación aprobada en
`evidence/model-assignment-conservation-prepared-ten-calls/`: ocho llamadas,
44,294 segundos, máximo autorizado de diez llamadas/tres minutos. Suite del ZIP:
92 aprobadas, cero fallos, cuatro omitidas; control de presupuesto: siete pruebas
aprobadas. `evidence/figuvault-fixed-models/` contiene respaldo, verificación de
34 archivos, preservación del informe y perfiles efectivos. Resumen vigente:
`evidence/fixed-models-status.md`.

## Antecedentes (estado al registrarse; resultados no reclasificados)

Último candidato pendiente: 71e2040e. `evidence/conservation-return-suite.txt`:
92 aprobadas, cero fallos, cuatro omitidas de 96. En
`evidence/model-assignment-conservation-prepared-verified-return/`, Canon guardó
el informe sin errores y devolvió status/path/reference correctos; la familia
agotó ocho llamadas antes de respuesta final del padre. Stopped, sin despliegue.

Diagnóstico/corrección más reciente: `evidence/conservation-controls-diagnosis.md`
y `evidence/conservation-controls-suite.txt` (92 aprobadas, cero fallos, cuatro
omitidas de 96). Candidato actual a76ad14b, no desplegado. En
`evidence/model-assignment-conservation-prepared-controls-fixed/` la escritura
se completó sin errores, pero faltó respuesta final de Orchestrator al agotarse
ocho llamadas; resultado stopped. Antecedentes siguientes conservados.

Ajuste pendiente de modelos fijos: `evidence/fixed-models-status.md`.
Última repetición: `evidence/model-assignment-conservation-prepared/`, stopped.
Orchestrator delegó y Canon guardó informe, pero hubo inspect no admitido sobre
Genesis y el control no paró antes de continuar. Ocho llamadas, 51,375 segundos;
resultado parcial no reclasificado. Sin despliegue ni repeticiones adicionales.
Continuación autorizada: `evidence/model-assignment-luna-isolated/` pasó, tres
llamadas y 25,122 segundos. `evidence/model-assignment-conservation/` se detuvo
al leer docs inexistente en la fixture, antes de delegar/escribir; una llamada y
4,931 segundos. Sin reintentos ni despliegue. Los registros siguientes describen
el intento integrado anterior, que conserva su clasificación.
Informe real de Figuvault conservado por Canon en `evidence/figuvault-report-preservation/`.
Suite sin modelos aprobada en `evidence/fixed-models-suite.txt`; el ensayo
`evidence/model-assignment-luna/` quedó stopped por presupuesto de coordinación,
con adjudicación explícita de los hallazgos de Luna. No se ejecutó el caso de
conservación ni se desplegó el candidato c2f9cae8. El ZIP actual de dist/ es ese
candidato pendiente; e1454a17 sigue siendo la instalación de Figuvault.

Revisión integral de prompts: `evidence/prompt-review-suite.txt` (90 aprobadas,
cero fallos, cuatro omitidas de 94), `evidence/prompt-review-external/` (reintento
natural, Explorer y lectura externa con permiso real) y `evidence/prompt-review-report/`
(Reviewer evalúa informe sin Genesis ni csdd_review). Ambos casos passed según
adjudicación, ocho llamadas y 43,148 segundos en total, sin reintentos. Despliegue,
respaldo y comparación de perfiles efectivos en `evidence/figuvault-prompt-review/`.
SHA-256 vigente: `e1454a17e635d2a6f9464cf862ce0b456c8583142430111109d6f357b7006bb8`.
Ensayos en 2.0.22; perfiles efectivos de Figuvault observados en 2.0.26. No se
reanudó automáticamente la conversación humana ni se exploró el legado real.

Corrección de exploración externa: `evidence/external-fix-suite.txt` (90 aprobadas,
cero fallos, cuatro omitidas), `evidence/external-exploration-fix-validated/`
(Orchestrator→Explorer→permiso externo once→lectura original: passed, seis llamadas,
29 segundos) y `evidence/figuvault-external-fix/` (respaldo, despliegue y permisos
efectivos). Preflight anterior sin modelos preservado en
`evidence/external-exploration-fix/`. SHA-256 del ZIP de aquel ajuste:
`5c55c7e331a16075051f02bd8f6723e42467d3018787cf97519d25f0e091cc65`.

Último ajuste: [consolidation-adjustments.md](evidence/consolidation-adjustments.md),
con ZIP final, suite, tres casos semánticos aprobados y un caso web detenido,
límites pendientes y limpieza de sesiones/temporales.

Nombre de entrega actualizado a `CSDD-opencode2-v0.1.0.zip`: instalación BAT,
integridad del manifiesto, VERSION y carga real en 2.0.22 aprobadas en
`evidence/package-name-0.1.0.txt`, sin modelos. SHA-256 del ZIP:
`fa14113e3e0cbc1c8bf0ee0d136bfb7efe88d1bbbd7f8737ef8ccc70740f574a`.
Las rutas y huellas de resultados anteriores conservan su significado histórico.

`evidence/` reúne la información original relevante de los ensayos de CSDD.
No es una nueva ejecución ni cambia los resultados históricos.

- `evidence/opencode/csdd-focused-review-ZIIBlO/`: repetición puntual aprobada,
  cuatro llamadas, 21,781 segundos; resultado técnico y adjudicación separados.
- `evidence/opencode/csdd-focused-review-FL4rXJ/`: intento previo detenido;
  conserva fallo del evaluador y reparación no autorizada dentro de la sesión.
- `evidence/opencode/csdd-supervised-*/`: recorridos históricos, con fixtures,
  decisiones de supervisión, resultados, transcripts y documentos/snapshots.
- `evidence/legacy-temp/`: evidencia disponible de ensayos anteriores.
- `evidence/candidates/`: ZIP históricos y huellas disponibles para identificar
  lo que se probó; el entregable vigente sigue en `dist/`.
- `evidence/opencode/csdd-simplified-validation-7a2549bb.txt`: salida original
  de la suite anterior. No se inventó una salida completa para la suite posterior,
  cuyo resumen quedó registrado en la conversación y el README del adaptador.
- `evidence/cleanup-manifest.json`: procedencia, destinos, tamaños y SHA-256
  de cada archivo trasladado, más las raíces temporales retiradas.
- `evidence/opencode-session-cleanup.json`: registro de eliminación por API de
  206 sesiones de pruebas Genesis/Glossary (60 raíces y sus hijas). Verificación
  posterior: ninguna sesión seleccionada restante y ninguna sesión ajena perdida;
  esta conversación y las sesiones reales de Figuvault quedaron preservadas.

Los archivos de evidencia se copiaron byte a byte y se verificaron antes de
eliminar los temporales. Sus rutas internas son históricas: no se reescribieron
transcripts, solicitudes, decisiones ni reportes para cambiar ubicaciones.
Para resolverlas, consultar `source` y `destination` en el manifiesto.

Se retiraron instalaciones de prueba, runtime aislado, dependencias, cachés,
distribuciones extraídas, binarios y scripts auxiliares descartables. Los scripts
reutilizables de pruebas permanecen en `assistant-adapters/opencode/*/tests/`.
Para otra prueba de runtime habrá que seleccionar o preparar de nuevo un
ejecutable aislado 2.0.22; no se tocó ninguna instalación global.

No se ejecutaron modelos ni nuevas simulaciones durante esta limpieza. No se
eliminaron temporales de Lunes u otros proyectos. La evidencia histórica no
certifica el ZIP vigente ni sustituye la conversación humana pendiente.
