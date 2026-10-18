# Mood Meter

A minimal daily mood journal: rate each day up / flat / down, optionally note why, and see the path over time.

## Stack

- Vite + React + TypeScript (`strict`)
- Tailwind CSS
- Lucide icons
- Storybook
- Vitest + Testing Library
- PWA via `vite-plugin-pwa`

Auth (Google / Apple / etc.) is **post-M1 / after MVP** — not in this scaffold.

## Scripts

```bash
npm install
npm run dev          # local app
npm test             # unit tests
npm run build        # production build (+ PWA SW)
npm run storybook    # Storybook UI
npm run build-storybook
```

## Deploy (S3)

Static build is on bucket `mood-meter-507861384016` (Asia Pacific Sydney) under the `dist/` prefix, with public `GetObject`. Vite uses `base: './'` so assets resolve under that prefix. Credentials stay out of the repo (local AWS profile or Cursor env secrets). Set `AWS_DEFAULT_REGION` / `AWS_REGION` before syncing.

```bash
npm run build
aws s3 sync dist/ s3://mood-meter-507861384016/dist/ --delete
# or:
./scripts/deploy-s3.sh
```

**Browser URL (HTTPS):** `https://mood-meter-507861384016.s3.<region>.amazonaws.com/dist/index.html`  
(Same virtual-hosted REST pattern as the WA map app — not CloudFront, not the `s3-website-*` endpoint.)

DynamoDB table (persistence later): `mood-meter`. CloudFront / custom domain and CI deploy are follow-ups.

## Repo

https://github.com/Kalimaha/mood-meter
