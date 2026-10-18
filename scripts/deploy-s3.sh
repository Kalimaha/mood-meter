#!/usr/bin/env bash
# Deploy the Vite production build to the Mood Meter S3 bucket under dist/.
# Prefer the CloudFront HTTPS URL once created (see scripts/create-cloudfront.sh).
# Fallback: virtual-hosted S3 REST HTTPS (same pattern as wa-critical-infrastructure-map).
# Requires: AWS CLI credentials with s3:PutObject/DeleteObject + s3:PutBucketCors on the bucket.
# Optional CloudFront invalidate: MOOD_METER_CLOUDFRONT_DISTRIBUTION_ID or scripts/cloudfront.local.env.
# No secrets live in this repo — use env / IAM / Cursor secrets.
# pragma: allowlist secret — region default is public infra metadata, not a credential
set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-}}"
if [[ -z "$REGION" ]]; then
  echo "Set AWS_DEFAULT_REGION or AWS_REGION (Mood Meter uses Asia Pacific Sydney)." >&2
  exit 1
fi

# Primary host is the short clean bucket (iOS may poison the old account-id hostname).
# Override with MOOD_METER_S3_BUCKET=mood-meter-507861384016 to target the legacy bucket.
BUCKET="${MOOD_METER_S3_BUCKET:-mood-meter-app}"
PREFIX="${MOOD_METER_S3_PREFIX:-dist}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"
npm ci
npm run build

# Map-parity CORS first (WebKit may CORS-fetch manifest icons).
bash "$ROOT/scripts/apply-s3-cors.sh"

# Map-parity sync: no Cache-Control / ACL metadata that the working map bucket omits.
# Explicit Content-Type only where we must not rely on extension guessing alone.
aws s3 sync dist/ "s3://${BUCKET}/${PREFIX}/" --delete --region "$REGION"

# Re-assert Content-Types for icon discovery surfaces (no Cache-Control — match map).
aws s3 cp dist/index.html "s3://${BUCKET}/${PREFIX}/index.html" --region "$REGION" \
  --content-type "text/html" \
  --metadata-directive REPLACE

if [[ -f dist/icon-test.html ]]; then
  aws s3 cp dist/icon-test.html "s3://${BUCKET}/${PREFIX}/icon-test.html" --region "$REGION" \
    --content-type "text/html" \
    --metadata-directive REPLACE
fi

aws s3 cp dist/manifest.webmanifest "s3://${BUCKET}/${PREFIX}/manifest.webmanifest" --region "$REGION" \
  --content-type "application/manifest+json" \
  --metadata-directive REPLACE

for png in apple-touch-icon.png icon-192.png icon-512.png; do
  if [[ -f "dist/${png}" ]]; then
    aws s3 cp "dist/${png}" "s3://${BUCKET}/${PREFIX}/${png}" --region "$REGION" \
      --content-type "image/png" \
      --metadata-directive REPLACE
  fi
done

# Delete leftover hail-mary / versioned icon objects so nothing under /dist/ still
# serves old paths.
for stale in \
  mm-icon-180.png \
  mm-touch-180.png \
  mm-icon-192-clean.png \
  mm-icon-512-clean.png \
  apple-touch-icon-v3.png \
  apple-touch-icon-v4.png \
  apple-touch-icon-precomposed.png \
  favicon.png \
  favicon.svg \
  pwa-192-v3.png \
  pwa-192-v4.png \
  pwa-512-v3.png \
  pwa-512-v4.png
do
  aws s3 rm "s3://${BUCKET}/${PREFIX}/${stale}" --region "$REGION" 2>/dev/null || true
done

echo "Deployed to s3://${BUCKET}/${PREFIX}/"

# Invalidate CloudFront when configured (icon/HTML must not stick on stale edge cache).
CF_ENV="${MOOD_METER_CF_ENV_FILE:-${ROOT}/scripts/cloudfront.local.env}"
if [[ -z "${MOOD_METER_CLOUDFRONT_DISTRIBUTION_ID:-}" && -f "$CF_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$CF_ENV"
  set +a
fi
if [[ -n "${MOOD_METER_CLOUDFRONT_DISTRIBUTION_ID:-}" ]]; then
  bash "$ROOT/scripts/invalidate-cloudfront.sh" || echo "CloudFront invalidate failed (deploy still on S3)." >&2
fi

if [[ -n "${MOOD_METER_CLOUDFRONT_DOMAIN:-}" ]]; then
  echo "Prefer CloudFront HTTPS for Add to Home Screen:"
  echo "  https://${MOOD_METER_CLOUDFRONT_DOMAIN}/index.html"
  echo "  https://${MOOD_METER_CLOUDFRONT_DOMAIN}/icon-test.html"
else
  echo "Open (S3 REST fallback — iOS may fail Add-to-Home icons on *.amazonaws.com):"
  echo "  https://${BUCKET}.s3.${REGION}.amazonaws.com/${PREFIX}/index.html"
  echo "Minimal icon diagnostic page (no React/JS):"
  echo "  https://${BUCKET}.s3.${REGION}.amazonaws.com/${PREFIX}/icon-test.html"
  echo "Create CloudFront: ./scripts/create-cloudfront.sh (needs IAM — see iam-cloudfront-policy.json)"
fi
echo "Do not open S3 .../${PREFIX}/ — virtual-hosted HTTPS REST returns AccessDenied for directory URLs."
