# Instalación De CSDD

## Alcance

Esta guía instala en un proyecto la baseline metodológica (`.csdd/`) y la integración con Claude Code (`.claude/`). Todo queda dentro del proyecto: no se instala nada en la configuración global del usuario. La instalación no crea documentos del producto ni carpetas de implementación.

`.csdd/` contiene solo framework. Los resultados pertenecen a docs/. Genesis produce Genesis y Glossary; Specs y Backlog se escriben al cierre posterior a Mapping.

La integración cubre Genesis; los componentes posteriores todavía no tienen operativa.

## Requisitos

- Un workspace existente o nuevo.
- Acceso a este proyecto fuente CSDD.
- Python 3.8 o posterior, que también usan los hooks y scripts de la integración. En Windows el lanzador de Python aún no está resuelto.
- Claude Code.

## Instalar

```text
python3 <CSDD>/install.py <workspace>
```

`--dry-run` muestra las acciones sin escribir. El resultado inicial es:

```text
<workspace>/
├── .csdd/                      framework: CSDD.md, core/, heuristics/, protocols/, templates/
└── .claude/
    ├── skills/                 skills csdd-*
    ├── agents/                 subagentes de CSDD
    ├── settings.json           hooks de CSDD, agregados a la configuración existente
    └── csdd/
        ├── install.json        manifiesto de la instalación
        └── scripts/            verificador y scripts de la integración
```

El estado que la integración genera durante el trabajo (constancias y registros) se guarda en `.claude/csdd/state/`. `messages.jsonl` conserva el texto de la conversación: decidir si esa carpeta se versiona según lo que el proyecto pueda publicar.

## Reglas De Instalación

- Confirmar que `<workspace>` es la raíz del proyecto que adoptará CSDD.
- El instalador registra en `.claude/csdd/install.json` la huella de cada archivo instalado. Un archivo existente idéntico al de CSDD se adopta; uno distinto que CSDD no instaló, o uno instalado que se modificó en el proyecto, detiene la instalación sin escribir nada para revisarlo manualmente.
- En `.claude/settings.json` solo agrega o reemplaza los hooks de CSDD y conserva el resto de la configuración; si el archivo no es JSON válido, se detiene.
- No crea documentos del producto ni `docs/` vacía, y nunca toca `docs/` ni `.claude/csdd/state/`.
- No crea domains/, contracts/, adrs/, support/, repos.md, mappings ni coordinación vacía.
- No modifica el README existente del workspace ni copia el `README.md` o el `INSTALL.md` del proyecto fuente.

La instalación y la adopción del proyecto son operaciones distintas. La primera solo copia el payload; la segunda comienza cuando se inicia Génesis.

## Límites De La Guarda

La guarda protege contra errores del agente, no contra manipulación deliberada:

- En Bash busca rutas protegidas en el texto del comando; no detecta una ruta construida de otra forma.
- También protege `.claude/settings.json` y `.claude/settings.local.json`, para que el agente no retire los hooks: esos archivos se editan a mano.
- Si `python3` no está disponible, Claude Code no bloquea la herramienta y la guarda no actúa.
- Las constancias no autentican a la persona ni resisten edición manual.

## Iniciar Génesis

Una vez instalado CSDD, abrir Claude Code en el workspace e iniciar la conversación de Génesis con la persona responsable del producto. La skill `csdd-genesis` la conduce usando [`protocols/genesis.md`](framework/protocols/genesis.md) como guía.

Durante la discusión puede aparecer:

```text
<workspace>/docs/base/GENESIS.md
```

Ese archivo permanece como propuesta hasta que la persona lo aprueba con `/csdd-approve <tu nombre>`, con su propio nombre y no el del proyecto; si no le convence, pide ajustes en la conversación. El Genesis inicial no se rechaza: `/csdd-reject <tu nombre>: <motivo>` aplica a una revisión. Un hook registra la decisión antes de que el mensaje llegue al modelo; identifica tanto el contenido exacto presentado como la intervención humana, y la aprobación además cierra Genesis por código. El resultado, registrado o no con su motivo, se muestra a la persona y llega al modelo en el mismo turno. La aprobación exige una revisión conforme del contenido actual y ninguna sección obligatoria vacía: obligatorias son las que trae el esqueleto; las opcionales, marcadas así en la plantilla, pueden faltar. Para cambiar un Genesis cerrado, la persona lo pide en la conversación y el orquestador abre por código una revisión al final del documento: lo anterior queda congelado, el glosario solo cambia dentro de ella, y la revisión se revisa, se aprueba o se rechaza por sí sola. Rechazarla conserva el bloque y restaura el glosario de su apertura.

