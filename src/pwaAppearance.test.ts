import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')

function readPngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path)
  // PNG IHDR: width/height are big-endian u32 at offsets 16 and 20
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

/** PNG color type 6 = RGBA (map apple-touch-icon). Type 2 = RGB without alpha. */
function readPngColorType(path: string): number {
  const buf = readFileSync(path)
  return buf.readUInt8(25)
}

/** Chunk type names in order. Map icons are IHDR + IDAT(+…) + IEND only. */
function readPngChunkTypes(path: string): string[] {
  const buf = readFileSync(path)
  const chunks: string[] = []
  let i = 8
  while (i < buf.length) {
    const length = buf.readUInt32BE(i)
    chunks.push(buf.subarray(i + 4, i + 8).toString('latin1'))
    i += 12 + length
  }
  return chunks
}

describe('PWA / home-screen icon pattern (map-style)', () => {
  it('index.html uses relative apple-touch-icon and manifest links', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8')
    expect(html).toContain('rel="manifest" href="./manifest.webmanifest"')
    expect(html).toContain('rel="apple-touch-icon" href="./apple-touch-icon.png"')
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"')
    expect(html).toContain('name="mobile-web-app-capable" content="yes"')
    expect(html).toContain('name="apple-mobile-web-app-title" content="Mood Meter"')
    expect(html).toContain('name="apple-mobile-web-app-status-bar-style" content="default"')
    expect(html).toContain('name="theme-color" content="#f2efe9" media="(prefers-color-scheme: light)"')
    expect(html).toContain('name="theme-color" content="#0f1419" media="(prefers-color-scheme: dark)"')
    expect(html).not.toContain('rel="icon"')
    expect(html).not.toContain('mm-icon-180')
    expect(html).not.toContain('vite-plugin-pwa')
    expect(html).not.toContain('serviceWorker')
    expect(html).not.toMatch(/apple-touch-icon[^>]+href="\//)
  })

  it('static manifest uses relative start_url, scope, and icons', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(root, 'public/manifest.webmanifest'), 'utf8'),
    ) as {
      start_url: string
      scope: string
      display: string
      icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>
    }
    expect(manifest.start_url).toBe('./index.html')
    expect(manifest.scope).toBe('./')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons).toEqual([
      { src: './icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: './icon-512.png', sizes: '512x512', type: 'image/png' },
    ])
    for (const icon of manifest.icons) {
      expect(icon.purpose).toBeUndefined()
    }
  })

  it('ships 180 / 192 / 512 PNGs next to the manifest in public/', () => {
    const apple = resolve(root, 'public/apple-touch-icon.png')
    const i192 = resolve(root, 'public/icon-192.png')
    const i512 = resolve(root, 'public/icon-512.png')
    expect(existsSync(apple)).toBe(true)
    expect(existsSync(i192)).toBe(true)
    expect(existsSync(i512)).toBe(true)
    expect(readPngSize(apple)).toEqual({ width: 180, height: 180 })
    expect(readPngSize(i192)).toEqual({ width: 192, height: 192 })
    expect(readPngSize(i512)).toEqual({ width: 512, height: 512 })
    // Map parity: RGBA (color type 6), not RGB-only
    expect(readPngColorType(apple)).toBe(6)
    expect(readPngColorType(i192)).toBe(6)
    expect(readPngColorType(i512)).toBe(6)
    // Map parity: no ICC/EXIF/ancillary junk — only IHDR + IDAT + IEND
    for (const path of [apple, i192, i512]) {
      const chunks = readPngChunkTypes(path)
      expect(chunks[0]).toBe('IHDR')
      expect(chunks[chunks.length - 1]).toBe('IEND')
      expect(chunks.slice(1, -1).every((c) => c === 'IDAT')).toBe(true)
      expect(chunks).not.toContain('iCCP')
      expect(chunks).not.toContain('eXIf')
      expect(chunks).not.toContain('tEXt')
      expect(chunks).not.toContain('pHYs')
      expect(chunks).not.toContain('cHRM')
      expect(chunks).not.toContain('bKGD')
      expect(chunks).not.toContain('tIME')
    }
    // Map parity: no versioned / alternate icon filenames in public/
    expect(existsSync(resolve(root, 'public/mm-icon-180.png'))).toBe(false)
    expect(existsSync(resolve(root, 'public/favicon.svg'))).toBe(false)
    expect(existsSync(resolve(root, 'public/favicon.png'))).toBe(false)
  })

  it('vite config has relative base and no vite-plugin-pwa', () => {
    const vite = readFileSync(resolve(root, 'vite.config.ts'), 'utf8')
    expect(vite).toContain("base: './'")
    expect(vite).not.toContain('vite-plugin-pwa')
    expect(vite).not.toContain('VitePWA')
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      devDependencies?: Record<string, string>
    }
    expect(pkg.devDependencies?.['vite-plugin-pwa']).toBeUndefined()
  })

  it('deploy script matches map aws s3 sync flags', () => {
    const deploy = readFileSync(resolve(root, 'scripts/deploy-s3.sh'), 'utf8')
    // Strip comments so docs mentioning forbidden flags do not fail the guardrail.
    const code = deploy
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n')
    expect(code).toMatch(/aws s3 sync dist\/ .* --region "\$REGION" --delete/)
    expect(code).not.toMatch(/--cache-control/)
    expect(code).not.toMatch(/--acl\b/)
    expect(code).not.toMatch(/--metadata-directive/)
    expect(code).not.toMatch(/--content-type/)
  })
})
