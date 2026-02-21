#!/usr/bin/env bash
# Wrapper that ensures cargo is in PATH before invoking the Tauri CLI.
# Needed when Rust is installed via Homebrew rustup without ~/.cargo/bin set up.

set -euo pipefail

# Resolve cargo directory dynamically through rustup
if ! command -v cargo &>/dev/null; then
  if command -v rustup &>/dev/null; then
    CARGO_BIN_DIR="$(dirname "$(rustup which cargo)")"
    export PATH="$CARGO_BIN_DIR:$PATH"
  else
    echo "ERROR: cargo not found and rustup not available." >&2
    echo "Install Rust from https://rustup.rs" >&2
    exit 1
  fi
fi

exec npx tauri "$@"
