#!/bin/bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(git -C "$here" rev-parse --show-toplevel)"
cd "$ROOT/apps/web"
npx rollup -c ./src/polyfills/rollup.config.mjs src/polyfills/index.js
