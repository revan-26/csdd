---
name: csdd-approve
description: Registra la aprobación humana del candidato de Genesis. Un hook la ejecuta sin intervención del modelo.
disable-model-invocation: true
argument-hint: "<nombre>"
---

El hook de CSDD ejecuta este comando antes de que llegue al modelo. Si estás leyendo esto, el hook no intervino y **la aprobación no se registró**.

No escribas la Decisión Humana ni afirmes que hubo aprobación. Ejecuta `python3 .claude/csdd/scripts/csdd_doc.py status`, muestra el resultado a la persona e indícale que compruebe que los hooks de `.claude/settings.json` están activos.
