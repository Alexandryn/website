import { describe, expect, it } from 'vitest'
import { site } from './site.ts'

function collect(value: unknown, key = ''): Array<{ key: string; value: string }> {
  if (typeof value === 'string') return [{ key, value }]
  if (Array.isArray(value)) return value.flatMap((item) => collect(item, key))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => collect(v, k))
  }
  return []
}

const strings = collect(site)
const prose = strings.filter(({ key }) => !['href', 'bg', 'fg'].includes(key))
const hrefs = strings.filter(({ key }) => key === 'href' || key.endsWith('Url'))

const has = (pattern: RegExp) => prose.some(({ value }) => pattern.test(value))

describe('copy the prototype got wrong stays out', () => {
  it.each([
    ['"no account" (Alexandryn has logins)', /no account/i],
    ['"Nothing leaves your home" (Open Library lookups are outbound)', /nothing leaves your home/i],
    ['the prototype version v0.9', /v?0\.9\.\d/],
    ['the placeholder example.com', /example\.com/],
  ])('has no %s', (_label, pattern) => {
    expect(has(pattern)).toBe(false)
  })

  it('has no exclamation marks', () => {
    expect(has(/!/)).toBe(false)
  })
})

describe('corrected statements are present', () => {
  const find = (pattern: RegExp) => prose.filter(({ value }) => pattern.test(value))

  it('mentions Docker in the hero subline', () => {
    expect(site.hero.subline).toMatch(/Docker/)
  })

  it('says a login is always required and TLS is needed for public setups', () => {
    const privacy = site.features.privacy.body
    expect(privacy).toMatch(/login/i)
    expect(privacy).toMatch(/TLS/)
  })

  it('discloses that Open Library is contacted', () => {
    expect(find(/Open Library/).length).toBeGreaterThan(0)
    expect(site.features.privacy.body).toMatch(/Open Library/)
  })

  it('says the installers are not yet code-signed', () => {
    expect(site.download.signingNote).toMatch(/not yet code-signed/)
  })
})

describe('version', () => {
  it('is 1.0.0 and every visible version string derives from it', () => {
    expect(site.version).toBe('1.0.0')
    expect(site.download.versionLabel).toBe(`v${site.version}`)
  })
})

describe('links', () => {
  it('has links to check', () => {
    expect(hrefs.length).toBeGreaterThan(10)
  })

  it('has no placeholder or empty links', () => {
    for (const { value } of hrefs) {
      expect(value, 'link is empty or "#"').not.toMatch(/^#?$/)
    }
  })

  it('uses https for every external link', () => {
    for (const { value } of hrefs.filter(({ value }) => !value.startsWith('#'))) {
      expect(value).toMatch(/^https:\/\//)
    }
  })

  it('points every in-page anchor at a section that exists', () => {
    const anchors = new Set(Object.values(site.anchors))
    for (const { value } of hrefs.filter(({ value }) => value.startsWith('#'))) {
      expect(anchors, value).toContain(value.slice(1))
    }
  })

  it('never points at the bare github.com host', () => {
    for (const { value } of hrefs) expect(value).not.toMatch(/^https:\/\/github\.com\/?$/)
  })
})

describe('structure', () => {
  it('lists the four guides plus the API contract in the docs section', () => {
    expect(site.docs.cards.map((c) => c.title)).toEqual([
      'Self-hosting',
      'Administration',
      'Security',
      'Updating',
      'API contract',
    ])
  })

  it('offers macOS, Windows, and Linux downloads', () => {
    expect(site.download.platforms.map((p) => p.name)).toEqual(['macOS', 'Windows', 'Linux'])
  })

  it('has three concepts, three steps, and four feature rows', () => {
    expect(site.concepts).toHaveLength(3)
    expect(site.howItWorks.steps).toHaveLength(3)
    expect(Object.keys(site.features)).toHaveLength(4)
  })

  it('uses only public-domain sample titles on the drawn book covers', () => {
    const allowed = [
      'Middlemarch',
      'Frankenstein',
      'Moby-Dick',
      'Pride and Prejudice',
      'Walden',
      'Jane Eyre',
      'Great Expectations',
      'Dracula',
      'Wuthering Heights',
      'The Picture of Dorian Gray',
    ]
    expect(site.books.map((b) => b.title).sort()).toEqual([...allowed].sort())
  })
})
