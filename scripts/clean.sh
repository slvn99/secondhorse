#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning Next.js build artifacts..."
rm -rf .next .turbo coverage

echo "Optionally clear caches (uncomment if needed)"
# rm -rf node_modules/.cache

# Remove TS build info caches
rm -f tsconfig.tsbuildinfo
find . -name "*.tsbuildinfo" -maxdepth 2 -type f -print -delete || true

echo "Done."
