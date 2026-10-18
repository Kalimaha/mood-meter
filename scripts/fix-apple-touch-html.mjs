import { readFileSync, writeFileSync } from 'node:fs'
const path = 'dist/index.html'
let html = readFileSync(path, 'utf8')
const abs = [
  '    <link rel="apple-touch-icon" href="/dist/apple-touch-icon-v4.png" sizes="180x180" />',
  '    <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />',
  '    <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png" sizes="180x180" />',
].join('\n')
if (!html.includes('href="/apple-touch-icon.png"')) {
  html = html.replace(
    '    <meta name="theme-color"',
    `${abs}\n    <meta name="theme-color"`,
  )
  writeFileSync(path, html)
  console.log('Injected absolute apple-touch-icon links into', path)
} else {
  console.log('Absolute apple-touch-icon links already present')
}
