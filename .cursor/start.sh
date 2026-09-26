#!/usr/bin/env bash
# Cloud Agent start: re-establish the Node 22 toolchain on every boot.
#
# Environment builds do not rerun `install` and do not persist its changes to
# ~/.nvm or /usr/local/cargo/bin into the booted pod, so the PATH fix must run
# here to guarantee `node`/`pnpm` resolve to Node >= 22.18 for every agent.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$DIR/setup-node.sh"
