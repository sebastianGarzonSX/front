#!/bin/bash
# Arranque de producción — Next.js frontend
cd "$(dirname "$0")"

# Liberar el puerto si hay proceso previo
PORT=${PORT:-3000}
PID=$(lsof -ti:$PORT 2>/dev/null)
if [ -n "$PID" ]; then
  echo "[FRONT] Matando proceso previo en puerto $PORT (PID: $PID)"
  kill -9 $PID 2>/dev/null
  sleep 1
fi

# Build de producción
echo "[FRONT] Compilando Next.js..."
npm run build
if [ $? -ne 0 ]; then
  echo "[FRONT] ERROR: build fallido. Abortando."
  exit 1
fi

echo "[FRONT] Iniciando servidor Next.js en puerto $PORT..."
exec npm start
