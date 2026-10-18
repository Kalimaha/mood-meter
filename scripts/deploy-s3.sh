#!/usr/bin/env bash
# Deploy the Vite production build to the Mood Meter S3 bucket under dist/.
# Exact same AWS shape as wa-critical-infrastructure-map:
#   aws s3 sync dist/ s3://<bucket>/dist/ --region "$REGION" --delete
# No --cache-control, --acl, --content-type, or --metadata-directive.
# Primary browser URL is the virtual-hosted HTTPS REST object URL (not s3-website-*).
# Requires: AWS CLI credentials with s3:PutObject/DeleteObject on the bucket.
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

# Map recipe (package.json deploy): plain sync of dist/ with --delete only.
aws s3 sync dist/ "s3://${BUCKET}/${PREFIX}/" --region "$REGION" --delete

# Extra cleanup for leftover hail-mary / SW objects from older Mood Meter deploys
# (map sync --delete already removes missing keys; these names are not in current dist/).
for stale in \
  mm-icon-180.png \
  apple-touch-icon-v3.png \
  apple-touch-icon-v4.png \
  apple-touch-icon-precomposed.png \
  favicon.png \
  favicon.svg \
  pwa-192-v3.png \
  pwa-192-v4.png \
  pwa-512-v3.png \
  pwa-512-v4.png \
  sw.js \
  registerSW.js
do
  aws s3 rm "s3://${BUCKET}/${PREFIX}/${stale}" --region "$REGION" 2>/dev/null || true
done

aws s3 ls "s3://${BUCKET}/${PREFIX}/" --region "$REGION" \
  | awk '{print $4}' \
  | grep -E '^(sw\.js|registerSW\.js|workbox-.*\.js)$' \
  | while read -r stale; do
      aws s3 rm "s3://${BUCKET}/${PREFIX}/${stale}" --region "$REGION" 2>/dev/null || true
    done

echo "Deployed to s3://${BUCKET}/${PREFIX}/"
echo "Open (use this exact URL for browser + Add to Home Screen):"
echo "  https://${BUCKET}.s3.${REGION}.amazonaws.com/${PREFIX}/index.html"
echo "Do not open .../${PREFIX}/ — S3 HTTPS REST returns AccessDenied for directory URLs."
echo "Website endpoint (s3-website-*) is not configured — use REST URL like the map."
