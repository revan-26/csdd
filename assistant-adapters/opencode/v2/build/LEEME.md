# CSDD 0.1.0 — distribución candidata para OpenCode V2

Requisito: Windows y OpenCode 2.0.22 instalado. Para conversar, configure un modelo y sus credenciales en OpenCode. CSDD no instala OpenCode ni requiere Node/npm externos para copiar sus recursos.

1. Descomprima el ZIP completo.
2. Cree o elija una carpeta de proyecto de prueba sin `.csdd/` ni `.opencode/`.
3. Ejecute `instalar.bat` e introduzca la ruta sin comillas. También admite `instalar.bat "ruta del proyecto"`.
4. Abra OpenCode en esa carpeta y seleccione **CSDD-Orchestrator**.
5. Describa su intención. Lea el informe de Genesis antes de aprobar su referencia exacta.

El BAT únicamente copia archivos preparados. No descarga dependencias, transforma imports, crea documentos del producto ni fusiona configuraciones existentes. Una copia parcial se conserva para diagnóstico; revise antes de retirarla o repetir la instalación.

El paquete contiene perfiles completos, un plugin empaquetado y el framework. No incluye tests ni node_modules. `MANIFEST.json` identifica las huellas de los archivos y `VERSION` su baseline. La huella del ZIP se entrega por separado; una huella no autentica al editor.

Esta entrega no certifica todavía Genesis: los recorridos con modelos y la conversación humana real requieren evidencia independiente. No inicia Ontology ni implementación. Configuración heredada de carpetas superiores o global puede afectar OpenCode; comprobar permisos efectivos antes de usarlo en un proyecto sensible.
