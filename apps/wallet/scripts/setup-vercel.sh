#!/bin/bash

# Compile i18n
pnpm run lingui:compile

# Run TanStack Start build for the main project
pnpm run build:logs
pnpm run build
