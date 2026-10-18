#!/usr/bin/env node
/**
 * Regenerate public/*.png from source JPG as map-clean PNGs:
 * RGBA (color type 6), chunks IHDR + IDAT + IEND only (no iCCP/EXIF/etc).
 *
 * Usage:
 *   node scripts/generate-pwa-icons.mjs /path/to/mood-meter-app-icon.jpg
 *
 * Requires: npm install --no-save sharp  (and optionally oxipng on PATH)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { deflateSync, inflateSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = process.argv[2]
if (!src) {
  console.error('Usage: node scripts/generate-pwa-icons.mjs <source.jpg>')
  process.exit(1)
}

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  }
  return ~c >>> 0
}

function pngChunk(type, payload) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(payload.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, payload])))
  return Buffer.concat([len, typeBuf, payload, crcBuf])
}

function stripToMapProfile(pngBuf) {
  if (pngBuf.subarray(0, 8).toString('binary') !== '\x89PNG\r\n\x1a\n') {
    throw new Error('not a PNG')
  }
  let i = 8
  let ihdr
  const idats = []
  while (i < pngBuf.length) {
    const length = pngBuf.readUInt32BE(i)
    const type = pngBuf.subarray(i + 4, i + 8).toString('latin1')
    const payload = pngBuf.subarray(i + 8, i + 8 + length)
    if (type === 'IHDR') ihdr = payload
    else if (type === 'IDAT') idats.push(payload)
    i += 12 + length
  }
  if (!ihdr || ihdr[9] !== 6) throw new Error(`expected RGBA color type 6, got ${ihdr && ihdr[9]}`)
  const raw = inflateSync(Buffer.concat(idats))
  let best = deflateSync(raw, { level: 9 })
  for (let level = 0; level <= 9; level++) {
    const c = deflateSync(raw, { level })
    if (c.length < best.length) best = c
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', best),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

async function make(size, name) {
  const { data, info } = await sharp(src)
    .resize(size, size, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  // One near-opaque alpha byte keeps color type 6 when optimizers run.
  data[data.length - 1] = 254
  const png = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9, palette: false, effort: 10, force: true })
    .toBuffer()
  let clean = stripToMapProfile(png)
  const out = resolve(root, 'public', name)
  writeFileSync(out, clean)
  try {
    execFileSync('oxipng', ['-o', 'max', '--strip', 'all', '--nx', out], { stdio: 'pipe' })
    clean = stripToMapProfile(readFileSync(out))
    writeFileSync(out, clean)
  } catch {
    /* oxipng optional */
  }
  console.log(name, clean.length, 'bytes')
}

await make(180, 'apple-touch-icon.png')
await make(192, 'icon-192.png')
await make(512, 'icon-512.png')
