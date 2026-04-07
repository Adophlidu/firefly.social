#!/bin/bash

# Install dependencies
pnpm install

# Compile i18n
pnpm run lingui:compile
