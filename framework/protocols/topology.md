# Protocolo De TOPOLOGY

## Dependencias Normativas

- `../CSDD.md`: principios, autoridad y lifecycle.
- `../core/components.md`: contrato del componente `TOPOLOGY`.
- `../core/pillars.md`: responsabilidades transversales aplicables.

## Propósito

Transformar el modelo semántico aprobado en la organización física mínima necesaria para implementar el incremento activo. `TOPOLOGY` establece repositorios, responsabilidades, dependencias y playbooks sin convertir una arquitectura frecuente en una obligación universal.

## Entradas

- Dominios, Glossary y contratos semánticos aprobados aplicables; alcance y restricciones acordados en Ontology. No exigir Specs o Roadmap antes del cierre de definición.
- `docs/architecture.md` vigente cuando exista, y ADR aplicables según estado.
- Primer incremento o alcance de trabajo aprobado.
- Repositorios existentes y restricciones del workspace.
- Decisiones técnicas ya vigentes, cuando existan.

No se crean repositorios futuros solo porque aparezcan como posibilidad en una plantilla o en una arquitectura de referencia.

## Procedimiento

1. Identificar las responsabilidades físicas requeridas por el incremento.
2. Revisar repositorios existentes antes de proponer nuevos.
3. Determinar qué responsabilidades pueden convivir y cuáles requieren independencia por riesgo, ownership, despliegue, datos o evolución.
4. Definir dependencias, interfaces de integración y orden de fundación.
5. Seleccionar los playbooks aplicables, por ejemplo `app`, `services`, `db`, `infra` o `worker`.
6. Proponer la organización vigente en `docs/architecture.md`, decisiones relevantes en `docs/adrs/` y contratos técnicos aplicables en `docs/contracts/<nombre>/contract.md`, con archivos asociados opcionales. Refinar un contrato semántico sin duplicarlo ni cambiar significado silenciosamente.
7. Solicitar aprobación humana cuando la decisión implique costo relevante, lock-in, separación irreversible, datos persistentes o riesgo operativo.
8. Vincular o fundar los repositorios aprobados con su estructura mínima.
9. Marcar como disponibles los destinos que `MAPPING` puede asignar.
10. Registrar alcance, fuentes, decisiones, revisiones de resultados, verificación, pendientes y cierre en `docs/base/TOPOLOGY.md`. Aportes pertinentes a Roadmap se registran como pendientes, sin declarar alcance consolidado ni cerrar CONSOLIDATION.

## Salida Mínima

`docs/architecture.md` debe mantener, cuando sean aplicables:

- repositorio o unidad física;
- responsabilidad principal;
- playbooks activados;
- dependencias y dirección;
- interfaces o contratos relacionados;
- estado: `existing`, `founded`, `paused` o `retired`;
- decisiones, restricciones y riesgos relevantes.

La topología no debe registrar cada símbolo, tabla, test o invariante. Ese nivel pertenece a `MAPPING`.

Los registros base no son entradas ordinarias. Una duda de procedencia o un cambio fundamental activa la consulta justificada por Canon y su revisión pertinente, no la lectura automática de Genesis/Ontology/Topology. Una reentrada actualiza la arquitectura y añade un registro identificable, conservando cierres previos.

## Playbooks

Los playbooks son conocimiento operativo reutilizable. Definen cómo fundar, ordenar, verificar y mantener una clase de realización. No definen el significado del producto.

Un repositorio puede activar varios playbooks y un playbook puede aplicarse a varios repositorios. Los nombres `APP`, `SERVICES`, `DB`, `INFRA` y otros son perfiles reconocibles, no una lista cerrada ni una relación obligatoria entre repositorios.

## Cierre

`TOPOLOGY` está cerrada para un incremento cuando:

- los repositorios necesarios están identificados o fundados;
- cada uno tiene responsabilidad y estado explícitos;
- las dependencias relevantes están dirigidas;
- los playbooks aplicables están seleccionados;
- no existen destinos ficticios presentados como activos;
- las decisiones humanas requeridas están aprobadas;
- `MAPPING` puede comenzar con destinos reales.
- la vista vigente es suficiente sin reconstruir registros base y el cierre identifica resultados y revisiones verificadas.

La implementación puede reabrir `TOPOLOGY` si descubre una dependencia, separación o responsabilidad que no estaba representada.
