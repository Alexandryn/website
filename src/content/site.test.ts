import { describe, expect, it } from 'vitest'
import { collect, FORBIDDEN } from '../test/content.ts'
import { site } from './site.ts'

const isLinkKey = (key: string) => /(href|url)$/i.test(key)
const isColourKey = (key: string) => key === 'bg' || key === 'fg'

const ALLOWED_LINK_PREFIXES = [
  'https://github.com/Alexandryn/alexandryn',
  'https://alexandryn.github.io/docs/',
]

/** Returns one message per problem; an empty array means the content is acceptable. */
function auditContent(content: unknown, version: string, anchors: string[]): string[] {
  const problems: string[] = []
  const entries = collect(content)
  const prose = entries.filter(({ key }) => !isLinkKey(key) && !isColourKey(key))

  for (const { path, value } of prose) {
    for (const [label, pattern] of FORBIDDEN) {
      if (pattern.test(value)) problems.push(`${path}: contains ${label}`)
    }
    for (const found of value.match(/\bv?\d+\.\d+\.\d+\b/g) ?? []) {
      if (found.replace(/^v/, '') !== version)
        problems.push(`${path}: version ${found} is not ${version}`)
    }
  }

  for (const { path, value } of entries.filter(({ key }) => isLinkKey(key))) {
    if (value === '' || value === '#') problems.push(`${path}: empty or placeholder link`)
    else if (value.startsWith('#')) {
      if (!anchors.includes(value.slice(1))) problems.push(`${path}: no section "${value}"`)
    } else if (!ALLOWED_LINK_PREFIXES.some((prefix) => value.startsWith(prefix))) {
      problems.push(`${path}: ${value} is not on an allowed https origin`)
    }
  }
  return problems
}

const audit = (content: unknown) => auditContent(content, site.version, Object.values(site.anchors))

/** A deep copy of `site` with the string at `path` replaced. */
function withValue(path: string, value: string): unknown {
  const copy = structuredClone(site) as Record<string, unknown>
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let node: Record<string, unknown> = copy
  for (const part of parts.slice(0, -1)) node = node[part] as Record<string, unknown>
  node[parts.at(-1)!] = value
  return copy
}

describe('the real content', () => {
  it('passes the audit', () => {
    expect(audit(site)).toEqual([])
  })

  it('audits every link, including the camelCase *Href keys', () => {
    const links = collect(site).filter(({ key }) => isLinkKey(key))
    for (const key of ['primaryHref', 'secondaryHref', 'downloadHref', 'dockerHref']) {
      expect(
        links.some((l) => l.key === key),
        key,
      ).toBe(true)
    }
    expect(links.length).toBeGreaterThan(20)
  })
})

describe('the audit catches what it is for (positive controls)', () => {
  it.each([
    ['a "#" Docker link', 'download.dockerHref', '#', /empty or placeholder/],
    ['an http CTA link', 'hero.primaryHref', 'http://x', /allowed https origin/],
    [
      'a mistyped github host',
      'links.repoUrl',
      'https://gihub.com/Alexandryn/alexandryn',
      /allowed https origin/,
    ],
    ['an anchor to a missing section', 'nav.downloadHref', '#nope', /no section/],
    [
      'an example.com link in a docs card',
      'docs.cards[0].href',
      'https://example.com/x',
      /allowed https origin/,
    ],
    ['"no account"', 'hero.subline', 'Runs at home — no cloud, no account.', /no account/],
    ['"without an account"', 'hero.subline', 'Use it without an account.', /no account/],
    [
      '"Nothing ever leaves your home"',
      'features.privacy.body',
      'Nothing ever leaves your home.',
      /nothing/i,
    ],
    [
      '"Open Library is never contacted"',
      'features.privacy.body',
      'Open Library is never contacted.',
      /outside contact|never/i,
    ],
    [
      'an optional login',
      'features.privacy.body',
      'A login is optional and TLS is never needed.',
      /login|TLS/,
    ],
    [
      'a stray older version',
      'download.signingNote',
      'Since v0.8.1 the installers are unsigned.',
      /version v0\.8\.1/,
    ],
    [
      'a hard-coded wrong version',
      'howItWorks.steps[0].body',
      'Install 1.0.3 today.',
      /version 1\.0\.3/,
    ],
    ['an exclamation mark', 'download.heading', 'Ready to run your own library!', /exclamation/],
  ])('rejects %s', (_label, path, value, expected) => {
    const problems = audit(withValue(path, value))
    expect(problems.join('\n')).toMatch(expected)
  })
})

