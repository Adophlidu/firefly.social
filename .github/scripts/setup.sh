#!/bin/bash

npm i -g pnpm@8.15.8

pnpm install

pnpm run packages:build

# Compile i18n (messages.ts is generated, not committed)
pnpm --filter @dimensiondev/rn-ui lingui:compile
pnpm --filter @dimensiondev/firefly-web lingui:compile
pnpm --filter @dimensiondev/firefly-wallet lingui:compile
