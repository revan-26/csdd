@echo off
setlocal DisableDelayedExpansion
set "SOURCE=%~dp0"
set "TARGET=%~1"
if not defined TARGET set /p "TARGET=Ruta del proyecto existente: "
if not defined TARGET goto invalid
if not exist "%TARGET%\." goto invalid
if not exist "%SOURCE%framework\CSDD.md" goto incomplete
if not exist "%SOURCE%assistant-adapters\opencode-v2\plugins\csdd\index.mjs" goto incomplete
if not exist "%SOURCE%assistant-adapters\opencode-v2\plugins\csdd\package.json" goto incomplete
if not exist "%SOURCE%assistant-adapters\opencode-v2\opencode.json" goto incomplete
for %%A in (Orchestrator Canon Explorer Reviewer) do if not exist "%SOURCE%assistant-adapters\opencode-v2\agents\CSDD-%%A.md" goto incomplete
if exist "%TARGET%\.csdd" goto conflict
if exist "%TARGET%\.opencode" goto conflict
mkdir "%TARGET%\.csdd" || goto failed
xcopy "%SOURCE%framework\*" "%TARGET%\.csdd\" /E /H /I /Y /Q >nul
if errorlevel 1 goto failed
mkdir "%TARGET%\.opencode" || goto failed
xcopy "%SOURCE%assistant-adapters\opencode-v2\*" "%TARGET%\.opencode\" /E /H /I /Y /Q >nul
if errorlevel 1 goto failed
echo Instalacion completada. Abra OpenCode en el proyecto y seleccione CSDD-Orchestrator.
echo Baseline comprobada: OpenCode 2.0.22. Genesis sigue en validacion.
if "%~1"=="" pause
exit /b 0
:invalid
echo ERROR: Indique una carpeta de proyecto existente, sin comillas al escribirla.
goto error
:incomplete
echo ERROR: Paquete incompleto. Descomprima nuevamente el ZIP completo.
goto error
:conflict
echo ERROR: Ya existe .csdd o .opencode. No se sobrescribio ningun archivo.
goto error
:failed
echo ERROR: Copia incompleta. Revise permisos y conserve las carpetas parciales para diagnostico.
echo No reintente sobre ellas sin revisar su contenido. No se eliminaron archivos.
:error
if "%~1"=="" pause
exit /b 1
