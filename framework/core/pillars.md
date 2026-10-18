# Pilares De CSDD

## Propósito

Los pilares son preocupaciones transversales que hacen confiable el trabajo de los seis componentes del núcleo, incluidos CONSOLIDATION e IMPLEMENTATION. No son fases, entregables ni roles obligatorios.

```text
                 GENESIS ONTOLOGY TOPOLOGY MAPPING CONSOLIDATION IMPLEMENTATION
Metodología          x        x        x       x          x              x
Gobierno             x        x        x       x          x              x
Orquestación         x        x        x       x          x              x
Aseguramiento        x        x        x       x          x              x
```

Los componentes describen transformaciones. Los pilares describen cómo se diseña, autoriza, coordina y comprueba cada transformación.

## Regla De Desarrollo

Todo crecimiento de un pilar debe responder a:

1. Un problema, riesgo o incertidumbre observado.
2. Un componente, decisión o incremento que consumirá la mejora.
3. Un responsable de mantenerla.
4. Evidencia de que aporta valor.
5. Un costo proporcional al impacto protegido.
6. Un criterio de simplificación, revisión o retirada.

No se crean estados, artefactos, gates, agentes ni controles solo para representar que un pilar existe.

## Pilares

### Metodología

Define cómo CSDD transforma una intención en valor, aprendizaje y decisiones revisables.

Debe cuidar:

- resultado observable del trabajo;
- alcance y exclusiones;
- incertidumbre y aprendizaje esperado;
- recorrido mínimo aplicable;
- posibilidad de reabrir decisiones por evidencia nueva.

No posee la autoridad para aprobar significado, riesgos o excepciones. Tampoco convierte cada práctica útil en una obligación universal.

Su rigor aumenta cuando aparecen incertidumbre relevante, retrabajo o fallos repetidos del recorrido:

```text
conversación
  -> recorrido explícito
  -> protocolo reutilizable
  -> playbook validado
```

### Gobierno

Define quién puede decidir, qué alcance está autorizado y qué riesgos requieren intervención humana.

Debe cuidar:

- autoridad de la intención y del significado;
- alcance de cada aprobación;
- decisiones protegidas y sus consecuencias;
- excepciones con responsable y condición de cierre;
- aceptación del riesgo residual cuando corresponda.

Una aprobación humana no es lo mismo que un gate. Un gate es una decisión de gobierno que usa evidencia de aseguramiento para autorizar una transición o mantenerla detenida.

Su rigor aumenta ante decisiones irreversibles, datos persistentes, consumidores independientes, cambios de contrato, impacto transversal o riesgo difícil de revertir:

```text
decisión explícita
  -> aprobación acotada
  -> gate o excepción proporcional
  -> protección reforzada cuando la estabilidad lo justifica
```

Ningún agente debe aprobar su propio trabajo. La IA puede proponer y ejecutar dentro de su autorización, pero la persona conserva autoridad sobre cambios de producto, significado, riesgos relevantes y aceptación.

### Orquestación

Coordina responsabilidades, dependencias, secuencia y estado del trabajo sin apropiarse del significado ni de la autoridad de otros pilares.

Debe cuidar:

- contexto suficiente para la siguiente acción;
- responsables y límites claros;
- dependencias y bloqueos visibles;
- paralelismo solo cuando reduzca costo o riesgo;
- integración y cierre de resultados.

Topology define estructura física durable. Orquestación define la coordinación temporal de un trabajo. Un handoff o plan temporal debe retirarse o convertirse en conocimiento durable cuando deja de ser necesario.

Su rigor aumenta según la coordinación requerida:

```text
trabajo directo
  -> secuencia explícita
  -> coordinación entre responsables
  -> automatización validada
```

Delegar por especialidad, contexto o paralelismo puede ser útil. Delegar únicamente para reflejar una taxonomía de agentes añade ceremonia.

### Aseguramiento

Determina qué afirmación debe comprobarse, qué evidencia existe, qué limitaciones permanecen y cuándo un efecto debe impedirse técnicamente.

Debe distinguir:

| Concepto | Función |
| --- | --- |
| Política | Declara lo permitido, exigido o prohibido. |
| Check | Evalúa una condición. |
| Evidencia | Demuestra o informa un resultado observado. |
| Gate | Usa evidencia y decisiones para gobernar una transición. |
| Enforcement | Impide o limita técnicamente una operación. |

También debe distinguir entre:

- evidencia de procedencia o justificación semántica;
- verificación prevista;
- evidencia material observada;
- limitación o riesgo residual.

Su progresión típica es:

```text
not_checked
  -> revisión reproducible
  -> check automatizado
  -> enforcement cuando el riesgo exige impedir el efecto
```

No toda obligación necesita enforcement. Una suite verde no demuestra que el criterio o el oráculo sean correctos, y una posibilidad de verificación no equivale a evidencia ejecutada.

## Aplicación Por Componente

| Componente | Metodología | Gobierno | Orquestación | Aseguramiento |
| --- | --- | --- | --- | --- |
| `GENESIS` | Define qué debe entenderse y el primer resultado | Protege intención y aprobación | Coordina conversación e investigación | Expone incertidumbre y suficiencia |
| `ONTOLOGY` | Estructura significado | Autoriza fronteras y decisiones semánticas | Coordina candidatos y relaciones | Comprueba coherencia y procedencia |
| `TOPOLOGY` | Deriva la realización mínima | Autoriza separaciones costosas y riesgos | Ordena fundación y dependencias | Comprueba que los destinos sean reales |
| `MAPPING` | Define la trazabilidad necesaria | Asigna responsabilidades y acepta excepciones | Coordina aterrizajes distribuidos | Evalúa evidencia, cobertura y límites |
| `IMPLEMENTATION` | Materializa y aprende | Protege decisiones y acepta el resultado | Secuencia ejecución y reconciliación | Verifica comportamiento y resultado |

## Suficiencia, Cierre Y Gate

Estos conceptos no son equivalentes:

- **Suficiencia:** evaluación de que el resultado contiene lo necesario para su propósito.
- **Cierre:** el trabajo definido para el componente o incremento terminó según su criterio.
- **Aprobación:** una autoridad acepta una decisión o resultado dentro de un alcance.
- **Gate:** una decisión de gobierno autoriza, detiene o condiciona una transición.

Un protocolo puede evaluar suficiencia y cierre sin crear un gate. Un gate solo debe aparecer cuando el riesgo o la transición lo justifiquen.

## Reconciliación

La implementación puede descubrir que una decisión anterior es incorrecta. En ese caso:

1. Se identifica la contradicción y la fuente afectada.
2. Se clasifica como deriva, deuda o cambio intencional.
3. Se propone el cambio a la autoridad correspondiente.
4. Se actualizan los artefactos durables y la evidencia.
5. Se retira la coordinación temporal que ya fue absorbida.

Ningún pilar autoriza a sobrescribir silenciosamente el trabajo de otro.
