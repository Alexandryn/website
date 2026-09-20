import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

// SPEC.md success criterion 8: the page's JavaScript stays at or under 90 KiB gzipped.
const DEFAULT_LIMIT_KIB = 90

/** Total gzipped size of every .js file under `<dir>/assets`. Throws if there is none. */
export function gzippedScriptBytes(dir: string): number {
  const assets = join(dir, 'assets')
  const scripts = readdirSync(assets).filter((name) => name.endsWith('.js'))
  if (scripts.length === 0) throw new Error(`no .js files under ${assets}`)
  return scripts.reduce((sum, name) => sum + gzipSync(readFileSync(join(assets, name))).length, 0)
}

function main(argv: string[]): number {
  const value = (flag: string) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined)
  const dir = resolve(value('--dir') ?? join(import.meta.dirname, '../dist'))
  const limitKib = Number(value('--limit-kib') ?? DEFAULT_LIMIT_KIB)
  if (!Number.isFinite(limitKib) || limitKib <= 0) {
    console.error('check-bundle-size: --limit-kib must be a positive number')
    return 1
  }
  let bytes: number
  try {
    bytes = gzippedScriptBytes(dir)
  } catch (error) {
    console.error(`check-bundle-size: ${(error as Error).message}`)
    return 1
  }
  const kib = bytes / 1024
  if (kib > limitKib) {
    console.error(
      `check-bundle-size: ${kib.toFixed(2)} KiB gzipped, over the ${limitKib} KiB limit`,
    )
    return 1
  }
  console.log(`check-bundle-size: ${kib.toFixed(2)} KiB gzipped JS, limit ${limitKib} KiB`)
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  process.exitCode = main(process.argv.slice(2))
}
