#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning Next.js build artifacts..."
rm -rf .next .turbo

echo "Optionally clear caches (uncomment if needed)"
# rm -rf node_modules/.cache

echo "Done."

