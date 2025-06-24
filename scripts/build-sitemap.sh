#!/bin/bash

set -e

LOG_FILE="./public/build-sitemap.log"
mkdir -p "$(dirname "$LOG_FILE")"

(
  set -e

  # --- Helpers for color output ---
  log_info() {
    echo -e "[INFO] $1"
  }
  log_success() {
    echo -e "[SUCCESS] $1"
  }
  log_warn() {
    echo -e "[WARN] $1"
  }
  log_error() {
    echo -e "[ERROR] $1"
  }

  # --- Ensure jq is available ---
  if ! command -v jq &> /dev/null; then
    log_error "jq not found. Attempting to install..."

    set +e

    if [ "$(uname)" == "Darwin" ]; then
      if command -v brew &> /dev/null; then
        brew install jq
      else
        log_error "Homebrew not found. Please install jq manually."
        exit 1
      fi
    elif [ -f /etc/debian_version ]; then
      sudo apt-get update && sudo apt-get install -y jq
    elif [ -f /etc/redhat-release ]; then
      sudo yum install -y jq
    else
      log_error "Unsupported OS. Please install jq manually: https://stedolan.github.io/jq/"
      exit 1
    fi

    set -e
  fi

  # --- Config ---
  BASE_URL="https://firefly.social/sitemap"
  API_BASE="https://api-dev.firefly.land/v1/recommendation/get_hot_account"
  OUTPUT_DIR="./public/sitemap"
  MAX_LINKS_PER_FILE=10000
  PROVIDERS=("farcaster" "twitter")

  mkdir -p "$OUTPUT_DIR"

  # --- Initialize associative array for account sitemaps ---
  ALL_SITEMAP_URLS=()

  # --- Fetching handles ---
  fetch_handles() {
    local provider="$1"
    local size=1000
    local handles=()

    for ((i = 1; i <= 150; i++)); do
      resp=$(curl -s "$API_BASE?type=$provider&cursor=$i&size=$size")
      code=$(echo "$resp" | jq '.code')

      if [ "$code" != "0" ]; then
        break
      fi

      new_handles=$(echo "$resp" | jq -r '.data[]?.name')
      if [ -z "$new_handles" ]; then
        break
      fi

      handles+=($new_handles)

      if [ $(echo "$new_handles" | wc -l) -lt "$size" ]; then
        break
      fi

      sleep 1
    done

    echo "${handles[@]}"
  }

  # --- Generate per-provider sitemaps ---
  generate_account_sitemaps() {
    local provider="$1"
    local handles=("$@")
    handles=("${handles[@]:1}")

    local total=${#handles[@]}
    local count=0
    local file_index=1

    log_info "Generating ${provider}-account XML (${total} handles total)"

    while [ $count -lt $total ]; do
      local chunk=("${handles[@]:$count:$MAX_LINKS_PER_FILE}")
      local file_path="${OUTPUT_DIR}/${provider}-account-${file_index}.xml"
      local url_path="${BASE_URL}/${provider}-account-${file_index}.xml"

      local sitemap_provider="$provider"
      if [ "$provider" = "twitter" ]; then
        sitemap_provider="x"
      fi

      {
        echo '<?xml version="1.0" encoding="UTF-8"?>'
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        for handle in "${chunk[@]}"; do
          echo "  <url><loc>https://firefly.social/profile/${sitemap_provider}/${handle}/feed</loc></url>"
        done
        echo '</urlset>'
      } > "$file_path"

      log_info "📄 Created: $file_path"
      ALL_SITEMAP_URLS+=("$url_path")
      ((count+=MAX_LINKS_PER_FILE))
      ((file_index++))
    done
  }

  # --- Main sitemap ---
  generate_main_sitemap() {
    local index_path="${OUTPUT_DIR}/index.xml"
    {
      echo '<?xml version="1.0" encoding="UTF-8"?>'
      echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
      echo "  <sitemap><loc>${BASE_URL}/static.xml</loc></sitemap>"
      for url in "${ALL_SITEMAP_URLS[@]}"; do
        echo "  <sitemap><loc>$url</loc></sitemap>"
      done
      echo '</sitemapindex>'
    } > "$index_path"

    log_success "🌐 Main index.xml generated at $index_path"
  }

  # --- Main script ---
  log_info "🚀 Starting sitemap generation..."
  for provider in "${PROVIDERS[@]}"; do
    log_info "🔍 Fetching handles for provider: $provider"
    handles=($(fetch_handles "$provider"))
    generate_account_sitemaps "$provider" "${handles[@]}"
  done

  generate_main_sitemap

  log_success "🏁 All sitemaps generated in: $OUTPUT_DIR"
) >"$LOG_FILE" 2>&1
