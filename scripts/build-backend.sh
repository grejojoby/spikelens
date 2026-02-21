#!/usr/bin/env bash
# Build the Go backend sidecar for Tauri
# Usage: ./scripts/build-backend.sh [target-triple]
#
# The output binary must be named spikelens-server-<target-triple>
# Tauri looks for it in src-tauri/binaries/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
BINARIES_DIR="$ROOT/src-tauri/binaries"

mkdir -p "$BINARIES_DIR"

# Detect target triple (Tauri format)
TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  if command -v rustup &>/dev/null; then
    TARGET=$(rustup show active-toolchain 2>/dev/null | awk '{print $1}' | sed 's/^stable-//' || true)
  fi
  if [ -z "$TARGET" ]; then
    # Fallback: detect from uname
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    case "$OS-$ARCH" in
      darwin-arm64)  TARGET="aarch64-apple-darwin" ;;
      darwin-x86_64) TARGET="x86_64-apple-darwin" ;;
      linux-x86_64)  TARGET="x86_64-unknown-linux-gnu" ;;
      linux-aarch64) TARGET="aarch64-unknown-linux-gnu" ;;
      *)             TARGET="x86_64-unknown-linux-gnu" ;;
    esac
  fi
fi

echo "Building Go backend for target: $TARGET"

OUTPUT="$BINARIES_DIR/spikelens-server-$TARGET"

# Map Rust target to GOOS/GOARCH
case "$TARGET" in
  x86_64-apple-darwin)      GOOS=darwin  GOARCH=amd64 ;;
  aarch64-apple-darwin)     GOOS=darwin  GOARCH=arm64 ;;
  x86_64-unknown-linux-gnu) GOOS=linux   GOARCH=amd64 ;;
  aarch64-unknown-linux-gnu) GOOS=linux  GOARCH=arm64 ;;
  x86_64-pc-windows-msvc)   GOOS=windows GOARCH=amd64 ;;
  *)
    echo "Unknown target triple: $TARGET"
    GOOS=linux GOARCH=amd64
    ;;
esac

cd "$ROOT/backend"
GOOS=$GOOS GOARCH=$GOARCH go build -ldflags="-s -w" -o "$OUTPUT" ./cmd/server/

echo "Built: $OUTPUT"
