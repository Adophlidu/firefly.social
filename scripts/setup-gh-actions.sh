#!/bin/bash

npm i -g pnpm@8.15.8

pnpm install

pnpm run packages:build

# Compile i18n
pnpm run lingui:compile
