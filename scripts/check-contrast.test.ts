// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { site } from '../src/content/site.ts'
import {
  TEXT_PAIRS,
  checkPairs,
  contrastRatio,
  findColourViolations,
  parseThemeColors,
} from './check-contrast.ts'

const scriptPath = join(import.meta.dirname, 'check-contrast.ts')
const themeCss = readFileSync(join(import.meta.dirname, '../src/styles/index.css'), 'utf8')
const allowedText = [...new Set(TEXT_PAIRS.map(([fg]) => fg))]

const temps: string[] = []
function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'contrast-'))
  temps.push(dir)
  return dir
}
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const THEME = `@theme {
  --color-paper: #f6f5f2;
  --color-surface: #ffffff;
  --color-surface-alt: #f1efeb;
  --color-ink: #1a1917;
  --color-ink-2: #6e6b66;
  --color-ink-3: #9c978f;
  --color-accent: #41608f;
  --color-accent-hover: #37517a;
  --color-on-accent: #ffffff;
  --color-warm: #b07c4f;
  --color-terminal-text: #dcd9d2;
  --color-terminal-prompt: #8faf8f;
  --color-terminal-muted: #9c978f;
}`

/** Builds a fixture `src/` with one component and the theme, returning its path. */
function fixtureSrc(component: string, extra: Record<string, string> = {}): string {
  const root = tempDir()
  const src = join(root, 'src')
  mkdirSync(join(src, 'styles'), { recursive: true })
  writeFileSync(join(src, 'styles', 'index.css'), `@import 'tailwindcss';\n${THEME}\n`)
  writeFileSync(join(src, 'App.tsx'), component)
  for (const [name, body] of Object.entries(extra)) writeFileSync(join(src, name), body)
  return src
}

describe('contrastRatio', () => {
  it('is 21:1 for black on white and 1:1 for identical colours', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#41608f', '#41608f')).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#6e6b66', '#f6f5f2')).toBeCloseTo(contrastRatio('#f6f5f2', '#6e6b66'), 10)
  })

  it('matches known mid-range values', () => {
    expect(contrastRatio('#6e6b66', '#f6f5f2')).toBeCloseTo(4.87, 1)
    expect(contrastRatio('#9c978f', '#f6f5f2')).toBeCloseTo(2.66, 1)
  })
})

describe('parseThemeColors', () => {
  it('reads --color-* declarations from an @theme block', () => {
    const css =
      '@theme {\n  --color-ink: #1A1917;\n  --color-paper: #f6f5f2;\n  --font-sans: Geist;\n}'
    expect(parseThemeColors(css)).toEqual({ ink: '#1a1917', paper: '#f6f5f2' })
  })

  it.each(['static', 'inline', 'static inline'])('reads an `@theme %s` block', (keyword) => {
    expect(parseThemeColors(`@theme ${keyword} { --color-ink: #1a1917; }`)).toEqual({
      ink: '#1a1917',
    })
  })

  it('ignores commented-out declarations', () => {
    const css = '@theme {\n  /* --color-old: #ffffff; */\n  --color-ink: #1a1917;\n}'
    expect(parseThemeColors(css)).toEqual({ ink: '#1a1917' })
  })

  it('throws on a colour it cannot measure instead of silently skipping it', () => {
    expect(() => parseThemeColors('@theme { --color-ink: oklch(20% 0 0); }')).toThrow(/ink/)
    expect(() => parseThemeColors('@theme { --color-ink: #fff; }')).toThrow(/ink/)
  })
})

describe('checkPairs', () => {
  const colors = { paper: '#f6f5f2', ink: '#1a1917', 'ink-3': '#9c978f' }

  it('passes a pair at or above 4.5:1', () => {
    expect(checkPairs(colors, [['ink', 'paper']])).toEqual([])
  })

  it('reports a pair below 4.5:1 with its ratio', () => {
    const failures = checkPairs(colors, [['ink-3', 'paper']])
    expect(failures).toHaveLength(1)
    expect(failures[0]).toMatch(/ink-3 on paper/)
    expect(failures[0]).toMatch(/2\.6\d:1/)
  })

  it('reports a pair that names a token the theme does not define', () => {
    expect(checkPairs(colors, [['nope', 'paper']])[0]).toMatch(/nope/)
  })
})

describe('the site theme', () => {
  const colors = parseThemeColors(themeCss)

  it('defines every colour the text pairs need', () => {
    for (const [fg, bg] of TEXT_PAIRS) {
      expect(colors[fg], `--color-${fg}`).toBeDefined()
      expect(colors[bg], `--color-${bg}`).toBeDefined()
    }
  })

  it('meets WCAG AA (4.5:1) for every allowed text pair', () => {
    expect(checkPairs(colors, TEXT_PAIRS)).toEqual([])
  })

  it('finds no colour violation anywhere in the real src tree', () => {
    const srcDir = join(import.meta.dirname, '../src')
    expect(findColourViolations(srcDir, colors, allowedText)).toEqual([])
  })

  it('keeps ink-3 out of the allowed text pairs because it fails AA', () => {
    expect(allowedText).not.toContain('ink-3')
    expect(contrastRatio(colors['ink-3']!, colors['paper']!)).toBeLessThan(4.5)
  })
})

