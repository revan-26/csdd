# Protocolo De IMPLEMENTATION

## Dependencias Normativas

- `../CSDD.md`: principios, autoridad y lifecycle.
- `../core/components.md`: contrato del componente `IMPLEMENTATION`.
- `../core/pillars.md`: responsabilidades transversales aplicables.

## Propósito

Materializar en repositorios reales las responsabilidades asignadas por `MAPPING`, utilizando la topología y los playbooks activados, y producir evidencia suficiente para cerrar el incremento.

## Entradas

- Incremento de valor aprobado.
- Canon y Ontology vigentes.
- `docs/architecture.md` y repositorios disponibles. Los registros base no se cargan por defecto; una insuficiencia de significado se devuelve a Canon para reconciliación.
- Mappings asignados.
- Playbooks aplicables.
- Contratos ejecutables o verificaciones requeridas.

## Procedimiento

1. Seleccionar el siguiente trabajo según las dependencias de Topology y el alcance del incremento.
2. Leer el mapping y el playbook del repositorio antes de modificarlo.
3. Implementar la responsabilidad usando las convenciones locales apropiadas.
4. Crear o actualizar pruebas, schemas, configuración y documentación local necesarios.
5. Actualizar el mapping con destinos concretos y estado de implementación.
6. Ejecutar las verificaciones proporcionales al riesgo.
7. Registrar evidencia, limitaciones y desviaciones.
8. Reconciliar el canon, la ontología, la topología o el mapping cuando el aprendizaje lo requiera.

## Autoridad

Los agentes pueden investigar, diseñar, implementar, probar y documentar dentro de su alcance. La persona conserva autoridad sobre cambios de producto, riesgos relevantes, separaciones costosas, excepciones importantes y aceptación del incremento.

La implementación no puede redefinir silenciosamente el significado canónico. Si la realidad demuestra que una decisión semántica o topológica es incorrecta, debe proponer el cambio a la fuente durable correspondiente.

## Cierre

Un incremento de implementación está cerrado cuando:

- el comportamiento acordado existe en los destinos asignados;
- las pruebas o verificaciones relevantes aportan evidencia;
- el mapping localiza la realidad implementada;
- las desviaciones, limitaciones y riesgos están explícitos;
- los contratos afectados son compatibles o fueron reconciliados;
- la persona responsable acepta el resultado cuando la autoridad humana sea necesaria.

La ausencia de un playbook especializado no impide implementar. En ese caso se utiliza el protocolo general y se registra el conocimiento que podría justificar un playbook posterior.
