#!/bin/bash
set -euo pipefail

# Build packages (workers depend on @dimensiondev/enums and @dimensiondev/web3,
# so these must be built before the workers are bundled)
pnpm --filter @dimensiondev/enums build
pnpm --filter @dimensiondev/constants build
pnpm --filter @dimensiondev/types build
pnpm --filter @dimensiondev/utils build
pnpm --filter @dimensiondev/envs build
pnpm --filter @dimensiondev/web3 build
pnpm --filter @dimensiondev/iframe-bridge build
pnpm --filter @dimensiondev/native-bridge build
pnpm --filter @dimensiondev/exception-tracker build
pnpm --filter @dimensiondev/auth build

# Build workers (depends on the packages built above)
pnpm --filter "@dimensiondev/workers-*" build

# Generate worker type declarations (required for TypeScript resolution in apps/web)
pnpm --filter "@dimensiondev/workers-*" types

# Compile i18n (messages.ts is generated, not committed)
pnpm --filter @dimensiondev/firefly-wallet lingui:compile

# Build metadata (git commit, versions, etc.)
pnpm --filter @dimensiondev/firefly-wallet build:logs

# Vite / TanStack Start build
pnpm --filter @dimensiondev/firefly-wallet build
