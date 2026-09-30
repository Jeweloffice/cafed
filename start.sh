#!/usr/bin/env bash

# ============================================================
# Shahi Biryani Darbar POS & Cost Management System Launcher
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Get Local IP for Mobile Access
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="localhost"
fi

echo "=========================================================="
echo " 🍗 Shahi Biryani Darbar - POS & P&L System Starting... "
echo "=========================================================="

# 1. Start Python FastAPI Backend
echo "--> Starting FastAPI Backend on port 8000..."
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  ./venv/bin/pip install -r requirements.txt
fi
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 2. Start Vite React Frontend
echo "--> Starting React Frontend on port 5173..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "Shutting down servers..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

echo ""
echo "=========================================================="
echo " ✅ Both Servers are RUNNING Successfully!"
echo "=========================================================="
echo " 🖥️ Desktop / Counter PC:  http://localhost:5173"
echo " 📱 Mobile / Tablet (Wi-Fi): http://${LOCAL_IP}:5173"
echo " 📚 Backend API Docs:       http://localhost:8000/docs"
echo "=========================================================="
echo " Press Ctrl+C anytime to stop."
echo ""

wait