## Cierre De Génesis

Genesis cierra con Genesis y Glossary revisados y aprobación comprobable. Sus resultados informan a cualquier componente pertinente. Specs y Backlog no son proyecciones exigidas para cerrar Genesis: CONSOLIDATION confirma su contenido después del trabajo de Definición. Pueden recibir aportes pendientes antes, sin aprobación ni cierre implícitos.

Resultados propios de Genesis:

```text
<workspace>/docs/base/GENESIS.md
<workspace>/docs/glossary.md
```

La proyección no puede introducir significado nuevo. Si necesita una decisión adicional, se detiene y se consulta a la persona; el cambio se trata como evolución separada de las fuentes vivas, no como una reescritura de Genesis aprobado.

El cierre de Genesis se comprueba en su registro y evidencia local, sin depender de Backlog. Ontology mantiene glosario, dominios y contratos aplicables, y registra su trabajo en `docs/base/ONTOLOGY.md`. Topology mantiene arquitectura y `docs/base/TOPOLOGY.md`. Mapping permanece junto a cada repositorio. CONSOLIDATION integra Specs/Backlog; implementar requiere autorización explícita. Los aportes preservan historia y decisiones anteriores.

Ontology explicita siempre el dominio del problema, pero no exige múltiples divisiones ni documentos separados. `docs/domains/` y `docs/contracts/` (Ontology) y `docs/adrs/` (Topology) aparecen solo con contenido aplicable. La aprobación de Ontology no define repositorios ni mappings. La historia no se carga durante trabajo ordinario: Canon la consulta para cambios fundamentales o procedencia necesaria; Reviewer puede consultarla para revisar ese encargo.

Antes de iniciar Ontology se comprueba el cierre de Genesis. Si la ejecución se interrumpió, el siguiente mensaje de la persona completa la decisión desde su constancia, o avisa si los archivos ya no concuerdan. No se regeneran fuentes que ya evolucionaron ni se reinicia un Genesis cerrado. La instalación no realiza esa recuperación ni sobrescribe documentos.

`core/foundations.md` es consultivo y está destinado principalmente a la comprensión humana de la metodología. Los agentes no deben cargarlo durante la operación ordinaria.

## Actualización

Para actualizar, revisar primero los cambios metodológicos y volver a ejecutar `install.py` sobre el mismo workspace. Reemplaza los archivos instalados que no se modificaron en el proyecto, retira los que dejaron de formar parte de CSDD y actualiza los hooks; no aplica plantillas sobre documentos existentes del producto. Si la actualización modifica el significado o las reglas del producto, tratarlo como una evolución separada y no como parte de la instalación.

## Transición Desde El Scaffold Anterior

No es parte de una instalación nueva ni se ejecuta automáticamente. Requiere autorización sobre el workspace adoptante y revisión de conflictos. No iniciar un Genesis paralelo si hay artefactos anteriores dentro de `.csdd/`.

1. Inventariar archivos, aprobaciones, huellas, referencias y evolución existente; conservar una copia recuperable o versión en Git antes del traslado.
2. Verificar que los destinos no colisionen con documentos existentes. Mantener intacto el cuerpo aprobado; actualizar solo referencias administrativas/editoriales sin cambiar decisiones.
3. Trasladar `.csdd/GENESIS.md`, `ONTOLOGY.md` y `TOPOLOGY.md` a `docs/base/`; Specs y Glossary a `docs/specs.md` y `docs/glossary.md`; un Roadmap anterior se convierte en `docs/backlog.md` conservando secuencia y diferidos; dominios, contratos y ADR a sus carpetas bajo `docs/`.
4. Extraer la arquitectura vigente de Topology a `docs/architecture.md` conservando estado, decisiones y pendientes. Transferir cualquier significado operativo exclusivo de un registro base a su fuente vigente; no copiar propuestas como decisiones.
5. Actualizar enlaces, consumidores y configuración del adapter. Un traslado sin cambio de cuerpo no requiere nueva aprobación semántica, pero si cambian las proyecciones se recalculan sus huellas y se verifica nuevamente el cierre afectado.
6. Registrar evidencia de cierre en el registro base del componente afectado y verificar integridad y autoridad. No retirar los originales antes de comprobar la transición; conservar historia recuperable sin mantener dos fuentes vigentes paralelas.

Esta entrega documenta el procedimiento; no migra proyectos existentes ni modifica Lunes o CSDD Legacy.
