import { readdirSync, readFileSync, realpathSync } from 'node:fs'
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
  // The terminal panel: light text on the dark ink background.
  ['terminal-text', 'ink'],
  ['terminal-prompt', 'ink'],
  ['terminal-muted', 'ink'],
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

/** Replaces every non-newline character with a space, so line numbers survive. */
const blank = (text: string) => text.replace(/[^\n]/g, ' ')
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, blank)
const THEME_BLOCK = /@theme(?:\s+(?:static|inline|default))*\s*\{[^}]*\}/g

/**
 * Reads `--color-<name>: #rrggbb;` declarations out of the stylesheet's @theme
 * blocks. A colour it cannot measure (oklch, rgb(), 3-digit hex) is an error,
 * not a silent skip: a token the check cannot see is a token it cannot vouch for.
 */
export function parseThemeColors(css: string): Record<string, string> {
  const colors: Record<string, string> = {}
  for (const block of stripComments(css).matchAll(THEME_BLOCK)) {
    for (const decl of block[0].matchAll(/--color-([a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g)) {
      const value = decl[2]!.trim()
      if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
        throw new Error(
          `--color-${decl[1]} is "${value}"; only 6-digit hex can be contrast-checked`,
        )
      }
      colors[decl[1]!] = value.toLowerCase()
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

const SOURCE_FILE = /\.(tsx?|jsx?|css|html)$/
const TEST_FILE = /\.(test|spec)\./
// Book-cover colours are per-cover data, not theme tokens (see the comment in site.ts).
const DATA_FILE = /[\\/]content[\\/]site\.ts$/

/**
 * Finds every way a colour can reach the page other than the theme's allowed
 * text tokens: a text colour outside the allowlist (with any variant or
 * `!`), an opacity modifier that lowers an allowed colour's contrast, an
 * arbitrary `text-[...]` colour, a hex literal outside @theme, and a CSS
 * `color:` declaration using a token that is not allowed for text.
 * Returns `path:line: message` for each hit.
 */
export function findColourViolations(
  srcDir: string,
  colors: Record<string, string>,
  allowedText: readonly string[],
): string[] {
  const names = Object.keys(colors).sort((a, b) => b.length - a.length)
  const textToken = new RegExp(
    `(?<![\\w-])text-(${names.join('|')})(?:/(\\d+|\\[[^\\]]+\\]))?(?![\\w/-])`,
    'g',
  )
  const arbitrary = /(?<![\w-])text-\[(?:#|rgb|hsl|oklch|var\(--color-)[^\]]*\]/g
  const hex = /#[0-9a-fA-F]{6}\b/g
  const cssColor = /(?<![-\w])color\s*:\s*var\(--color-([a-z0-9-]+)\)/g

  const hits: string[] = []
  for (const entry of readdirSync(srcDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !SOURCE_FILE.test(entry.name) || TEST_FILE.test(entry.name)) continue
    const file = join(entry.parentPath, entry.name)
    const original = readFileSync(file, 'utf8')
    // The @theme block is where hex values are supposed to live.
    let scanned = file.endsWith('.css')
      ? stripComments(original).replace(THEME_BLOCK, blank)
      : original
    if (DATA_FILE.test(file)) scanned = scanned.replace(hex, blank)

    const report = (index: number, message: string) => {
      const line = scanned.slice(0, index).split('\n').length
      hits.push(`${file}:${line}: ${message}`)
    }

    for (const m of scanned.matchAll(textToken)) {
      const [, token, opacity] = m
      if (!allowedText.includes(token!)) {
        report(
          m.index,
          `${m[0]} is not an allowed text colour (allowed: ${allowedText.join(', ')})`,
        )
      } else if (opacity) {
        report(m.index, `${m[0]}: an opacity modifier lowers contrast below the checked pair`)
      }
    }
    for (const m of scanned.matchAll(arbitrary)) {
      report(m.index, `${m[0]} is an arbitrary text colour; use an allowed token`)
    }
    // Already reported above; don't report the hex inside an arbitrary value twice.
    for (const m of scanned.replace(arbitrary, blank).matchAll(hex)) {
      report(m.index, `hex colour ${m[0]} outside @theme; define it as a token`)
    }
    for (const m of scanned.matchAll(cssColor)) {
      if (!allowedText.includes(m[1]!)) {
        report(m.index, `color: var(--color-${m[1]}) is not an allowed text colour`)
      }
    }
  }
  return hits
}

function main(argv: string[]): number {
  const rootFlag = argv.indexOf('--root')
  const root = resolve(rootFlag >= 0 ? argv[rootFlag + 1]! : join(import.meta.dirname, '..'))
  const colors = parseThemeColors(readFileSync(join(root, 'src/styles/index.css'), 'utf8'))
  const allowedText = [...new Set(TEXT_PAIRS.map(([fg]) => fg))]
  const problems = [
    ...checkPairs(colors, TEXT_PAIRS),
    ...findColourViolations(join(root, 'src'), colors, allowedText),
  ]
  if (problems.length > 0) {
    console.error('check-contrast: failed')
    for (const problem of problems) console.error(`  ${problem}`)
    return 1
  }
  console.log(
    `check-contrast: ${TEXT_PAIRS.length} text pairs meet ${MIN_TEXT_CONTRAST}:1; text colours limited to ${allowedText.join(', ')}`,
  )
  return 0
}

// Compare real paths: a symlinked script path must still run, or the gate would
// pass silently without checking anything.
const entry = process.argv[1]
if (entry && realpathSync(resolve(entry)) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exitCode = main(process.argv.slice(2))
}
