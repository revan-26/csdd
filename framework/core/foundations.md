# Fundamentos De CSDD

## Propósito Y Estado

Este documento explica influencias históricas y decisiones intelectuales que ayudan a entender CSDD. Es estrictamente informativo y consultivo.

No crea reglas, activa artefactos, estados, gates, controles, protocolos o permisos. Los agentes no deben cargarlo durante la operación ordinaria. Las reglas vigentes están en `../CSDD.md`, `components.md`, `pillars.md` y los protocolos aplicables.

Una semejanza con otra metodología no implica que CSDD la adopte completa ni que la práctica sea obligatoria.

## Tesis De Composición

CSDD es una composición gobernada de técnicas existentes, estructurada alrededor de semántica canónica y operacionalizada progresivamente por agentes. Su aporte no consiste en inventar cada técnica, sino en seleccionar y coordinar prácticas compatibles bajo autoridad humana explícita.

Los seis componentes organizan las transformaciones principales. Los cuatro pilares describen cómo se diseñan, autorizan, coordinan y comprueban. Ninguna raíz metodológica reemplaza esa composición.

## Influencias Principales

### Ingeniería De Requisitos Y Spec-Driven Development

El problema que aborda es la pérdida de intención, supuestos y decisiones cuando el trabajo depende de conversaciones o código disperso. CSDD toma la idea de conservar fuentes durables, revisables y reconciliables entre intención, realización y evidencia.

No adopta una especificación exhaustiva upfront, `spec-as-source`, generación total de código ni una única representación como modelo completo del producto.

### Domain-Driven Design

DDD aporta lenguaje compartido, fronteras semánticas, modelos coherentes e invariantes propias de un contexto. Esto influye en `ONTOLOGY`, dominios, términos y relaciones.

CSDD no equipara automáticamente dominio, bounded context, equipo, servicio, módulo o repositorio. Tampoco exige agregados ni patrones tácticos cuando no aportan valor.

### Model-Driven Engineering

MDE aporta la separación entre modelo de intención y realización tecnológica. Esta influencia ayuda a distinguir Ontology, Topology, Mapping e Implementation.

CSDD no presupone PIM, PSM, MDA completa, generación de código ni transformaciones automáticas obligatorias. Los mappings pueden ser documentales y verificables sin ser compilables.

### Métodos Formales Y Design By Contract

Estas tradiciones aportan precisión mediante invariantes, estados, precondiciones, postcondiciones, obligaciones y condiciones de violación. En CSDD ayudan a expresar qué debe permanecer verdadero y qué evidencia sería pertinente.

El rigor es proporcional. No se exige notación matemática, model checking ni contratos ejecutables para todo el producto.

### Aprendizaje Iterativo

El desarrollo incremental aporta feedback temprano, decisiones diferidas y aprendizaje desde la implementación. CSDD conserva estas ideas mediante incrementos de valor y reconciliación.

Iterar no significa cambiar fuentes de verdad sin trazabilidad ni usar agilidad como justificación para omitir significado, contratos o verificación.

### Architecture Decision Records

Los ADR conservan contexto, alternativas y consecuencias de decisiones significativas. Son útiles cuando una decisión debe sobrevivir al código y explicar por qué se eligió una alternativa.

No toda preferencia o tarea merece un ADR. La estructura concreta depende de la plantilla o protocolo aplicable.

## Prácticas Compatibles

### Ejemplos, Pruebas Y Aceptación

TDD, BDD y ATDD ofrecen formas compatibles de obtener feedback ejecutable, ejemplos compartidos y criterios de aceptación. CSDD no prescribe una disciplina test-first ni un formato de escenarios.

Las pruebas son evidencia limitada: una suite verde no demuestra que el criterio o el producto sean correctos.

### Contract-First Y API-First

Son especializaciones útiles cuando existen consumidores y proveedores que evolucionan independientemente. OpenAPI, AsyncAPI, IDL o schemas son representaciones técnicas posibles, no requisitos universales.

Los contratos semánticos deben preceder conceptualmente a su representación técnica, pero no toda interfaz local necesita un contrato canónico.

### Ingeniería De Contexto Y Guardarraíles Para Agentes

Estas prácticas ayudan a proporcionar contexto suficiente, separar conocimiento durable de coordinación temporal y limitar acciones según autoridad y riesgo.

La capacidad técnica de un agente no equivale a autorización, evidencia ni enforcement. Los nombres de agentes, runtime, permisos y herramientas pertenecen a una implementación o adapter, no a los fundamentos generales de CSDD.

## Límites De La Composición

CSDD no adopta automáticamente:

- una arquitectura física universal;
- formalismo o testing universal;
- documentación exhaustiva antes de construir;
- equivalencia entre documento y enforcement;
- equivalencia entre suite verde y producto correcto;
- una taxonomía obligatoria de agentes;
- una práctica solo porque aparezca en esta genealogía.

El criterio para incorporar una práctica es que resuelva un problema concreto, tenga consumidor y responsable, sea proporcional y pueda retirarse o simplificarse cuando deje de aportar valor.

## Fuentes Curadas

- Hoare, *An Axiomatic Basis for Computer Programming* (1969): invariantes y especificación formal.
- Meyer, *Applying Design by Contract* (1992): obligaciones y condiciones contractuales.
- Evans, recursos de Domain-Driven Design: lenguaje y fronteras semánticas.
- Object Management Group, Model Driven Architecture: separación entre modelos y realización.
- Manifesto for Agile Software Development: feedback y adaptación.
- Beck, *Test-Driven Development: By Example* (2002): feedback ejecutable.
- North, *Introducing BDD*: comportamiento expresado mediante ejemplos.
- Nygard, *Documenting Architecture Decisions* (2011): memoria decisional.
- OpenAPI y AsyncAPI: estándares de representación contractual.

Estas fuentes explican conceptos o antecedentes; no demuestran por sí solas que la composición CSDD produzca mejores resultados. Las afirmaciones de eficacia requieren evidencia empírica con alcance, método y procedencia explícitos.
