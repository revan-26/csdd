---
name: csdd-aprobar
description: Registra la decisión humana sobre el candidato de Genesis (aprobar o rechazar).
disable-model-invocation: true
argument-hint: "[rechazar <motivo>]"
---

La persona invocó este comando: es la intervención humana que exige `.csdd/protocols/genesis.md`. Argumentos: `$ARGUMENTS`.

1. Comprueba que existen `docs/base/GENESIS.md` y `docs/glossary.md` y que la Decisión Humana está en `pending`. Para aprobar, `python3 .claude/scripts/csdd_review.py status` debe mostrar `verdict: conforming` con ambos contenidos `igual`. Si algo falta, detente y explica qué.
2. Si no conoces el nombre de la persona, pregúntalo.
3. Calcula las huellas con `python3 .claude/scripts/csdd_hash.py` y la fecha con `date -u +%Y-%m-%dT%H:%M:%SZ`.
4. Si los argumentos empiezan por `rechazar`: completa `status: rejected`, `rejected_by`, `rejected_at` y `rejection_reference` (`csdd-aprobar <fecha>`), escribe el motivo en Notas De La Decisión y pon `disposition: abandoned` en Materialización. No toques el glosario más allá de lo que indica el protocolo para el rechazo. Termina.
5. Si no: completa `status: approved`, `approved_by`, `approved_at`, `approved_content_reference` (huella del cuerpo de Genesis) y `approval_reference` (`csdd-aprobar <fecha>`). En `docs/glossary.md` cambia la fuerza de los términos `propuesto` a `acordado`; los `supuesto` y `diferido` no cambian.
6. Recalcula las huellas y completa Materialización: `stage: closed`, `genesis_reference`, `glossary_reference`, `review_reference` (`reviewer <reviewed_at>` de la constancia), `review_verdict: conforming`, Verificación (qué se comprobó) y Limitaciones (incluye que esta etapa no tiene guarda y que la constancia de revisión no resiste edición manual). Que la constancia muestre el glosario como cambiado tras el paso 5 es esperado y no se anota.
7. Muestra a la persona exactamente qué líneas escribiste.

Solo editas líneas administrativas y la fuerza de los términos; no cambias ningún contenido.
