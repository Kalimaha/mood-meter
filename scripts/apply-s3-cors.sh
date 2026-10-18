#!/usr/bin/env bash
# Apply map-identical S3 CORS so WebKit can CORS-fetch manifest icons (GET/HEAD).
# Matches wa-critical-infrastructure-map bucket CORS. Idempotent.
# pragma: allowlist secret — region default is public infra metadata, not a credential
set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-}}"
if [[ -z "$REGION" ]]; then
  echo "Set AWS_DEFAULT_REGION or AWS_REGION." >&2
  exit 1
fi

BUCKET="${MOOD_METER_S3_BUCKET:-mood-meter-507861384016}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORS_FILE="${ROOT}/scripts/s3-cors.json"

aws s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --cors-configuration "file://${CORS_FILE}" \
  --region "$REGION"

echo "CORS applied to s3://${BUCKET} (GET/HEAD, AllowedOrigins *)."
aws s3api get-bucket-cors --bucket "$BUCKET" --region "$REGION" --output json
