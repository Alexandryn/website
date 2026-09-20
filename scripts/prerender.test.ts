// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { site } from '../src/content/site.ts'
import { inject, problemsWith } from './prerender.ts'

const shell = '<!doctype html><html><body><div id="root"></div><script></script></body></html>'

describe('inject', () => {
  it('puts the markup inside #root and leaves the rest of the page alone', () => {
    const out = inject(shell, '<h1>Hi</h1>')
    expect(out).toBe(
      '<!doctype html><html><body><div id="root"><h1>Hi</h1></div><script></script></body></html>',
    )
  })

  it('refuses a page without an empty #root, rather than silently shipping no content', () => {
    expect(() => inject('<html></html>', '<p/>')).toThrow(/#root/)
    expect(() => inject('<div id="root"><p>x</p></div>', '<p/>')).toThrow(/#root/)
  })

  it('does not treat $ patterns in the markup as replacement syntax', () => {
    expect(inject(shell, '<p>$& $1 $$</p>')).toContain('<p>$& $1 $$</p>')
  })
})

describe('problemsWith (what the built page must contain without JavaScript)', () => {
  const good = [
    '<h1>A</h1>',
    ...[site.howItWorks.heading, site.docs.heading, site.download.heading].map(
      (h) => `<h2>${h}</h2>`,
    ),
    ...new Set(
      [
        ...site.nav.links,
        ...site.footer.columns.flat(),
        ...site.docs.cards,
        ...site.download.platforms,
      ].map((l) => `<a href="${l.href}">x</a>`),
    ),
  ].join('')

  it('accepts a page with the h1, the section headings, and every link', () => {
    expect(problemsWith(good)).toEqual([])
  })

  it('reports an empty page, a missing h1, a missing heading, and a missing link', () => {
    expect(problemsWith('<div id="root"></div>').length).toBeGreaterThan(3)
    expect(problemsWith(good.replace('<h1>', '<h3>')).join()).toMatch(/h1/)
    expect(problemsWith(good.replace(site.docs.heading, 'x')).join()).toMatch(/heading/)
    expect(problemsWith(good.replaceAll(site.docs.cards[0]!.href, '#')).join()).toMatch(/link/)
  })
})
