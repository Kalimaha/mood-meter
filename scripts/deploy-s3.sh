#!/usr/bin/env bash
# Deploy the Vite production build to the Mood Meter S3 bucket under dist/.
# Primary browser URL is the virtual-hosted HTTPS REST object URL (not s3-website-*).
# Same pattern as wa-critical-infrastructure-map: plain sync, no Cache-Control.
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

# Map-parity sync: no --cache-control, no --acl, no separate icon pass.
# Icons ride along with index.html under dist/.
aws s3 sync dist/ "s3://${BUCKET}/${PREFIX}/" --region "$REGION" --delete

echo "Deployed to s3://${BUCKET}/${PREFIX}/"
echo "Open (use this exact URL for browser + Add to Home Screen):"
echo "  https://${BUCKET}.s3.${REGION}.amazonaws.com/${PREFIX}/index.html"
echo "Do not open .../${PREFIX}/ — S3 HTTPS REST returns AccessDenied for directory URLs."
