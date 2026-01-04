#!/bin/bash

# Script: build-logs.sh
# Description: Collects build information and writes it to public/next-debug.log
#              This file contains build metadata including git commit info, versions,
#              and build time, which can be used for debugging and version tracking.

# Function to get the latest commit hash
get_latest_commit_hash() {
  git rev-parse HEAD 2>/dev/null || echo "unknown"
}

# Function to get the latest commit message
get_latest_commit_message() {
  git log -1 --pretty=%B 2>/dev/null | sed 's/^/    /' || echo "    (unable to retrieve commit message)"
}

# Function to check if the latest commit has a tag and get the tag name
get_latest_commit_tag() {
  git describe --tags --exact-match 2>/dev/null
}

# Function to get the version from package.json
get_package_version() {
  cat package.json \
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
output_file="public/next-debug.log"

# Check if package.json exists
if [ -f "package.json" ]; then

  # Get build information
  commit_hash=$(get_latest_commit_hash)
  commit_message=$(get_latest_commit_message)
  commit_tag=$(get_latest_commit_tag)
  # Use VERCEL_GIT_COMMIT_REF in Vercel CI, fallback to local branch in dev
  commit_branch=${VERCEL_GIT_COMMIT_REF:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")}
  version=$(get_package_version)
  node_version=$(get_node_version)
  pnpm_version=$(get_pnpm_version)
  build_time=$(date -u +"%Y-%m-%d %H:%M:%S %Z")
  build_time_utc8=$(TZ=UTC-8 date +"%Y-%m-%d %H:%M:%S %Z+8")

  # Create or overwrite the output file
  echo "Build Information" > "$output_file"
  echo "-----------------" >> "$output_file"
  echo "Vercel ENV: $VERCEL_ENV" >> "$output_file"
  echo "Build Time: $build_time ($build_time_utc8)" >> "$output_file"
  echo "Node.js Version: $node_version" >> "$output_file"
  echo "PNPM Version: $pnpm_version" >> "$output_file"
  echo "Application Version: v$version" >> "$output_file"
  echo "Latest Commit Branch: $commit_branch" >> "$output_file"
  if [ -n "$commit_tag" ]; then
    echo "Latest Commit Tag: $commit_tag" >> "$output_file"
  fi
  echo "Latest Commit Hash: $commit_hash" >> "$output_file"
  echo "Latest Commit Message:" >> "$output_file"
  echo "" >> "$output_file"
  echo "$commit_message" >> "$output_file"

else
  echo "Error: package.json not found. Make sure you are in the correct directory."
fi
