---
name: csdd-reject
description: Registra el rechazo humano del candidato de Genesis. Un hook lo ejecuta sin intervención del modelo.
disable-model-invocation: true
argument-hint: "<nombre>: <motivo>"
---

El hook de CSDD ejecuta este comando antes de que llegue al modelo. Si estás leyendo esto, el hook no intervino y **el rechazo no se registró**.

No escribas la Decisión Humana ni afirmes que hubo rechazo. Ejecuta `python3 .claude/csdd/scripts/csdd_doc.py status`, muestra el resultado a la persona e indícale que compruebe que los hooks de `.claude/settings.json` están activos.
