# Protocolo De MAPPING

## Dependencias Normativas

- `../CSDD.md`: principios, autoridad y lifecycle.
- `../core/components.md`: contrato del componente `MAPPING`.
- `../core/pillars.md`: responsabilidades transversales aplicables.

## Propósito

Conectar obligaciones semánticas con responsabilidades y destinos definidos por `TOPOLOGY`, de forma que la implementación pueda avanzar y la conformidad pueda verificarse sin depender de una narración amplia.

## Entradas

- Canon y dominios aprobados.
- Contratos y decisiones aplicables.
- `docs/architecture.md` vigente; no se consulta el cierre histórico de Topology como entrada ordinaria.
- Repositorios y playbooks activados.
- Destinos topológicos reales para asignación inicial; destinos materiales descubiertos durante implementación, cuando existan.

## Procedimiento

1. Identificar la obligación concreta: concepto, regla, invariante, estado o contrato.
2. Asignar la obligación al repositorio o unidad topológica responsable.
3. Registrar el mapping local en `<repo>/docs/mapping/`.
4. Mantener la asignación como `assigned` mientras el destino exacto aún no exista.
5. Completar archivo, símbolo, tabla, endpoint, recurso o módulo cuando exista.
6. Asociar la verificación esperada y la evidencia disponible.
7. Marcar la relación como `implemented`, `verified`, `deferred` o `deviated` según corresponda.
8. Reabrir `TOPOLOGY` si la asignación revela una responsabilidad o dependencia física ausente.

## Registro Mínimo

Cada relación debería contener:

```yaml
source: <stable semantic id>
repository: <topology repository id>
target: <concrete destination, when available>
status: assigned|implemented|verified|deferred|deviated
verification: <test, check or inspection>
evidence: <path, symbol or reference>
deviation: <optional reason and decision>
```

El campo `target` puede quedar pendiente antes de la implementación, pero no debe inventarse. Un mapping asignado no demuestra implementación.

## Alcance

`MAPPING` puede enlazar una misma obligación con varios repositorios cuando su realización esté distribuida. Un repositorio puede recibir obligaciones de varios dominios. Ninguna de estas relaciones implica que los dominios o repositorios deban dividirse.

Los documentos locales pueden agrupar mappings por superficie o tipo cuando el tamaño lo justifique, pero no deben duplicar la definición canónica de la obligación.

## Cierre

El cierre de asignación permite consolidar Specs y Roadmap mediante consolidation.md. Exige obligaciones asignadas a repositorios reales o diferidas explícitamente, y verificación prevista; no exige símbolos ni pruebas de una implementación futura.

El cierre posterior de realización de un incremento está completo cuando:

- cada obligación aplicable tiene una asignación o una razón explícita para estar diferida;
- los destinos implementados son localizables;
- las verificaciones relevantes están asociadas;
- las desviaciones tienen decisión o deuda registrada;
- no quedan referencias a destinos inexistentes descritos como realizados.

La implementación actualiza el mapping como parte del mismo cambio lógico que crea o modifica el destino.
