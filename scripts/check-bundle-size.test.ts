// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { gzippedScriptBytes } from './check-bundle-size.ts'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function dist(files: Record<string, string | Buffer>): string {
  const dir = mkdtempSync(join(tmpdir(), 'size-'))
  dirs.push(dir)
  mkdirSync(join(dir, 'assets'), { recursive: true })
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body)
  return dir
}

describe('gzippedScriptBytes', () => {
  it('sums the gzipped size of every .js file under assets, and ignores other files', () => {
    const one = dist({ 'assets/a.js': 'a'.repeat(5000) })
    const two = dist({ 'assets/a.js': 'a'.repeat(5000), 'assets/b.js': 'b'.repeat(5000) })
    const withCss = dist({ 'assets/a.js': 'a'.repeat(5000), 'assets/a.css': 'c'.repeat(50_000) })
    expect(gzippedScriptBytes(two)).toBeGreaterThan(gzippedScriptBytes(one))
    expect(gzippedScriptBytes(withCss)).toBe(gzippedScriptBytes(one))
  })

  it('measures compressed size, not raw size', () => {
    const dir = dist({ 'assets/a.js': 'a'.repeat(100_000) })
    expect(gzippedScriptBytes(dir)).toBeLessThan(1000)
  })

  it('throws when there is no script to measure, rather than reporting zero', () => {
    expect(() => gzippedScriptBytes(dist({ 'assets/a.css': 'x' }))).toThrow(/no .js/i)
  })
})

describe('the CLI', () => {
  const run = (dir: string, ...args: string[]) =>
    spawnSync(
      process.execPath,
      [join(import.meta.dirname, 'check-bundle-size.ts'), '--dir', dir, ...args],
      { encoding: 'utf8' },
    )

  it('passes under the limit and prints the size', () => {
    const r = run(dist({ 'assets/a.js': 'x'.repeat(2000) }), '--limit-kib', '10')
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/check-bundle-size: .* KiB gzipped .* limit 10 KiB/)
  })

  it('fails over the limit', () => {
    // Random bytes do not compress, so 20 KB of them is about 20 KB gzipped.
    const r = run(dist({ 'assets/a.js': randomBytes(20_000) }), '--limit-kib', '10')
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/over the 10 KiB limit/)
  })

  it('defaults to the 90 KiB budget from the spec', () => {
    const r = run(dist({ 'assets/a.js': 'x' }))
    expect(r.stdout).toMatch(/limit 90 KiB/)
  })

  it('fails on a directory with no scripts', () => {
    expect(run(dist({})).status).toBe(1)
  })

  it('rejects --limit-kib given without a value instead of using the default', () => {
    expect(run(dist({ 'assets/a.js': 'x' }), '--limit-kib').status).toBe(1)
  })

  it('rejects a limit that is not a positive number', () => {
    expect(run(dist({ 'assets/a.js': 'x' }), '--limit-kib', 'abc').status).toBe(1)
  })
})
