#!/bin/bash
# Hook PreToolUse: intercepta git push y corre npm run check + npm run build
# Si alguno falla, bloquea el push y muestra el error.

INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

# Solo actuar en comandos que contengan "git push"
if ! echo "$CMD" | grep -q "git push"; then
  exit 0
fi

PROJ="/mnt/c/Users/age_a/Documentos/Proyectos/PRODProyectovivo/pvai-next"
cd "$PROJ"

echo "--- Pre-push: ejecutando npm run check ---" >&2
if ! npm run check 2>&1; then
  printf '{"continue": false, "stopReason": "Pre-push bloqueado: npm run check falló. Corrige los errores de TypeScript/ESLint antes de pushear."}\n'
  exit 0
fi

echo "--- Pre-push: ejecutando npm run build ---" >&2
if ! npm run build 2>&1; then
  printf '{"continue": false, "stopReason": "Pre-push bloqueado: npm run build falló. Corrige los errores de compilación antes de pushear."}\n'
  exit 0
fi

echo "--- Pre-push checks OK. Procediendo con git push. ---" >&2
exit 0
