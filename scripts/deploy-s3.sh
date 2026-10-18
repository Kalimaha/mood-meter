#!/usr/bin/env bash
# Deploy the Vite production build to the Mood Meter S3 bucket under dist/.
# Primary browser URL is the virtual-hosted HTTPS REST object URL (not s3-website-*).
# Same pattern as wa-critical-infrastructure-map: sync whole dist/ (icons next to index.html).
# Requires: AWS CLI credentials with s3:PutObject/DeleteObject + s3:PutBucketCors on the bucket.
# No secrets live in this repo — use env / IAM / Cursor secrets.
# pragma: allowlist secret — region default is public infra metadata, not a credential
set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-}}"
if [[ -z "$REGION" ]]; then
  echo "Set AWS_DEFAULT_REGION or AWS_REGION (Mood Meter uses Asia Pacific Sydney)." >&2
  exit 1
fi

BUCKET="${MOOD_METER_S3_BUCKET:-mood-meter-507861384016}"
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
echo "Open (use this exact URL for browser + Add to Home Screen):"
echo "  https://${BUCKET}.s3.${REGION}.amazonaws.com/${PREFIX}/index.html"
echo "Minimal icon diagnostic page (no React/JS):"
echo "  https://${BUCKET}.s3.${REGION}.amazonaws.com/${PREFIX}/icon-test.html"
echo "Do not open .../${PREFIX}/ — S3 HTTPS REST returns AccessDenied for directory URLs."
