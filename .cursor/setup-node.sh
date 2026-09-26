#!/usr/bin/env bash
# Ensure `node`/`pnpm` resolve to Node >= 22.18 in every shell on this VM.
#
# Why: the build tool (tsdown) requires Node ^22.18.0 || >=24.11.0 and otherwise
# fails to load its TypeScript config with `Failed to import module "unrun"`.
# The Cloud Agent image ships Node 22.14 as `/exec-daemon/node`, which wins on
# PATH in non-login shells. The image's nvm already provides a Node 22.x that
# satisfies the requirement; we point the default at it and expose the toolchain
# through /usr/local/cargo/bin, the first directory on PATH in every shell type
# here. This is idempotent and safe to run on every boot (it lives in `start`),
# because environment builds do not persist install-phase changes to these
# directories into the booted pod.
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

# Prefer an already-installed Node 22.x (no network); install only if absent.
if ! { nvm use default >/dev/null 2>&1 && [ "$(node -v 2>/dev/null | cut -d. -f1)" = "v22" ]; }; then
  nvm install 22 >/dev/null
fi
nvm alias default 22 >/dev/null 2>&1 || true
nvm use default >/dev/null

NODE_BIN="$(dirname "$(nvm which default)")"
corepack enable >/dev/null 2>&1 || true

FRONT_DIR="/usr/local/cargo/bin"
if [ -d "$FRONT_DIR" ] && [ -w "$FRONT_DIR" ]; then
  for bin in node npm npx corepack pnpm pnpx; do
    if [ -x "$NODE_BIN/$bin" ]; then
      ln -sf "$NODE_BIN/$bin" "$FRONT_DIR/$bin"
    fi
  done
fi

echo "setup-node: node $(node -v) / pnpm $(pnpm -v) exposed via $FRONT_DIR"
