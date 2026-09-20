// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const srcDir = join(import.meta.dirname, '../src')

function sourceFiles(dir: string): Array<{ path: string; text: string }> {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && /\.(tsx?|css)$/.test(e.name) && !/\.(test|spec)\./.test(e.name))
    .map((e) => {
      const path = join(e.parentPath, e.name)
      return { path, text: readFileSync(path, 'utf8') }
    })
}

// Regex lookbehind is a SyntaxError in Safari before 16.4, and bundlers do not
// rewrite it, so one in the client bundle stops the whole script on those
// browsers. (The build scripts run on Node and may use it.)
const LOOKBEHIND = /\(\?<[=!]/

// CSS `content` text is invisible to the page-level prose test, so it must
// come from an explicit allowlist. The terminal prompt is the only one.
const CSS_CONTENT = /content-\[['"]/
const CSS_CONTENT_ALLOWED = ['TerminalPanel.tsx']

function violations(files: Array<{ path: string; text: string }>): string[] {
  const found: string[] = []
  for (const { path, text } of files) {
    if (LOOKBEHIND.test(text)) found.push(`${path}: regex lookbehind in browser code`)
    if (CSS_CONTENT.test(text) && !CSS_CONTENT_ALLOWED.some((name) => path.endsWith(name))) {
      found.push(`${path}: CSS content-[...] text outside the allowlist`)
    }
  }
  return found
}

describe('source rules for browser code', () => {
  it('finds source files to check', () => {
    expect(sourceFiles(srcDir).length).toBeGreaterThan(10)
  })

  it('has no regex lookbehind and no unlisted CSS content text in src', () => {
    expect(violations(sourceFiles(srcDir))).toEqual([])
  })

  it('catches both (positive controls)', () => {
    const problems = violations([
      { path: 'src/A.tsx', text: 'const r = /(?<=\\/)x/' },
      { path: 'src/B.tsx', text: 'const r = /(?<!a)b/' },
      { path: 'src/C.tsx', text: '<p className="before:content-[\'Buy\']" />' },
      { path: 'src/TerminalPanel.tsx', text: '<p className="before:content-[\'$_\']" />' },
    ])
    expect(problems).toHaveLength(3)
    expect(problems.join('\n')).not.toMatch(/TerminalPanel/)
  })
})
