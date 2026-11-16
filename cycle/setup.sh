#!/usr/bin/env bash
# Installs Sellbird next to this repo (not inside it: Sellbird is AGPL-3.0, this keeps the code separate).
# Needs Python 3.11+ and the Claude Code CLI signed in (Sellbird thinks through your Claude plan, no API key).
set -euo pipefail
DIR="${SELLBIRD_DIR:-$(cd "$(dirname "$0")/../.." && pwd)/sellbird}"
PIN=25ec839
PY="${PYTHON:-python3.13}"
[ -d "$DIR" ] || git clone https://github.com/ethanplusai/sellbird.git "$DIR"
git -C "$DIR" fetch -q --depth 1 origin "$PIN" 2>/dev/null && git -C "$DIR" checkout -q "$PIN" || true
[ -x "$DIR/.venv/bin/python" ] || "$PY" -m venv "$DIR/.venv"
"$DIR/.venv/bin/pip" install -q -e "$DIR"
echo "Sellbird ready: $DIR/.venv/bin/python"
