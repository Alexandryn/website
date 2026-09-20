import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { site } from './content/site.ts'
import { collect, forbiddenIn } from './test/content.ts'

const normalise = (text: string) => text.replace(/\s+/g, ' ').trim()

const entries = collect(site)
const knownText = new Set(entries.map((entry) => normalise(entry.value)))
// Text the page composes from more than one site.ts string; each is listed here
// on purpose, so a new composition is a visible, reviewed change.
knownText.add(normalise(`${site.hero.headlineEmphasis}${site.hero.headlineEnd}`))
knownText.add(normalise(`${site.download.versionLabel} ·`))

const allowedHrefs = new Set(
  entries.filter((entry) => /(href|url)$/i.test(entry.key)).map((entry) => entry.value),
)

const LABEL_ATTRIBUTES = [
  'aria-label',
  'aria-description',
  'aria-roledescription',
  'alt',
  'title',
  'placeholder',
  'value',
]
const FOCUSABLE = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])'

/** Own text of every element, plus label-like attributes, that is not exactly a site.ts string. */
function textNotFromSite(root: Element): string[] {
  const unknown: string[] = []
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const own = normalise(
      [...el.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? '')
        .join(''),
    )
    if (own && !/^[·—–|•\s]+$/.test(own) && !knownText.has(own)) unknown.push(own)
    for (const attr of LABEL_ATTRIBUTES) {
      const value = el.getAttribute(attr)
      if (value && !knownText.has(normalise(value))) unknown.push(`${attr}="${value}"`)
    }
  }
  return unknown
}

/** Problems with the links under `root`: unknown targets, missing anchors, unsafe new tabs, duplicate ids. */
function linkProblems(root: Element, allowed: Set<string>): string[] {
  const problems: string[] = []
  for (const a of root.querySelectorAll('a')) {
    const href = a.getAttribute('href') ?? ''
    const name = normalise(a.textContent ?? '')
    if (href.startsWith('#')) {
      const targets = root.querySelectorAll(`[id="${href.slice(1)}"]`)
      if (href.length < 2) problems.push(`"${name}" links to a bare #`)
      else if (targets.length !== 1) problems.push(`${href} matches ${targets.length} elements`)
    } else if (!allowed.has(href)) {
      problems.push(`"${name}" links to ${href}, which is not in site.ts`)
    }
    if (a.getAttribute('target') === '_blank' && !/noopener/.test(a.getAttribute('rel') ?? '')) {
      problems.push(`"${name}" opens a new tab without rel="noopener"`)
    }
  }
  const ids = [...root.querySelectorAll('[id]')].map((el) => el.id)
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) {
    problems.push(`duplicate id "${id}"`)
  }
  return problems
}

/** aria-hidden does not remove a link or control from the tab order. */
function focusableInsideHidden(root: Element): string[] {
  const found: string[] = []
  for (const hidden of root.querySelectorAll('[aria-hidden="true"]')) {
    for (const el of [hidden, ...hidden.querySelectorAll(FOCUSABLE)]) {
      if (el.matches(FOCUSABLE)) found.push(`<${el.tagName.toLowerCase()}> inside aria-hidden`)
    }
  }
  return found
}

const accessibleName = (el: Element) =>
  normalise(el.getAttribute('aria-label') ?? el.textContent ?? '')

describe('App landmarks and structure', () => {
  it('has one banner, one main, and one contentinfo landmark', () => {
    render(<App />)
    expect(screen.getAllByRole('banner')).toHaveLength(1)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
  })

  it('points the skip link at the main landmark', () => {
    render(<App />)
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
})

describe('keyboard order', () => {
  it('reaches the skip link first, then the nav, and the footer last, all with names', () => {
    const { container } = render(<App />)
    const focusable = [...container.querySelectorAll(FOCUSABLE)]
    const names = focusable.map(accessibleName)

    expect(names[0]).toBe(site.nav.skipLabel)
    expect(names.slice(1, 4)).toEqual([
      ...site.nav.links.map((link) => link.label),
      site.nav.downloadLabel,
    ])
    const footerLabels = site.footer.columns.flat().map((link) => link.label)
    expect(names.slice(-footerLabels.length)).toEqual(footerLabels)
    for (const [i, name] of names.entries()) expect(name, `focusable #${i + 1}`).not.toBe('')
  })

  it('leaves nothing focusable inside an aria-hidden region', () => {
    const { container } = render(<App />)
    expect(focusableInsideHidden(container)).toEqual([])
  })
})

describe('links and ids', () => {
  it('links only to targets listed in site.ts or to elements that exist exactly once', () => {
    const { container } = render(<App />)
    expect(container.querySelectorAll('a').length).toBeGreaterThan(10)
    expect(linkProblems(container, allowedHrefs)).toEqual([])
  })
})

describe('prose', () => {
  it('renders no text or label that is not exactly a site.ts string', () => {
    const { container } = render(<App />)
    expect(textNotFromSite(container)).toEqual([])
  })

  it('renders nothing the forbidden-claims list rejects', () => {
    const { container } = render(<App />)
    expect(forbiddenIn(container.textContent ?? '')).toEqual([])
  })
})

describe('the guards themselves catch what they are for (positive controls)', () => {
  const dom = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html
    return div
  }

  it('flags hard-coded text, including short words that are substrings of site prose', () => {
    expect(textNotFromSite(dom('<p>Buy now</p><p>a</p><p>Down</p><a href="#x">e</a>'))).toEqual([
      'Buy now',
      'a',
      'Down',
      'e',
    ])
  })

  it('flags hard-coded label attributes, including placeholder and value', () => {
    const found = textNotFromSite(
      dom('<input placeholder="Enter key" value="x"><a aria-label="Secret" href="#x">ok</a>'),
    )
    expect(found).toEqual(
      expect.arrayContaining(['placeholder="Enter key"', 'value="x"', 'aria-label="Secret"']),
    )
  })

  it('flags an unlisted link, a missing anchor, a duplicate id, and a new tab without noopener', () => {
    const problems = linkProblems(
      dom(
        '<div id="a"></div><div id="a"></div>' +
          '<a href="https://evil.test/x">x</a><a href="#missing">y</a><a href="#a">z</a>' +
          '<a target="_blank" href="https://listed.test">w</a>',
      ),
      new Set(['https://listed.test']),
    ).join('\n')
    expect(problems).toMatch(/evil\.test.*not in site\.ts/)
    expect(problems).toMatch(/#missing matches 0 elements/)
    expect(problems).toMatch(/#a matches 2 elements/)
    expect(problems).toMatch(/duplicate id "a"/)
    expect(problems).toMatch(/without rel="noopener"/)
  })

  it('flags a link, a button, and an input hidden with aria-hidden but still tabbable', () => {
    expect(
      focusableInsideHidden(
        dom(
          '<div aria-hidden="true"><a href="https://x.test">Buy</a><button>b</button><input></div>',
        ),
      ),
    ).toHaveLength(3)
  })
})
