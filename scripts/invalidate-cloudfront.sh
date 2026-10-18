#!/usr/bin/env bash
# Invalidate CloudFront cache for Mood Meter icon/HTML/manifest surfaces (and assets).
# Loads MOOD_METER_CLOUDFRONT_DISTRIBUTION_ID from env or scripts/cloudfront.local.env.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${MOOD_METER_CF_ENV_FILE:-${ROOT}/scripts/cloudfront.local.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  # Only export MOOD_METER_* lines
  # shellcheck disable=SC1091
  source "$ENV_FILE"
  set +a
fi

DIST_ID="${MOOD_METER_CLOUDFRONT_DISTRIBUTION_ID:-}"
if [[ -z "$DIST_ID" ]]; then
  echo "Set MOOD_METER_CLOUDFRONT_DISTRIBUTION_ID or create scripts/cloudfront.local.env via ./scripts/create-cloudfront.sh" >&2
  exit 1
fi

PATHS=(
  "/index.html"
  "/icon-test.html"
  "/manifest.webmanifest"
  "/apple-touch-icon.png"
  "/icon-192.png"
  "/icon-512.png"
  "/assets/*"
  "/"
)

echo "Invalidating ${#PATHS[@]} paths on ${DIST_ID}..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "${PATHS[@]}" \
  --query 'Invalidation.{Id:Id,Status:Status,CreateTime:CreateTime}' \
  --output table

echo "Done. Propagation is usually <1–2 minutes for invalidation; full new distributions take longer."
