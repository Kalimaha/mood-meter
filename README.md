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

Static SPA hosting is on bucket `mood-meter-507861384016` (Asia Pacific Sydney; website hosting + public `GetObject` for objects). Credentials stay out of the repo (local AWS profile or Cursor env secrets). Set `AWS_DEFAULT_REGION` / `AWS_REGION` before syncing.

```bash
npm run build
aws s3 sync dist/ s3://mood-meter-507861384016/ --delete
# or:
./scripts/deploy-s3.sh
```

Website host pattern: `http://mood-meter-507861384016.s3-website-<region>.amazonaws.com`  
DynamoDB table (persistence later): `mood-meter`. CloudFront/HTTPS and CI deploy are follow-ups.

## Repo

https://github.com/Kalimaha/mood-meter
