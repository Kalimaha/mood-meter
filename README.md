# Mood Meter

A minimal daily mood journal: rate each day up / flat / down, optionally note why, and see the path over time.

## Stack

- Vite + React + TypeScript (`strict`)
- Tailwind CSS
- Lucide icons
- Storybook
- Vitest + Testing Library
- Static web app manifest + PNGs for Add to Home Screen (same pattern as WA Infra Map — no `vite-plugin-pwa`)

Auth (Google / Apple / etc.) is **post-M1 / after MVP** — not in this scaffold.

## Demo seed

On first visit (empty localStorage), the app writes **500** demo mood days (~70% flat) plus several single-day and range events (`src/storage/seed.ts`). The applied flag is `mood-meter:demo-seed:v3`.

- **Empty storage** → seed once, set `v3`.
- **Prior demo flags (`v1` / `v2`)** → replace days + events with the current seed, clear legacy flags, set `v3`.
- **Already on `v3`** → no-op (user edits kept).
- **Days/events present without a seed flag** → set `v3` only; do not overwrite.
- **Force reset (tests):** `ensureDemoSeed({ force: true })` or clear via `clearDemoSeed()`.

Bump by renaming the flag to `vN+1` and listing the old key under `LEGACY_SEED_KEYS`.

## Scripts

```bash
npm install
npm run dev          # local app
npm test             # unit tests
npm run build        # production build
npm run storybook    # Storybook UI
npm run build-storybook
npm run deploy       # build + sync dist/ to S3
```

## Deploy (S3)

Static build is on bucket `mood-meter-app` (Asia Pacific Sydney) under the `dist/` prefix, with public `GetObject`. Vite uses `base: './'` so assets resolve under that prefix. Credentials stay out of the repo (local AWS profile or Cursor env secrets). Set `AWS_DEFAULT_REGION` / `AWS_REGION` before syncing. Override with `MOOD_METER_S3_BUCKET` if needed (legacy: `mood-meter-507861384016`).

```bash
npm run build
aws s3 sync dist/ s3://mood-meter-app/dist/ --delete
# or:
./scripts/deploy-s3.sh
```

**Preferred browser URL (HTTPS):** CloudFront once provisioned — `https://<distribution>.cloudfront.net/index.html` (and `/icon-test.html`). Origin is `mood-meter-app` with `OriginPath=/dist` so paths are at the distribution root.

```bash
# Needs cloudfront:* on IAM user (see scripts/iam-cloudfront-policy.json)
./scripts/create-cloudfront.sh
./scripts/verify-cloudfront-urls.sh
```

**S3 REST fallback:** `https://mood-meter-app.s3.<region>.amazonaws.com/dist/index.html`  
(Same virtual-hosted REST pattern as the WA map — not the `s3-website-*` endpoint.) iOS Add-to-Home may fail to pick icons on raw `*.amazonaws.com` hosts; prefer CloudFront for that test.

Use an explicit **`index.html`** URL for Add to Home Screen — not a bare directory on S3 REST (AccessDenied; no index document). Home-screen icons are static files next to `index.html` under `dist/` (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) referenced with relative `./` hrefs in `index.html` and `manifest.webmanifest`.

DynamoDB table (persistence later): `mood-meter`. Custom domain / CI deploy are follow-ups.

## Repo

https://github.com/Kalimaha/mood-meter
