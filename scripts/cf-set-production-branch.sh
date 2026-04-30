#!/usr/bin/env bash
#
# Soft-launch flip — change CF Pages production branch.
#
# Initially the project is created with production branch = 'coming-soon'
# (see cf-bootstrap.sh). When you're ready to soft-launch, run:
#
#   ./scripts/cf-set-production-branch.sh main
#
# To roll back:
#
#   ./scripts/cf-set-production-branch.sh coming-soon
#
# This drives the CF API directly because wrangler doesn't expose
# project-level production-branch updates as of v3 (only at create time).
# Needs a CF API token in CLOUDFLARE_API_TOKEN env var, plus account ID
# in CLOUDFLARE_ACCOUNT_ID. Easiest: source tli-private/.env.local first.

set -euo pipefail

NEW_BRANCH="${1:-}"
PROJECT="thailand-liveability-index"

if [ -z "$NEW_BRANCH" ]; then
  echo "Usage: $0 <branch-name>"
  echo "  Common values: main, coming-soon"
  exit 1
fi

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "ERROR: CLOUDFLARE_API_TOKEN not set."
  echo "  Either export it in your shell, or source the env file:"
  echo "  set -a; source path/to/.env.local; set +a"
  exit 1
fi

if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "ERROR: CLOUDFLARE_ACCOUNT_ID not set (same source as above)."
  exit 1
fi

echo "Setting CF Pages '$PROJECT' production branch → '$NEW_BRANCH'..."

response=$(curl -sf -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"production_branch\": \"$NEW_BRANCH\"}")

if echo "$response" | grep -q '"success": *true'; then
  echo "  ✓ Production branch updated to '$NEW_BRANCH'."
  echo ""
  echo "Next: trigger a fresh build to push the new production branch to apex:"
  echo "  gh workflow run 'Cloudflare Pages deploy' --ref=$NEW_BRANCH"
  echo ""
  echo "Or push any commit to '$NEW_BRANCH' — same effect."
else
  echo "  ✗ API call failed. Response:"
  echo "$response"
  exit 1
fi
