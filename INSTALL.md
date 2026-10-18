# Instalación De CSDD

## Distribución ZIP Para Pruebas En Windows

La vía recomendada para una instalación nueva es `dist/CSDD-opencode2-v0.1.0.zip`, generado desde `assistant-adapters/opencode/v2/` con `npm ci --ignore-scripts` y `npm run build:dist`. Node/npm se usan para construir, no para instalar el paquete entregado. `0.1.0` es la versión de la distribución CSDD; `opencode2` identifica la integración OpenCode V2.

Descomprimir completo y ejecutar `CSDD-opencode2-v0.1.0/instalar.bat`. Introducir una carpeta de proyecto existente sin comillas, o ejecutar `instalar.bat "ruta del proyecto"`. Requiere OpenCode instalado; baseline comprobada `2.0.22`. Para conversar hace falta un modelo configurado. El BAT copia framework a `.csdd/` y el adapter V2 preparado a `.opencode/`, sin npm, cambios de imports ni creación de documentos del producto.

La primera entrega rechaza cualquier destino con `.csdd/` o `.opencode/` existente; no fusiona ni actualiza instalaciones. Comprobar también configuración global o heredada de carpetas superiores. Ante error parcial se conservan los archivos para diagnóstico; revisar antes de retirarlos. No se modifica trabajo ajeno ni se realiza una migración.

El ZIP incluye perfiles completos, plugin ESM empaquetado sin imports npm externos, configuración, versión, manifiesto SHA-256 y licencias. Su huella queda en dist/CSDD-opencode2-v0.1.0.zip.sha256. Es candidato: el flujo simplificado se valida por código y conversación humana real, no por una tanda obligatoria de siete simulaciones. La evidencia histórica no certifica una huella nueva. Consultar assistant-adapters/opencode/v2/README.md.

Las secciones siguientes conservan la instalación manual desde fuentes para desarrollo. No son pasos adicionales exigidos al receptor del ZIP.

## Alcance

Esta guía instala la baseline metodológica y, opcionalmente, la operativa inicial de Genesis para OpenCode. La instalación no crea documentos del producto ni carpetas de implementación.

`.csdd/` contiene solo framework. Los resultados pertenecen a docs/. Genesis produce Genesis y Glossary; Specs y Roadmap se escriben al cierre posterior a Mapping. El adapter separa V1 (no certificado por este ajuste) y V2 (baseline 2.0.22); elegir una sola integración. Sigue pendiente conversación humana real del flujo simplificado.

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
         ├── genesis.contract.json
         ├── consolidation.contract.json
        ├── genesis.template.md
        ├── genesis-revision.template.md
        ├── specs.template.md
        ├── roadmap.template.md
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

## Instalar El Adapter OpenCode

Esta sección es opcional y aplica a OpenCode. No reemplazar una configuración `.opencode/` existente.

El código fuente se divide en `common/`, `v1/` y `v2/`. Ambas versiones tienen composición implementada; su evidencia y limitaciones se documentan por separado. El destino combina el núcleo y perfiles compartidos con la integración elegida, sin dependencias del repositorio fuente.

### OpenCode V1

Las siguientes rutas y comandos corresponden exclusivamente a V1.

```text
<CSDD>/assistant-adapters/opencode/v1/agents/*.md
  -> <workspace>/.opencode/agents/*.md

<CSDD>/assistant-adapters/opencode/v1/tools/*.ts
  -> <workspace>/.opencode/tools/*.ts

<CSDD>/assistant-adapters/opencode/common/lib/revision.mjs
<CSDD>/assistant-adapters/opencode/common/lib/write.mjs
<CSDD>/assistant-adapters/opencode/common/lib/artifacts.mjs
<CSDD>/assistant-adapters/opencode/common/lib/recovery.mjs
  -> <workspace>/.opencode/lib/
```

En las dos tools copiadas, ajustar únicamente los imports `../../common/lib/` a `../lib/`: el paquete instalado usa su propia `.opencode/lib/`. No copiar el instalador de fixtures, tests ni scripts del paquete fuente.

