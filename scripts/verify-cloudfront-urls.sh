#!/usr/bin/env bash
# HEAD-check CloudFront (or override base URL) for icon + manifest Content-Types.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${MOOD_METER_CF_ENV_FILE:-${ROOT}/scripts/cloudfront.local.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

BASE="${MOOD_METER_CF_BASE_URL:-}"
if [[ -z "$BASE" && -n "${MOOD_METER_CLOUDFRONT_DOMAIN:-}" ]]; then
  BASE="https://${MOOD_METER_CLOUDFRONT_DOMAIN}"
fi
if [[ -z "$BASE" ]]; then
  echo "Set MOOD_METER_CF_BASE_URL or MOOD_METER_CLOUDFRONT_DOMAIN (via cloudfront.local.env)." >&2
  exit 1
fi
BASE="${BASE%/}"

expect_ct() {
  local path="$1" want="$2"
  local url="${BASE}${path}"
  local hdr code ct
  hdr="$(curl -sI "$url" || true)"
  code="$(printf '%s' "$hdr" | tr -d '\r' | awk 'NR==1{print $2}')"
  ct="$(printf '%s' "$hdr" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print $2; exit}')"
  ct="${ct%%;*}"
  if [[ "$code" != "200" ]]; then
    echo "FAIL ${path} HTTP ${code:-?} (want 200, Content-Type ${want})"
    return 1
  fi
  case "$ct" in
    "${want}"*) echo "OK   ${path} ${ct}" ;;
    *) echo "FAIL ${path} Content-Type='${ct}' want '${want}'"; return 1 ;;
  esac
}

fail=0
expect_ct "/index.html" "text/html" || fail=1
expect_ct "/icon-test.html" "text/html" || fail=1
expect_ct "/manifest.webmanifest" "application/manifest+json" || fail=1
expect_ct "/apple-touch-icon.png" "image/png" || fail=1
expect_ct "/icon-192.png" "image/png" || fail=1
expect_ct "/icon-512.png" "image/png" || fail=1

if [[ "$fail" -ne 0 ]]; then
  echo "One or more checks failed for ${BASE}" >&2
  exit 1
fi
echo "All CloudFront icon surfaces OK at ${BASE}"
