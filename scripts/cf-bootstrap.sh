#!/usr/bin/env bash
# Copyright (c) 2026 Will Reynolds
# SPDX-License-Identifier: MIT
#
# Cloudflare Pages bootstrap — one-time setup, runs locally on the
# operator's machine. Drives the project creation, custom-domain binding,
# and prints the remaining manual steps (mint API token, set GH secrets).
#
# Prerequisites:
#   - npx wrangler login   (browser-based, opens once)
#   - gh auth login        (for GitHub Secrets — optional but recommended)
#
# Idempotent: re-running with the project already created prints a
# warning and continues. Re-running with the domain already bound is
# a no-op.

set -euo pipefail

PROJECT="thailand-liveability-index"
APEX="thailandliveabilityindex.com"
PROD_BRANCH="coming-soon"
COMPAT_DATE="2026-04-30"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
note() { printf '  %s\n' "$*"; }

bold "=== 1. Verify wrangler auth ==="
if ! npx wrangler whoami 2>&1 | grep -q "logged in"; then
  echo "  wrangler is not authenticated. Running 'npx wrangler login'..."
  npx wrangler login
else
  note "wrangler already authenticated."
fi

bold ""
bold "=== 2. Create CF Pages project '$PROJECT' ==="
if npx wrangler pages project list 2>/dev/null | grep -q "$PROJECT"; then
  note "Project '$PROJECT' already exists. Skipping create."
else
  npx wrangler pages project create "$PROJECT" \
    --production-branch="$PROD_BRANCH" \
    --compatibility-date="$COMPAT_DATE"
fi

bold ""
bold "=== 3. Custom domain — manual step (not wrangler) ==="
cat <<EOF
  Wrangler v4 doesn't expose 'pages domain add' (it was removed; the
  available pages subcommands are dev/functions/project/deployment/
  deploy/secret/download). Bind the apex via the dashboard instead:

    1. https://dash.cloudflare.com → Workers & Pages → '$PROJECT'
    2. Custom domains → Set up a custom domain
    3. Enter '$APEX' (and again for 'www.$APEX' if you want www)

  Pre-req: the domain's zone must be in your CF account, with the two
  CF nameservers active at the registrar. If you skipped that, do it
  first via dash.cloudflare.com → Add a domain.

  See dm-20260430-cf-pages-staging-strategy.md (private repo) for the
  full setup including the Porkbun-imported records you'll want to
  delete after the import.
EOF

bold ""
bold "=== 4. Manual steps remaining ==="
cat <<EOF

  ONE TIME (browser, then CLI):

  a) Mint a Cloudflare API token:
     https://dash.cloudflare.com/profile/api-tokens
     Click "Create Custom Token" with these permissions:
       - Account → Cloudflare Pages → Edit
     Restrict to your account. Copy the resulting token.

  b) Mint a Cloudflare account ID (if you don't already have it handy):
     https://dash.cloudflare.com/  → right sidebar shows "Account ID".

  c) Add four GitHub Secrets (gh CLI works for this):

       gh secret set CLOUDFLARE_API_TOKEN     # paste step (a) value
       gh secret set CLOUDFLARE_ACCOUNT_ID    # paste step (b) value
       gh secret set R2_ACCESS_KEY_ID         # from tli-private/.env.local
       gh secret set R2_SECRET_ACCESS_KEY     # from tli-private/.env.local

     (gh prompts for the secret value; nothing is echoed to terminal.)

  d) Push any commit to 'main' or 'coming-soon' to trigger the workflow,
     OR run it manually:

       gh workflow run "Cloudflare Pages deploy"

  After that, the apex serves whatever the configured production branch
  ('$PROD_BRANCH' initially) builds. Soft-launch flip is in
  scripts/cf-set-production-branch.sh.

EOF
