#!/bin/bash

npm i -g pnpm@8.15.8

pnpm install

# Build all sub-packages sequentially (tsup emits .d.ts)
pnpm -r --filter "./packages/*" --workspace-concurrency=1 run build

# Compile i18n
pnpm run lingui:compile
