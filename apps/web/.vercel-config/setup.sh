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
pnpm --filter @dimensiondev/rn-ui lingui:compile
pnpm --filter @dimensiondev/firefly-web lingui:compile

# Run pre-build scripts (polyfills, bundled scripts, build metadata)
pnpm --filter @dimensiondev/firefly-web build:polyfills
pnpm --filter @dimensiondev/firefly-web build:scripts
pnpm --filter @dimensiondev/firefly-web build:logs

# Run Next.js build for the monorepo (packages, then web app)
pnpm --filter @dimensiondev/firefly-web build
