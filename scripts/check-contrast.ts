import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// WCAG 2.1 AA for normal-size text. Applied to every pair, including large
// text, so nothing depends on how big a heading happens to render.
const MIN_TEXT_CONTRAST = 4.5

// Every text-on-background combination the site is allowed to use. A pair
// that is not listed here is not allowed, so adding one is a reviewed change.
// ink-3 is deliberately absent: it is 2.66:1 on the page background and is
// reserved for non-text decoration.
export const TEXT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['ink', 'paper'],
  ['ink', 'surface'],
  ['ink', 'surface-alt'],
  ['ink-2', 'paper'],
  ['ink-2', 'surface'],
  ['ink-2', 'surface-alt'],
  ['accent', 'paper'],
  ['accent', 'surface'],
  ['accent', 'surface-alt'],
  ['on-accent', 'accent'],
  ['on-accent', 'accent-hover'],
]

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Reads `--color-<name>: #rrggbb;` declarations out of the stylesheet's @theme block. */
export function parseThemeColors(css: string): Record<string, string> {
  const colors: Record<string, string> = {}
  for (const block of css.matchAll(/@theme\s*\{([^}]*)\}/g)) {
    for (const decl of block[1]!.matchAll(/--color-([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
      colors[decl[1]!] = decl[2]!.toLowerCase()
    }
  }
  return colors
}

export function checkPairs(
  colors: Record<string, string>,
  pairs: ReadonlyArray<readonly [string, string]>,
): string[] {
  const failures: string[] = []
  for (const [fg, bg] of pairs) {
    const [fgHex, bgHex] = [colors[fg], colors[bg]]
    if (!fgHex || !bgHex) {
      failures.push(`${fg} on ${bg}: --color-${fgHex ? bg : fg} is not defined in @theme`)
      continue
    }
    const ratio = contrastRatio(fgHex, bgHex)
    if (ratio < MIN_TEXT_CONTRAST) {
      failures.push(`${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${MIN_TEXT_CONTRAST}:1`)
    }
  }
  return failures
}

/** Lists `path:line` for every use of the `text-<token>` utility under `dir`. */
export function findTokenTextUsage(dir: string, token: string): string[] {
  const pattern = new RegExp(`(?<![\\w-])text-${token}(?![\\w-])`)
  const hits: string[] = []
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.(tsx?|css)$/.test(entry.name)) continue
    const file = join(entry.parentPath, entry.name)
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (pattern.test(line)) hits.push(`${file}:${i + 1}`)
      })
  }
  return hits
}

function main(): number {
  const root = resolve(import.meta.dirname, '..')
  const colors = parseThemeColors(readFileSync(join(root, 'src/styles/index.css'), 'utf8'))
  const problems = [
    ...checkPairs(colors, TEXT_PAIRS),
    ...findTokenTextUsage(join(root, 'src'), 'ink-3').map(
      (hit) => `text-ink-3 used for text: ${hit}`,
    ),
  ]
  if (problems.length > 0) {
    console.error('check-contrast: failed')
    for (const problem of problems) console.error(`  ${problem}`)
    return 1
  }
  console.log(
    `check-contrast: ${TEXT_PAIRS.length} text pairs meet ${MIN_TEXT_CONTRAST}:1, ink-3 unused for text`,
  )
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main()
}