describe('load-bearing statements are present in full', () => {
  it('says Docker is an option in the hero', () => {
    expect(site.hero.subline).toMatch(/or on a home server with Docker/)
  })

  it('says a login is always required and public setups also need TLS', () => {
    expect(site.features.privacy.body).toMatch(/it always requires a login/)
    expect(site.features.privacy.body).toMatch(/a publicly reachable setup also requires TLS/)
  })

  it('discloses that Open Library is the one outside service contacted by default', () => {
    expect(site.features.privacy.body).toMatch(
      /By default the only outside service Alexandryn contacts is Open Library/,
    )
  })

  it('ties reading from other devices to the Docker setup, since the desktop app listens on its own computer only', () => {
    expect(site.hero.subline).toMatch(
      /With Docker, it is readable from any device on your home network/,
    )
    expect(site.howItWorks.steps[2]!.body).toMatch(/Docker/)
    expect(site.features.devices.body).toMatch(/Docker/)
  })

  it('does not promise a network-access switch, which the desktop app does not have', () => {
    const text = collect(site)
      .map((e) => e.value)
      .join(' ')
    expect(text).not.toMatch(/turn(ing)? (on )?network access|network access on/i)
  })

  it('says the server listens only on this machine until you expose it', () => {
    expect(site.features.privacy.body).toMatch(
      /only listens on your own machine until you choose to expose it/,
    )
  })

  it('says books are read from where they are, with no copy kept', () => {
    expect(site.features.openSource.body).toMatch(/reads your books from where they already are/)
    expect(site.features.openSource.body).toMatch(/does not keep its own copy/)
  })

  it('says the macOS installer is for Apple silicon only, since the release has no Intel build', () => {
    expect(site.download.platformNote).toMatch(/Apple silicon/)
    expect(site.download.platformNote).toMatch(/no Intel/i)
  })

  it('says the installers are not yet code-signed and the OS will warn', () => {
    expect(site.download.signingNote).toMatch(
      /^The installers are not yet code-signed, so macOS and Windows will warn you/,
    )
  })

  it('says "home network", not Wi-Fi, since a wired LAN works too', () => {
    const text = collect(site)
      .map((e) => e.value)
      .join(' ')
    expect(text).not.toMatch(/Wi-Fi/i)
  })
})

describe('version', () => {
  it('is 1.0.2 and the visible label derives from it', () => {
    expect(site.version).toBe('1.0.2')
    expect(site.download.versionLabel).toBe(`v${site.version}`)
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

  it('sends every documentation card and the Docker link to the docs site', () => {
    const hrefs = [...site.docs.cards.map((c) => c.href), site.download.dockerHref]
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/alexandryn\.github\.io\/docs\/.+\/$/)
  })

  it('points the API card at the API reference and the Docker link at the Docker guide', () => {
    expect(site.docs.cards.at(-1)!.href).toBe('https://alexandryn.github.io/docs/api/')
    expect(site.download.dockerHref).toBe(
      'https://alexandryn.github.io/docs/getting-started/run-with-docker/',
    )
  })

  it('no longer points the documentation cards at Markdown files or the raw spec on GitHub', () => {
    for (const { href } of site.docs.cards) expect(href).not.toMatch(/github\.com|\.md$|\.yaml$/)
    expect(site.download.dockerHref).not.toMatch(/github\.com|\.md$/)
  })

  it('offers macOS, Windows, and Linux downloads', () => {
    expect(site.download.platforms.map((p) => p.name)).toEqual(['macOS', 'Windows', 'Linux'])
  })

  it('reuses the shared links in the footer instead of repeating them', () => {
    const footerHrefs = site.footer.columns.flat().map((l) => l.href)
    for (const url of [site.links.changelogUrl, site.links.licenseUrl, site.links.securityUrl]) {
      expect(footerHrefs).toContain(url)
    }
  })

  it('has three concepts, three steps, and four feature rows', () => {
    expect(site.concepts).toHaveLength(3)
    expect(site.howItWorks.steps).toHaveLength(3)
    expect(Object.keys(site.features)).toHaveLength(4)
  })

  it('describes each screenshot in a sentence, without calling it a screenshot or an image', () => {
    for (const [name, shot] of Object.entries(site.screenshots)) {
      expect(shot.alt.length, name).toBeGreaterThan(30)
      expect(shot.alt, name).not.toMatch(/screenshot|image of|picture of/i)
    }
  })

  it('says the reader shows Moby-Dick, which is public domain', () => {
    expect(site.screenshots.readerDesktop.alt).toMatch(/Moby-Dick/)
    expect(site.screenshots.readerPhone.alt).toMatch(/Moby-Dick/)
  })
})
