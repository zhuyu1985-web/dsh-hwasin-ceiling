#!/usr/bin/env bash
# Cloud Agent install: prepare the Node 22 toolchain, then install deps.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$DIR/setup-node.sh"

# Pick up the freshly linked toolchain in this shell.
export PATH="/usr/local/cargo/bin:$PATH"
hash -r

pnpm install --frozen-lockfile