Los archivos fuente `v1/agents/*.md` contienen solo frontmatter. Para cada perfil, concatenar ese archivo y `common/prompts/<name>.md`, separados por una línea vacía, en el archivo instalado. Copiar solo el frontmatter produciría un agente sin instrucciones. `common/build/agents.mjs` realiza esa composición determinista para los instaladores de prueba.

Integrar en la configuración OpenCode V1 del proyecto:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "subagent_depth": 2
}
```

Si `.opencode/package.json` ya existe, preservar su contenido y agregar `@opencode-ai/plugin` como dependencia compatible. `assistant-adapters/opencode/v1/package.json` fija la versión baseline. No copiar los tests, scripts o manifiestos completos sobre archivos existentes del proyecto.

Reiniciar OpenCode después de instalar o actualizar agentes, tools o configuración. Verificar la carga con:

```powershell
opencode debug config
opencode debug agent CSDD-Orchestrator
opencode debug agent CSDD-Canon
opencode debug agent CSDD-Explorer
opencode debug agent CSDD-Reviewer
```

No se instala un comando ni una skill de Genesis. Seleccionar `CSDD-Orchestrator` como agente primario para comenzar; no es necesario convertirlo en el agente predeterminado.

### OpenCode V2

1. Componer cada perfil con `v2/agents/<name>.md` y `common/prompts/<name>.md`, separados por una línea vacía, en `.opencode/agents/<name>.md`.
2. Copiar todos los módulos de `common/lib/` a `.opencode/lib/`, incluido `recovery.mjs`.
3. Copiar tools.mjs, documents.mjs, reviews.mjs, administration.mjs, approval-evidence.mjs y glossary-candidate.mjs de v2/lib/ a .opencode/lib/, ajustando imports ../../common/lib/ a ./. En structure.mjs resolver ambos contratos JSON desde .opencode/lib/ y copiar genesis.contract.json y consolidation.contract.json a esa carpeta. Este es procedimiento de desarrollo; para recepción usar el ZIP preparado.
4. Copiar el directorio completo `v2/plugins/csdd/` a `.opencode/plugins/csdd/`.
5. Agregar `@opencode/plugin: 2.0.22` a las dependencias de `.opencode/package.json`, preservando las existentes. Instalar con `npm install --ignore-scripts` desde `.opencode/`; evaluar las alertas transitivas documentadas en el [adapter V2](assistant-adapters/opencode/v2/README.md).
6. Integrar, sin reemplazar ajustes ajenos, esta configuración en `.opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["./plugins/csdd"],
  "experimental": { "subagent_depth": 2 }
}
```

Si se usa el archivo de configuración en la raíz del workspace, la ruta del plugin debe ser `./.opencode/plugins/csdd`. En `2.0.22` usar un directorio de paquete: la ruta explícita al archivo `.mjs` es rechazada por el runtime. No trasladar `subagent_depth` a la raíz de la configuración V2: ese campo se ignora.

7. Verificar perfiles y fuentes de configuración con `opencode debug agents` y `opencode debug config`. Para inspeccionar plugins, `opencode api get /api/plugin`; su activación es asíncrona, no asumir que un listado temprano vacío demuestra fallo. Las pruebas del adapter esperan disponibilidad y comprueban el registro real.

No copiar wrappers V1, builders, tests ni scripts fuente. Si ya existe la integración V1 en el workspace, revisar y autorizar su reemplazo antes de instalar V2; no mantener ambos registros simultáneamente. La instalación no cambia el agente predeterminado ni migra documentos del producto. No requiere reiniciar automáticamente el servicio global desde un script de prueba.

## Reglas De Instalación

- Confirmar que `<workspace>` es la raíz del proyecto que adoptará CSDD.
- Si `.csdd/` o alguno de sus archivos ya existe, detenerse y revisar la situación manualmente.
- No sobrescribir documentos existentes.
- No crear documentos del producto ni `docs/` vacía durante la instalación.
- No crear domains/, contracts/, adrs/, support/, repos.md, mappings ni coordinación vacía.
- No modificar el README existente del workspace.

La instalación del framework y la adopción del proyecto son operaciones distintas. La primera solo copia el payload; la segunda comienza cuando se inicia Génesis.

## Iniciar Génesis

Una vez instalado el framework, iniciar la conversación de Génesis con la persona responsable del producto. La IA debe construir `GENESIS.md` usando [`protocols/genesis.md`](framework/protocols/genesis.md) como guía. En OpenCode, el [adapter](assistant-adapters/opencode/README.md) inicia esta conversación directamente con `CSDD-Orchestrator`, sin comando ni skill.

Durante la discusión puede aparecer:

```text
<workspace>/docs/base/GENESIS.md
```

Ese archivo permanece como propuesta hasta que el humano lo lee y lo aprueba formalmente. La decisión identifica tanto el contenido exacto presentado como la intervención humana de aprobación; la ruta del archivo o un `status` aislado no bastan.

## Cierre De Génesis

Genesis cierra con Genesis y Glossary revisados y aprobación comprobable. Sus resultados informan a cualquier componente pertinente. Specs y Roadmap no son proyecciones exigidas para cerrar Genesis: CONSOLIDATION confirma su contenido después del trabajo de Definición. Pueden recibir aportes pendientes antes, sin aprobación ni cierre implícitos.

Resultados propios de Genesis:

```text
<workspace>/docs/base/GENESIS.md
<workspace>/docs/glossary.md
```

La proyección no puede introducir significado nuevo. Si necesita una decisión adicional, se detiene y se consulta a la persona; el cambio se trata como evolución separada de las fuentes vivas, no como una reescritura de Genesis aprobado.

El cierre de Genesis se comprueba en su registro y evidencia local, sin depender de Roadmap. Ontology mantiene glosario, dominios y contratos aplicables, y registra su trabajo en `docs/base/ONTOLOGY.md`. Topology mantiene arquitectura y `docs/base/TOPOLOGY.md`. Mapping permanece junto a cada repositorio. CONSOLIDATION integra Specs/Roadmap; implementar requiere autorización explícita. Los aportes preservan historia y decisiones anteriores.

Ontology explicita siempre el dominio del problema, pero no exige múltiples divisiones ni documentos separados. `docs/domains/`, `docs/contracts/` y `docs/adr/` aparecen solo con contenido aplicable. Su aprobación no define repositorios ni mappings. La historia no se carga durante trabajo ordinario: Canon la consulta para cambios fundamentales o procedencia necesaria; Reviewer puede consultarla para revisar ese encargo.

Antes de iniciar Ontology se comprueba el cierre de Genesis, no solo `pre_fr`. Si la ejecución se interrumpió, se inspeccionan la aprobación y los archivos existentes para recuperar la proyección según el protocolo. No se regeneran fuentes que ya evolucionaron ni se reinicia un Genesis cerrado. La instalación no realiza esa recuperación ni sobrescribe documentos.

`core/foundations.md` es consultivo y está destinado principalmente a la comprensión humana de la metodología. Los agentes no deben cargarlo durante la operación ordinaria.

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
3. Trasladar `.csdd/GENESIS.md`, `ONTOLOGY.md` y `TOPOLOGY.md` a `docs/base/`; Specs, Roadmap y Glossary a `docs/specs.md`, `docs/roadmap.md` y `docs/glossary.md`; dominios, contratos y ADR a sus carpetas bajo `docs/`.
4. Extraer la arquitectura vigente de Topology a `docs/architecture.md` conservando estado, decisiones y pendientes. Transferir cualquier significado operativo exclusivo de un registro base a su fuente vigente; no copiar propuestas como decisiones.
5. Actualizar enlaces, consumidores y configuración del adapter. Un traslado sin cambio de cuerpo no requiere nueva aprobación semántica, pero si cambian las proyecciones se recalculan sus huellas y se verifica nuevamente el cierre afectado.
6. Registrar evidencia de cierre en Roadmap y verificar integridad y autoridad. No retirar los originales antes de comprobar la transición; conservar historia recuperable sin mantener dos fuentes vigentes paralelas.

Esta entrega documenta el procedimiento; no migra proyectos existentes ni modifica Lunes o CSDD Legacy.
