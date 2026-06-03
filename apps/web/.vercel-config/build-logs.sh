#!/bin/bash

# Script: build-logs.sh
# Description: Collects build information and writes it to public/next-debug.log
#              This file contains build metadata including git commit info, versions,
#              and build time, which can be used for debugging and version tracking.

set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"
WEB_ROOT="$ROOT/apps/web"

# Function to get the version from package.json
get_package_version() {
  cat "$WEB_ROOT/package.json" \
    | grep version \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | awk '{$1=$1};1' \
    | sed 's/[",]//g'
}

# Function to get Node.js version
get_node_version() {
  node --version
}

# Function to get PNPM version
get_pnpm_version() {
  pnpm --version
}

# Main script

# Output file: This file is written to public/next-debug.log and contains build metadata
# that can be accessed at runtime for debugging and version tracking purposes.
output_file="$WEB_ROOT/public/next-debug.log"

# Check if package.json exists
if [ -f "$WEB_ROOT/package.json" ]; then

  # Get build information
  version=$(get_package_version)
  node_version=$(get_node_version)
  pnpm_version=$(get_pnpm_version)
  build_time=$(date -u +"%Y-%m-%d %H:%M:%S %Z")
  build_time_utc8=$(TZ=UTC-8 date +"%Y-%m-%d %H:%M:%S %Z+8")

  # Create or overwrite the output file
  echo "Build Information" > "$output_file"
  echo "-----------------" >> "$output_file"
  echo "Vercel ENV: ${VERCEL_ENV:-}" >> "$output_file"
  echo "Build Time: $build_time ($build_time_utc8)" >> "$output_file"
  echo "Node.js Version: $node_version" >> "$output_file"
  echo "PNPM Version: $pnpm_version" >> "$output_file"
  echo "Application Version: v$version" >> "$output_file"

  # Append client-exposed (NEXT_PUBLIC_*) environment variables, sorted by name.
  # This file is served from public/, so to avoid leaking secrets we only print:
  #   - feature-flag envs whose value is exactly "enabled" or "disabled"
  #   - NEXT_PUBLIC_VERCEL_GIT_COMMIT_* git metadata (non-secret)
  # All other NEXT_PUBLIC_* vars (which may hold secrets) are omitted.
  external_envs=$(env | grep '^NEXT_PUBLIC_' | while IFS='=' read -r name value; do
    if [[ "$name" == NEXT_PUBLIC_VERCEL_GIT_COMMIT_* ]]; then
      echo "$name=$value"
    elif [[ "$value" == "enabled" || "$value" == "disabled" ]]; then
      echo "$name=$value"
    fi
  done | sort || true)
  echo "" >> "$output_file"
  echo "External Envs (NEXT_PUBLIC_*)" >> "$output_file"
  echo "-----------------------------" >> "$output_file"
  if [ -n "$external_envs" ]; then
    echo "$external_envs" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

else
  echo "Error: package.json not found. Make sure you are in the correct directory."
fi
