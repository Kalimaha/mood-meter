import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')

function readPngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path)
  // PNG IHDR: width/height are big-endian u32 at offsets 16 and 20
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

describe('PWA / home-screen icon pattern (map-style)', () => {
  it('index.html uses relative apple-touch-icon and manifest links', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8')
    expect(html).toContain('rel="apple-touch-icon" href="./apple-touch-icon.png"')
    expect(html).toContain('rel="manifest" href="./manifest.webmanifest"')
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"')
    expect(html).toContain('name="mobile-web-app-capable" content="yes"')
    expect(html).toContain('name="apple-mobile-web-app-title" content="Mood Meter"')
    expect(html).toContain('name="apple-mobile-web-app-status-bar-style" content="default"')
    expect(html).not.toContain('rel="icon"')
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
  })
})
