#!/usr/bin/env bash
# Cloud Agent install script for dsh-hwasin-ceiling.
#
# Why this is not just "pnpm install": the build tool (tsdown) requires Node
# >= 22.18 (^22.18.0 || >=24.11.0) and otherwise fails to load its TypeScript
# config with `Failed to import module "unrun"`. The default Cloud Agent image
# ships Node 22.14 as `/exec-daemon/node`, which sits on PATH ahead of most
# directories. We install Node 22 via the image's nvm and expose it (plus the
# corepack-managed pnpm) through /usr/local/cargo/bin, which is the first entry
# on PATH in every shell type here (login shells prepend it in ~/.bashrc, and it
# also leads the exec-daemon's base PATH). This guarantees `node`/`pnpm` resolve
# to >= 22.18 for install, typecheck, test, and build. Matches CI (node 22).
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

# Ensure a Node 22 (>= 22.18) toolchain exists and is the default.
if ! nvm use default >/dev/null 2>&1 || [ "$(node -v 2>/dev/null | cut -d. -f1)" != "v22" ]; then
  nvm install 22 >/dev/null
fi
nvm alias default 22 >/dev/null
nvm use default >/dev/null

NODE_BIN="$(dirname "$(nvm which default)")"
corepack enable >/dev/null 2>&1 || true

# Expose the Node 22 toolchain at the front of PATH for all shells (cargo/bin
# leads PATH ahead of /exec-daemon, so this overrides the image's Node 22.14).
FRONT_DIR="/usr/local/cargo/bin"
if [ -d "$FRONT_DIR" ] && [ -w "$FRONT_DIR" ]; then
  for bin in node npm npx corepack pnpm pnpx; do
    if [ -x "$NODE_BIN/$bin" ]; then
      ln -sf "$NODE_BIN/$bin" "$FRONT_DIR/$bin"
    fi
  done
fi

echo "Using node $(node -v) / pnpm $(pnpm -v)"
pnpm install --frozen-lockfile
