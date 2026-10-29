# Instalación De CSDD

## Alcance

Esta guía instala la baseline metodológica. La integración con Claude Code, que aportará la operativa agentic, todavía no está disponible; existe un prototipo de etapa 1 para pruebas (ver «Prototipo De Integración»). La instalación no crea documentos del producto ni carpetas de implementación.

`.csdd/` contiene solo framework. Los resultados pertenecen a docs/. Genesis produce Genesis y Glossary; Specs y Backlog se escriben al cierre posterior a Mapping.

## Requisitos

- Un workspace existente o nuevo.
- Acceso a este proyecto fuente CSDD.
- Permiso para crear `.csdd/` en el workspace adoptante.

## Instalar El Framework

Copiar el contenido de `framework/` directamente a `.csdd/`:

```text
<CSDD>/framework/* -> <workspace>/.csdd/
```

El resultado inicial es:

```text
<workspace>/
└── .csdd/
    ├── CSDD.md
    ├── core/
    │   ├── components.md
    │   ├── pillars.md
    │   └── foundations.md
    ├── heuristics/
    │   └── domain-modeling.md
    ├── protocols/
    │   ├── genesis.md
    │   ├── ontology.md
    │   ├── topology.md
    │   ├── mapping.md
    │   ├── consolidation.md
    │   ├── entry.md
    │   └── implementation.md
    └── templates/
        ├── README.md
        ├── genesis.template.md
        ├── genesis-revision.template.md
        ├── specs.template.md
        ├── backlog.template.md
        ├── glossary.template.md
        ├── ontology.template.md
        ├── domain.template.md
        ├── contract.template.md
        ├── adr.template.md
        ├── topology.template.md
        ├── architecture.template.md
        └── mapping.template.md
```

No copiar el `README.md` ni el `INSTALL.md` de la raíz del proyecto fuente dentro de `.csdd/`.

## Reglas De Instalación

- Confirmar que `<workspace>` es la raíz del proyecto que adoptará CSDD.
- Si `.csdd/` o alguno de sus archivos ya existe, detenerse y revisar la situación manualmente.
- No sobrescribir documentos existentes.
- No crear documentos del producto ni `docs/` vacía durante la instalación.
- No crear domains/, contracts/, adrs/, support/, repos.md, mappings ni coordinación vacía.
- No modificar el README existente del workspace.

La instalación del framework y la adopción del proyecto son operaciones distintas. La primera solo copia el payload; la segunda comienza cuando se inicia Génesis.

## Iniciar Génesis

Una vez instalado el framework, iniciar la conversación de Génesis con la persona responsable del producto. La IA debe construir `GENESIS.md` usando [`protocols/genesis.md`](framework/protocols/genesis.md) como guía.

Durante la discusión puede aparecer:

```text
<workspace>/docs/base/GENESIS.md
```

Ese archivo permanece como propuesta hasta que el humano lo lee y lo aprueba formalmente. La decisión identifica tanto el contenido exacto presentado como la intervención humana de aprobación; la ruta del archivo o un `status` aislado no bastan.

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

Antes de iniciar Ontology se comprueba el cierre de Genesis. Si la ejecución se interrumpió, se inspeccionan la aprobación y los archivos existentes para recuperar la proyección según el protocolo. No se regeneran fuentes que ya evolucionaron ni se reinicia un Genesis cerrado. La instalación no realiza esa recuperación ni sobrescribe documentos.

`core/foundations.md` es consultivo y está destinado principalmente a la comprensión humana de la metodología. Los agentes no deben cargarlo durante la operación ordinaria.

## Prototipo De Integración

`integration/claude-code/` contiene un prototipo de etapa 1 para probar Genesis con Claude Code. Para usarlo, copiar su contenido a `<workspace>/.claude/` junto con `.csdd/`. No tiene guarda de escritura ni crea esqueletos por código, y su constancia de revisión no resiste edición manual: no usarlo en proyectos reales.

## Actualización Manual

Para actualizar el framework:

1. Comparar la nueva carpeta `framework/` con `<workspace>/.csdd/`.
2. Revisar los cambios metodológicos antes de aplicarlos.
3. Reemplazar únicamente archivos propiedad del framework: `CSDD.md`, `core/`, `heuristics/`, `protocols/` y `templates/`.
4. No aplicar plantillas sobre documentos existentes del producto.
5. Verificar que los documentos del producto en `docs/` y la documentación local no hayan cambiado.

Si la actualización modifica el significado o las reglas del producto, tratarlo como una evolución separada y no como parte de la instalación.

## Transición Desde El Scaffold Anterior

No es parte de una instalación nueva ni se ejecuta automáticamente. Requiere autorización sobre el workspace adoptante y revisión de conflictos. No iniciar un Genesis paralelo si hay artefactos anteriores dentro de `.csdd/`.

1. Inventariar archivos, aprobaciones, huellas, referencias y evolución existente; conservar una copia recuperable o versión en Git antes del traslado.
2. Verificar que los destinos no colisionen con documentos existentes. Mantener intacto el cuerpo aprobado; actualizar solo referencias administrativas/editoriales sin cambiar decisiones.
3. Trasladar `.csdd/GENESIS.md`, `ONTOLOGY.md` y `TOPOLOGY.md` a `docs/base/`; Specs y Glossary a `docs/specs.md` y `docs/glossary.md`; un Roadmap anterior se convierte en `docs/backlog.md` conservando secuencia y diferidos; dominios, contratos y ADR a sus carpetas bajo `docs/`.
4. Extraer la arquitectura vigente de Topology a `docs/architecture.md` conservando estado, decisiones y pendientes. Transferir cualquier significado operativo exclusivo de un registro base a su fuente vigente; no copiar propuestas como decisiones.
5. Actualizar enlaces, consumidores y configuración del adapter. Un traslado sin cambio de cuerpo no requiere nueva aprobación semántica, pero si cambian las proyecciones se recalculan sus huellas y se verifica nuevamente el cierre afectado.
6. Registrar evidencia de cierre en el registro base del componente afectado y verificar integridad y autoridad. No retirar los originales antes de comprobar la transición; conservar historia recuperable sin mantener dos fuentes vigentes paralelas.

Esta entrega documenta el procedimiento; no migra proyectos existentes ni modifica Lunes o CSDD Legacy.
