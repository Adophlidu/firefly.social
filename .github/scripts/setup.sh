#!/bin/bash

npm i -g pnpm@11.6.0

pnpm install

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

pnpm --filter @dimensiondev/firefly-web lingui:compile
pnpm --filter @dimensiondev/firefly-wallet lingui:compile
