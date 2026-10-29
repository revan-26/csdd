# Ontología De <project-name>

status: proposed
revision:
based_on_genesis:
based_on_sources:
based_on_glossary:
prepared_by:

## Propósito

<Qué modelo semántico se formaliza y por qué es necesario para el alcance actual.>

## Alcance Ontológico

### Incluye

### Excluye

## Síntesis Conceptual

<Conceptos, relaciones, capacidades y límites que deben conservar un significado coherente.>

## Candidatos Evaluados

| Candidato | Tipo propuesto | Disposición | Evidencia | Limitación o decisión pendiente |
| --- | --- | --- | --- | --- |
| <name> | domain / subdomain / capability / bounded_context / responsibility | active / candidate / merged / deferred / rejected | <reference> | <limitation> |

## Clasificación Estratégica

| Candidato o dominio | Clasificación | Razón | Confianza | Revisión |
| --- | --- | --- | --- | --- |
| <name> | core / supporting / generic / deferred | <reason> | high / medium / low | <trigger> |

La clasificación estratégica no determina por sí sola una frontera de modelo ni un repositorio.

## Dominios Activos

| Dominio | Propósito | Archivo | Evidencia de activación |
| --- | --- | --- | --- |
| <domain> | <purpose> | `domains/<domain>.md` | <reference> |

Si no existen dominios activos, declarar por qué el alcance se explica con el modelo global.

## Relaciones Entre Modelos

| Origen | Destino | Dirección | Significado y traducción | Contrato |
| --- | --- | --- | --- | --- |
| <model> | <model> | upstream / downstream / peer | <description> | <contract path or none> |

## Contratos Semánticos

| Contrato | Partes | Motivo de aplicabilidad | Archivo |
| --- | --- | --- | --- |
| <contract> | <parties> | independencia / significado compartido | `contracts/<contract>/contract.md` |

## Restricciones Transferidas A Topology

| Restricción o pregunta | Consecuencia | Procedencia | Disposición | Fuente |
| --- | --- | --- | --- | --- |
| <restriction> | <consequence> | <source> | pendiente / diferida | <reference> |

## Evaluación Heurística

<Síntesis de las heurísticas que cambiaron una clasificación, frontera o decisión. Los umbrales son señales, no gates.>

## Reconciliación

<Formalización de la intención aprobada y cambios de Glossary, dominios y contratos. Identificar ubicación vigente de reglas y obligaciones; no duplicar catálogos en el registro base ni exigir Specs/Backlog prematuros.>

## Riesgos Y Asuntos Diferidos

### Riesgos

### Diferidos

## Readiness

- [ ] Alcance del incremento o cambio activo cubierto; primer slice en la invocación inicial.
- [ ] Candidatos con disposición explícita.
- [ ] Cada dominio activo con evidencia semántica y fronteras positivas y negativas.
- [ ] Clasificaciones estratégicas justificadas o diferidas.
- [ ] Reglas, invariantes, estados y transiciones relevantes coherentes.
- [ ] Relaciones entre dominios con significado y dirección cuando aplica.
- [ ] Contratos aplicables con partes y obligaciones observables.
- [ ] Restricciones transferidas a Topology explícitas, sin decisiones técnicas prematuras.
- [ ] Glossary y el paquete sin contradicciones ni definiciones normativas duplicadas.
- [ ] Incertidumbres bloqueantes resueltas.
- [ ] Riesgos y asuntos diferidos visibles.
- [ ] Sin repositorios, mappings ni decisiones técnicas prematuras.

## Manifiesto De Revisión

| Artefacto | Revisión o referencia |
| --- | --- |
| `ONTOLOGY.md` | <revision> |
| `docs/glossary.md` | <revisión propuesta, si aplica> |
| `domains/*` | <revisions> |
| `contracts/*` | <revisions or none> |

## Aprobación Humana

status: pending
approved_by:
approved_at:
approval_reference:
decision_notes:

## Frontera Posterior

La siguiente fase deriva responsabilidades de implementación y plantea repositorios. Este paquete no aprueba topología, ownership técnico, módulos, APIs, persistencia ni mappings.