describe('findColourViolations', () => {
  const colors = parseThemeColors(THEME)
  const check = (src: string) => findColourViolations(src, colors, allowedText)

  it('accepts allowed text colours, sizes, and decorative token use', () => {
    const src = fixtureSrc(
      '<p className="text-ink-2 text-sm hover:text-ink md:text-accent border-ink-3 bg-warm">x</p>',
    )
    expect(check(src)).toEqual([])
  })

  it.each([
    ['a plain use', 'text-ink-3'],
    ['a variant', 'hover:text-ink-3'],
    ['a breakpoint variant', 'md:text-ink-3'],
    ['an important modifier', '!text-ink-3'],
    ['an opacity modifier', 'text-ink-3/80'],
    ['a token that is not an allowed text colour', 'text-warm'],
  ])('flags %s', (_label, cls) => {
    expect(check(fixtureSrc(`<p className="${cls}">x</p>`))).toHaveLength(1)
  })

  it.each(['text-ink-2/60', 'text-accent/50'])(
    'flags opacity on an allowed colour (%s), which lowers contrast',
    (cls) => {
      const hits = check(fixtureSrc(`<p className="${cls}">x</p>`))
      expect(hits).toHaveLength(1)
      expect(hits[0]).toMatch(/opacity/i)
    },
  )

  it.each(['text-[#9c978f]', 'text-[rgb(156,151,143)]', 'text-[var(--color-ink-3)]'])(
    'flags the arbitrary text colour %s',
    (cls) => {
      expect(check(fixtureSrc(`<p className="${cls}">x</p>`))).toHaveLength(1)
    },
  )

  it('flags a hex colour outside the @theme block', () => {
    expect(check(fixtureSrc('<p style={{ color: "#9c978f" }}>x</p>'))).not.toHaveLength(0)
    expect(
      check(fixtureSrc('<p/>', { 'extra.css': '.a { border: 1px solid #ff0000 }' })),
    ).toHaveLength(1)
  })

  it('does not flag the hex values declared inside @theme', () => {
    expect(check(fixtureSrc('<p/>'))).toEqual([])
  })

  it('flags a css `color:` declaration that is not an allowed text colour', () => {
    const src = fixtureSrc('<p/>', { 'extra.css': '.a { color: var(--color-ink-3) }' })
    expect(check(src)).toHaveLength(1)
    const ok = fixtureSrc('<p/>', {
      'extra.css': '.a { color: var(--color-ink-2); border-color: var(--color-ink-3) }',
    })
    expect(check(ok)).toEqual([])
  })

  it('scans .jsx and .html as well as .ts, .tsx and .css', () => {
    expect(check(fixtureSrc('<p/>', { 'x.jsx': '<p className="text-ink-3">x</p>' }))).toHaveLength(
      1,
    )
    expect(check(fixtureSrc('<p/>', { 'x.html': '<p class="text-ink-3">x</p>' }))).toHaveLength(1)
  })

  it('ignores test files, which name the forbidden classes on purpose', () => {
    const src = fixtureSrc('<p/>', { 'x.test.tsx': 'expect(html).not.toContain("text-ink-3")' })
    expect(check(src)).toEqual([])
  })

  it('reports each hit with its file and line number', () => {
    const src = fixtureSrc('<p/>\n<p/>\n<p className="text-ink-3 text-warm">x</p>')
    const hits = check(src)
    expect(hits).toHaveLength(2)
    for (const hit of hits) expect(hit).toMatch(/App\.tsx:3/)
  })
})

describe('the CLI', () => {
  function run(root: string, script = scriptPath) {
    return spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' })
  }

  function fixtureRoot(component: string): string {
    const src = fixtureSrc(component)
    return join(src, '..')
  }

  it('exits 0 and says so when everything passes', () => {
    const result = run(fixtureRoot('<p className="text-ink-2">x</p>'))
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/check-contrast:/)
  })

  it('exits 1 and names the problem when text-ink-3 is used', () => {
    const result = run(fixtureRoot('<p className="text-ink-3">x</p>'))
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/text-ink-3/)
  })

  it('still runs, and still fails, when the script is reached through a symlink', () => {
    const linkDir = tempDir()
    const link = join(linkDir, 'scripts')
    symlinkSync(import.meta.dirname, link)
    const result = run(
      fixtureRoot('<p className="text-ink-3">x</p>'),
      join(link, 'check-contrast.ts'),
    )
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/check-contrast: failed/)
  })
})

describe('the drawn book covers', () => {
  it.each(site.books.map((b) => [b.title, b.fg, b.bg] as const))(
    '%s has readable title text (4.5:1)',
    (_title, fg, bg) => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5)
    },
  )
})
