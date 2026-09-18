import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  TEXT_PAIRS,
  checkPairs,
  contrastRatio,
  findTokenTextUsage,
  parseThemeColors,
} from './check-contrast.ts'

const themeCss = readFileSync(join(import.meta.dirname, '../src/styles/index.css'), 'utf8')

describe('contrastRatio', () => {
  it('is 21:1 for black on white and 1:1 for identical colours', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#41608f', '#41608f')).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#6e6b66', '#f6f5f2')).toBeCloseTo(contrastRatio('#f6f5f2', '#6e6b66'), 10)
  })
})

describe('parseThemeColors', () => {
  it('reads --color-* declarations from an @theme block', () => {
    const css =
      '@theme {\n  --color-ink: #1A1917;\n  --color-paper: #f6f5f2;\n  --font-sans: Geist;\n}'
    expect(parseThemeColors(css)).toEqual({ ink: '#1a1917', paper: '#f6f5f2' })
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

  it('keeps ink-3 out of the allowed text pairs because it fails AA', () => {
    expect(TEXT_PAIRS.some(([fg]) => fg === 'ink-3')).toBe(false)
    expect(contrastRatio(colors['ink-3']!, colors['paper']!)).toBeLessThan(4.5)
  })
})

describe('findTokenTextUsage', () => {
  it('finds text-ink-3 in source files and ignores other tokens', () => {
    const dir = mkdtempSync(join(tmpdir(), 'contrast-'))
    mkdirSync(join(dir, 'components'))
    writeFileSync(join(dir, 'components', 'Bad.tsx'), '<p className="text-ink-3">x</p>')
    writeFileSync(
      join(dir, 'components', 'Good.tsx'),
      '<p className="text-ink-2 border-ink-3">x</p>',
    )
    const hits = findTokenTextUsage(dir, 'ink-3')
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatch(/Bad\.tsx/)
  })
})
