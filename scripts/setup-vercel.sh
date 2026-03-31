#!/bin/bash

# Compile i18n
pnpm run lingui:compile

# Build all sub-packages sequentially (tsup emits .d.ts)
pnpm -r --filter "./packages/*" --workspace-concurrency=1 run build

# Run Next.js build for the main project
pnpm run build:polyfills
pnpm run build:scripts
pnpm run build:logs
pnpm run build
