#!/usr/bin/env bash
# Deploy the Vite production build to the Mood Meter S3 website bucket.
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
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"
npm ci
npm run build

aws s3 sync dist/ "s3://${BUCKET}/" --delete --region "$REGION"

echo "Deployed to s3://${BUCKET}/"
echo "Website: http://${BUCKET}.s3-website-${REGION}.amazonaws.com"
