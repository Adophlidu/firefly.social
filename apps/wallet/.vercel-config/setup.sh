#!/bin/bash
set -euo pipefail

# Build packages
pnpm --filter @dimensiondev/enums build
pnpm --filter @dimensiondev/constants build
pnpm --filter @dimensiondev/types build
pnpm --filter @dimensiondev/utils build
pnpm --filter @dimensiondev/envs build
pnpm --filter @dimensiondev/web3 build
pnpm --filter @dimensiondev/iframe-bridge build
pnpm --filter @dimensiondev/native-bridge build
pnpm --filter @dimensiondev/exception-tracker build

# Compile i18n (messages.ts is generated, not committed)
pnpm --filter @dimensiondev/firefly-wallet lingui:compile

# Build metadata (git commit, versions, etc.)
pnpm --filter @dimensiondev/firefly-wallet build:logs

# Vite / TanStack Start build
pnpm --filter @dimensiondev/firefly-wallet build
