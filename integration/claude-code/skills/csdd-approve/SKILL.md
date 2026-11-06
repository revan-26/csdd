---
name: csdd-approve
description: Registra la aprobación humana del candidato de Genesis. Un hook la ejecuta sin intervención del modelo.
disable-model-invocation: true
argument-hint: "<nombre>"
---

El hook de CSDD ejecuta este comando antes de que llegue al modelo y te entrega el resultado en un aviso de contexto que empieza con «CSDD ejecutó por hook el comando /csdd-approve». La persona ya ve ese resultado.

- Si el aviso existe, ese es el único resultado: explícalo a la persona en una o dos frases y, si la decisión no se registró, indica cómo resolver el motivo. No vuelvas a ejecutar la decisión, no edites documentos ni escribas la Decisión Humana.
- Si el aviso no existe, el hook no intervino y **la aprobación no se registró**. No afirmes que hubo aprobación. Ejecuta `python3 .claude/csdd/scripts/csdd_doc.py status`, muestra el resultado a la persona e indícale que compruebe que los hooks de `.claude/settings.json` están activos.
