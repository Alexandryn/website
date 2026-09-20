// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { site } from '../src/content/site.ts'

const publicDir = join(import.meta.dirname, '../public')
const fileFor = (src: string, ext: string) => join(publicDir, `${src.replace(/^\.\//, '')}.${ext}`)

/** Width and height from a PNG's IHDR chunk. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path)
  expect(bytes.subarray(1, 4).toString('latin1'), `${path} is a PNG`).toBe('PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe.each(Object.entries(site.screenshots))('screenshot %s', (_name, shot) => {
  it('exists as both a WebP and a PNG', () => {
    expect(existsSync(fileFor(shot.src, 'webp'))).toBe(true)
    expect(existsSync(fileFor(shot.src, 'png'))).toBe(true)
  })

  it('declares the dimensions the file really has, so the page cannot shift when it loads', () => {
    expect(pngSize(fileFor(shot.src, 'png'))).toEqual({ width: shot.width, height: shot.height })
  })

  it('is a real WebP file', () => {
    const bytes = readFileSync(fileFor(shot.src, 'webp'))
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('RIFF')
    expect(bytes.subarray(8, 12).toString('latin1')).toBe('WEBP')
  })

  it('stays small enough not to slow the page', () => {
    expect(readFileSync(fileFor(shot.src, 'webp')).length).toBeLessThan(120 * 1024)
  })
})

describe('the capture manifest', () => {
  const manifest = JSON.parse(readFileSync(join(publicDir, 'screenshots/screenshots.json'), 'utf8'))

  it('was captured from the version the page advertises', () => {
    expect(manifest.appVersion).toBe(site.version)
  })

  it('lists every screenshot the page uses', () => {
    const names = manifest.files.map((f: { name: string }) => f.name).sort()
    const used = Object.values(site.screenshots)
      .map((s) => s.src.split('/').pop())
      .sort()
    expect(names).toEqual(used)
  })
})
