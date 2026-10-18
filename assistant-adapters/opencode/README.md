# Adapter De OpenCode

El paquete fuente separa el núcleo determinista de las integraciones por versión. No forma parte del payload metodológico en `.csdd/`.

```text
common/
  lib/       # Destinos, canonicalización, hashes, registros y escritura
  prompts/   # Instrucciones compartidas de los cuatro perfiles
  build/     # Composición determinista de perfiles instalados
  tests/     # Pruebas independientes del runtime OpenCode
v1/
  agents/
  tools/
  lib/       # Composición de fixtures instaladas
  tests/     # Configuración y recorridos V1
  opencode.json
  package.json
  package-lock.json
v2/
  build/     # Preparación del ZIP y BAT de copia
  agents/    # Frontmatter y permisos V2
  plugins/   # Registro de tools por API V2
  lib/       # Integración y composición instalada
  tests/     # Unitarias, carga real sin modelo y smoke separado
  opencode.json
  package.json
  package-lock.json
```

## Estado Y Límites

- [V1](v1/README.md): conserva la integración implementada para OpenCode `1.18.29`. Los recorridos positivos, guards y recuperación aprobados pertenecen al scaffold anterior; las nuevas rutas `docs/` y revisiones fundamentales todavía requieren revalidación agentic.
- [Common](common/README.md): núcleo sin dependencia de las APIs V1/V2; conservarlo compartido no implica que todo comportamiento esté certificado.
- [V2](v2/README.md): baseline 2.0.22; Genesis simplificado produce Genesis/Glossary con revisión semántica del candidato y administración por código. La conversación humana real del nuevo flujo sigue pendiente; ya no exige siete recorridos simulados.

Las instrucciones compartidas residen en `common/prompts/`; cada versión conserva su frontmatter y permisos. La instalación los concatena y entrega perfiles completos, sin referencias al paquete fuente. Los subagentes V2 no usan `hidden: true` porque V2 los excluye del catálogo de delegación; sus permisos siguen restringidos.

## Verificación

Desde este directorio:

```powershell
node --test common/tests/*.test.mjs
node --test common/tests/*.test.mjs v2/tests/*.test.mjs

# Desde v1/ o v2/, para probar esa integración:
npm test
```

El núcleo no necesita dependencias npm ni llamadas a modelos. El segundo comando ejecuta common + V2, la baseline activa. V1 se prueba desde su propio directorio y conserva sus fallos de diagnóstico bajo V2, sin ocultarlos ni convertirlos en aprobaciones. Las pruebas de runtime V2 instalan dependencias en una fixture y arrancan un servidor privado; no usan modelos ni reinician el servicio compartido. Los smokes no forman parte de `npm test`.

Las dependencias y lockfiles residen exclusivamente en cada versión. Ejecutar `npm ci --ignore-scripts` en `v2/` antes de probar V2, o en `v1/` para V1. El directorio raíz del adapter no requiere `package.json`, `package-lock.json`, `opencode.json` ni `node_modules/`. La dependencia oficial V2 tiene alertas transitivas de seguridad pendientes; consultar su README.

## Instalación

Seleccionar una sola integración. El paquete instalado reúne perfiles e integración elegida con `common/lib/`; no carga V1 y V2 simultáneamente ni referencia el repositorio fuente. Consultar [INSTALL.md](../../INSTALL.md).

Los instaladores en `v1/lib/install.mjs` y `v2/lib/install.mjs` componen fixtures aisladas para pruebas, no migran ni actualizan proyectos adoptantes. El código instalado recibe imports locales y únicamente el manifiesto de dependencias, sin tests ni scripts del paquete fuente.

La distribución inicial para usuarios es diferente: `v2/build/distribution.mjs` prepara perfiles y bundle en el entorno de desarrollo y produce `dist/CSDD-opencode2-v0.1.0.zip`. El BAT no transforma ni instala npm. Las pruebas de distribución y los recorridos V2 consumen el ZIP; no lo completan desde fuentes. No se incluye V1 en esa entrega candidata.
