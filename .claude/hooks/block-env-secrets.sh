#!/bin/bash
# Hook: block-env-secrets.sh
# Bloquea cualquier tool call que intente leer o exponer archivos .env

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // {}')

# Patrones de archivos sensibles
SENSITIVE_FILES='\.env$|\.env\.local$|\.env\.[^/]*$'

# ── Read / Edit / Write ──────────────────────────────────────────────────────
if [[ "$TOOL_NAME" == "Read" || "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "Write" ]]; then
  FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // ""')
  BASENAME=$(basename "$FILE_PATH")
  if echo "$BASENAME" | grep -qE '^\.env(\..*)?$'; then
    echo "🔒 BLOQUEADO: No se permite leer/editar '$BASENAME' — archivo de secretos." >&2
    exit 2
  fi
fi

# ── Bash ─────────────────────────────────────────────────────────────────────
if [[ "$TOOL_NAME" == "Bash" ]]; then
  COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // ""')
  # Detectar comandos que leen archivos .env directamente
  if echo "$COMMAND" | grep -qE '(cat|head|tail|less|more|bat|print|echo|tee)\s+.*\.env'; then
    echo "🔒 BLOQUEADO: Comando imprime contenido de archivo .env." >&2
    exit 2
  fi
  # Detectar grep sobre .env
  if echo "$COMMAND" | grep -qE 'grep\s+.*\.env(\.local)?'; then
    echo "🔒 BLOQUEADO: Comando hace grep sobre archivo .env." >&2
    exit 2
  fi
  # Detectar expansión de variables de entorno sensibles en terminal
  if echo "$COMMAND" | grep -qE 'echo\s+\$\{?(AUTH_SECRET|AUTH_GOOGLE|DATABASE_URL|DIRECT_URL|RESEND_API_KEY|NEXTAUTH_SECRET)\}?'; then
    echo "🔒 BLOQUEADO: Comando imprime variable de entorno sensible." >&2
    exit 2
  fi
  # Detectar printenv / env con variables sensibles
  if echo "$COMMAND" | grep -qE '(printenv|env)\s+(AUTH_SECRET|AUTH_GOOGLE|DATABASE_URL|DIRECT_URL|RESEND_API_KEY)'; then
    echo "🔒 BLOQUEADO: Comando expone variable de entorno sensible." >&2
    exit 2
  fi
fi

# ── Grep ─────────────────────────────────────────────────────────────────────
if [[ "$TOOL_NAME" == "Grep" ]]; then
  PATH_ARG=$(echo "$TOOL_INPUT" | jq -r '.path // ""')
  BASENAME=$(basename "$PATH_ARG")
  if echo "$BASENAME" | grep -qE '^\.env(\..*)?$'; then
    echo "🔒 BLOQUEADO: No se permite hacer grep en '$BASENAME' — archivo de secretos." >&2
    exit 2
  fi
fi

exit 0
