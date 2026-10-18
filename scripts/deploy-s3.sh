#!/usr/bin/env bash
# Deploy the Vite production build to the Mood Meter S3 bucket under dist/.
# Primary browser URL is the virtual-hosted HTTPS REST object URL (not s3-website-*).
# Requires: AWS CLI credentials with s3:PutObject/DeleteObject on the bucket.
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

# HTML/manifest must not be heuristically cached (old shells pointed at deleted icon paths → letter “M”).
aws s3 sync dist/ "s3://${BUCKET}/${PREFIX}/" --delete --region "$REGION" \
  --exclude index.html --exclude manifest.webmanifest \
  --cache-control "public,max-age=31536000,immutable"

aws s3 cp dist/index.html "s3://${BUCKET}/${PREFIX}/index.html" --region "$REGION" \
  --content-type "text/html" \
  --cache-control "public,max-age=0,must-revalidate"

aws s3 cp dist/manifest.webmanifest "s3://${BUCKET}/${PREFIX}/manifest.webmanifest" --region "$REGION" \
  --content-type "application/manifest+json" \
  --cache-control "public,max-age=0,must-revalidate"

# Fresh root probes without year-long immutable cache from earlier deploys.
if [[ -f dist/apple-touch-icon.png ]]; then
  aws s3 cp dist/apple-touch-icon.png "s3://${BUCKET}/apple-touch-icon.png" --region "$REGION" \
    --content-type "image/png" \
    --cache-control "public,max-age=0,must-revalidate"
  aws s3 cp dist/apple-touch-icon.png "s3://${BUCKET}/apple-touch-icon-precomposed.png" --region "$REGION" \
    --content-type "image/png" \
    --cache-control "public,max-age=0,must-revalidate"
fi

echo "Deployed to s3://${BUCKET}/${PREFIX}/"
echo "Open (use this exact URL for browser + Add to Home Screen):"
echo "  https://${BUCKET}.s3.${REGION}.amazonaws.com/${PREFIX}/index.html"
echo "Do not open .../${PREFIX}/ — S3 HTTPS REST returns AccessDenied for directory URLs."
