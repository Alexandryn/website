import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { site } from './content/site.ts'
import { collect, forbiddenIn } from './test/content.ts'

const knownStrings = collect(site).map((entry) => entry.value)
const isKnown = (text: string) => knownStrings.some((known) => known.includes(text))

/** Text nodes and label attributes on the page that do not come from site.ts. */
function textNotFromSite(root: HTMLElement): string[] {
  const unknown: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? ''
    if (text && !/^[\s·—–|•]+$/.test(text) && !isKnown(text)) unknown.push(text)
  }
  for (const el of root.querySelectorAll('[aria-label],[alt],[title]')) {
    for (const attr of ['aria-label', 'alt', 'title']) {
      const value = el.getAttribute(attr)
      if (value && !isKnown(value)) unknown.push(`${attr}="${value}"`)
    }
  }
  return unknown
}

describe('App', () => {
  it('has one banner, one main, and one contentinfo landmark', () => {
    render(<App />)
    expect(screen.getAllByRole('banner')).toHaveLength(1)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
  })

  it('makes the skip link the first focusable element, pointing at the main landmark', () => {
    const { container } = render(<App />)
    const first = container.querySelector<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])',
    )
    expect(first).toHaveTextContent(site.nav.skipLabel)
    expect(first).toHaveAttribute('href', `#${site.anchors.main}`)
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', site.anchors.main)
    expect(main).toHaveAttribute('tabindex', '-1')
  })

  it('has one h1 and never skips a heading level', () => {
    const { container } = render(<App />)
    const levels = [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) =>
      Number(h.tagName[1]),
    )
    expect(levels[0]).toBe(1)
    expect(levels.filter((level) => level === 1)).toHaveLength(1)
    levels.forEach((level, i) => {
      if (i > 0) expect(level, `heading ${i + 1}`).toBeLessThanOrEqual(levels[i - 1]! + 1)
    })
  })

  it('has no placeholder links: every href is https or points at a real element', () => {
    const { container } = render(<App />)
    const anchors = [...container.querySelectorAll('a')]
    expect(anchors.length).toBeGreaterThan(10)
    for (const a of anchors) {
      const href = a.getAttribute('href') ?? ''
      if (href.startsWith('#')) {
        expect(href.length, `"${a.textContent}" links to a bare #`).toBeGreaterThan(1)
        expect(container.querySelector(`[id="${href.slice(1)}"]`), href).not.toBeNull()
      } else {
        expect(href, a.textContent ?? '').toMatch(/^https:\/\//)
      }
    }
  })

  it('renders no prose that is not in site.ts', () => {
    const { container } = render(<App />)
    expect(textNotFromSite(container)).toEqual([])
  })

  it('renders nothing the forbidden-claims list rejects', () => {
    const { container } = render(<App />)
    expect(forbiddenIn(container.textContent ?? '')).toEqual([])
  })

  it('the prose check itself catches hard-coded text (positive control)', () => {
    const div = document.createElement('div')
    div.innerHTML = '<p>Buy now</p><a aria-label="Secret label" href="#x">ok</a>'
    expect(textNotFromSite(div)).toEqual(['Buy now', 'aria-label="Secret label"'])
  })
})
