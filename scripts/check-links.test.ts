// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  checkReachable,
  externalUrls,
  findLinkProblems,
  findThirdPartyResources,
} from './check-links.ts'

const page = (body: string) => `<html><body>${body}</body></html>`

describe('findLinkProblems', () => {
  it('accepts internal anchors that exist and external links with noopener', () => {
    const html = page(
      '<a href="#docs">d</a><section id="docs"></section>' +
        '<a href="https://github.com/x" target="_blank" rel="noopener noreferrer">g</a>' +
        '<a href="https://github.com/y">plain</a>',
    )
    expect(findLinkProblems(html)).toEqual([])
  })

  it.each([
    ['a bare #', '<a href="#">x</a>', /bare #/],
    ['an empty href', '<a href="">x</a>', /empty/],
    ['a link with no href', '<a>x</a>', /no href/],
    ['example.com', '<a href="https://example.com/a">x</a>', /example\.com/],
    ['a subdomain of example.org', '<a href="https://www.example.org/">x</a>', /example\.org/],
    ['a missing anchor target', '<a href="#nope">x</a>', /#nope/],
    ['a javascript: url', '<a href="javascript:void(0)">x</a>', /scheme/],
    ['an http (not https) link', '<a href="http://github.com/x">x</a>', /https/],
    ['a new tab without rel', '<a href="https://a.test/" target="_blank">x</a>', /noopener/],
    [
      'a new tab with an unrelated rel',
      '<a href="https://a.test/" target="_blank" rel="nofollow">x</a>',
      /noopener/,
    ],
    ['a duplicate id', '<div id="a"></div><div id="a"></div>', /duplicate id "a"/],
  ])('reports %s', (_label, body, expected) => {
    expect(findLinkProblems(page(body)).join('\n')).toMatch(expected)
  })

  it('reads attributes in any order and decodes &amp; in hrefs', () => {
    const html = page(
      '<a rel="noopener" target="_blank" class="x" href="https://a.test/?a=1&amp;b=2">x</a>',
    )
    expect(findLinkProblems(html)).toEqual([])
    expect(externalUrls(html)).toEqual(['https://a.test/?a=1&b=2'])
  })

  it.each([
    ['an upper-case tag and attribute', '<A HREF="https://example.com/">x</A>', /example\.com/],
    [
      'single-quoted attributes',
      `<a href='https://a.test/' target='_blank' rel='nofollow'>x</a>`,
      /noopener/,
    ],
    ['an upper-case _BLANK', '<a href="https://a.test/" target="_BLANK">x</a>', /noopener/],
    [
      'a ">" inside an earlier attribute',
      '<a title="a>b" href="https://a.test/" target="_blank">x</a>',
      /noopener/,
    ],
    ['a trailing-dot placeholder host', '<a href="https://example.com./">x</a>', /example\.com/],
    ['an unquoted href', '<a href=https://example.com/x>x</a>', /example\.com/],
  ])('still catches %s', (_label, body, expected) => {
    expect(findLinkProblems(page(body)).join('\n')).toMatch(expected)
  })

  it('accepts a single-quoted new tab that has noopener', () => {
    expect(
      findLinkProblems(page(`<a href='https://a.test/' target='_blank' rel='noopener'>x</a>`)),
    ).toEqual([])
  })

  it('does not mistake <abbr> or <article> for links', () => {
    expect(findLinkProblems(page('<abbr>x</abbr><article></article>'))).toEqual([])
  })

  it('finds nothing to check in a page with no links, which the CLI treats as an error', () => {
    expect(externalUrls(page('<p>hi</p>'))).toEqual([])
  })
})

describe('findThirdPartyResources', () => {
  it('accepts same-origin and relative resources', () => {
    const html =
      '<link rel="stylesheet" href="./assets/a.css"><script type="module" src="./assets/a.js"></script>'
    expect(findThirdPartyResources(html)).toEqual([])
  })

  it.each([
    [
      'a stylesheet',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist">',
    ],
    ['a script', '<script src="https://cdn.test/x.js"></script>'],
    ['a protocol-relative script', '<script src="//cdn.test/x.js"></script>'],
    ['an image', '<img src="https://img.test/a.png" alt="">'],
    ['an iframe', '<iframe src="https://embed.test/"></iframe>'],
    ['a preconnect hint', '<link rel="preconnect" href="https://fonts.gstatic.com">'],
    ['a form action', '<form action="https://collect.test/"></form>'],
    ['a single-quoted script', `<script src='https://cdn.test/x.js'></script>`],
    ['an inline style url', '<div style="background:url(https://img.test/a.png)"></div>'],
  ])('reports %s', (_label, html) => {
    expect(findThirdPartyResources(html)).not.toEqual([])
  })

  it('reports an absolute url in a stylesheet', () => {
    expect(findThirdPartyResources('@import url(https://x.test/a.css);', 'css')).not.toEqual([])
    expect(findThirdPartyResources('a{background:url("//x.test/a.png")}', 'css')).not.toEqual([])
    expect(findThirdPartyResources('a{src:url(./f.woff2)}', 'css')).toEqual([])
    // The SVG namespace in a data: URI is not a request.
    expect(
      findThirdPartyResources(
        'a{background:url("data:image/svg+xml;xmlns=http://www.w3.org")}',
        'css',
      ),
    ).toEqual([])
  })

  it('does not count links, which only navigate when clicked', () => {
    expect(findThirdPartyResources('<a href="https://github.com/x">x</a>')).toEqual([])
  })
})

describe('externalUrls', () => {
  it('lists each external https URL once, and leaves anchors out', () => {
    const html = page(
      '<a href="#a">a</a><a href="https://a.test/x">1</a><a href="https://a.test/x">2</a><a href="https://b.test/">3</a>',
    )
    expect(externalUrls(html)).toEqual(['https://a.test/x', 'https://b.test/'])
  })
})

describe('checkReachable (strict mode)', () => {
  let server: Server | undefined
  afterEach(() => void server?.close())

  async function serve(handler: (path: string) => number): Promise<string> {
    server = createServer((req, res) => {
      res.statusCode = handler(req.url ?? '/')
      if (res.statusCode === 301) res.setHeader('location', '/ok')
      res.end()
    })
    await new Promise<void>((done) => server!.listen(0, '127.0.0.1', done))
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  }

  it('passes 2xx and followed redirects, and reports 404, 5xx, and refused connections', async () => {
    const base = await serve((p) =>
      p === '/ok' ? 200 : p === '/moved' ? 301 : p === '/boom' ? 503 : 404,
    )
    const problems = await checkReachable(
      [`${base}/ok`, `${base}/moved`, `${base}/gone`, `${base}/boom`, 'http://127.0.0.1:1/'],
      { timeoutMs: 2000, allowInsecure: true },
    )
    const text = problems.join('\n')
    expect(text).toMatch(/\/gone.*404/)
    expect(text).toMatch(/\/boom.*503/)
    expect(text).toMatch(/127\.0\.0\.1:1/)
    expect(text).not.toMatch(/\/ok|\/moved/)
  })

  it('reports a request that outlives the timeout', async () => {
    server = createServer(() => {})
    await new Promise<void>((done) => server!.listen(0, '127.0.0.1', done))
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
    const problems = await checkReachable([url], { timeoutMs: 200, allowInsecure: true })
    expect(problems.join()).toMatch(/timed out|abort/i)
    server.closeAllConnections()
  })
})

describe('the CLI', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  })
  const run = (html: string | null, ...args: string[]) => {
    const dir = mkdtempSync(join(tmpdir(), 'links-'))
    dirs.push(dir)
    mkdirSync(join(dir, 'dist'))
    if (html !== null) writeFileSync(join(dir, 'dist/index.html'), html)
    const cssAt = args.indexOf('--css')
    if (cssAt >= 0) {
      mkdirSync(join(dir, 'dist/assets'))
      writeFileSync(join(dir, 'dist/assets/a.css'), args[cssAt + 1]!)
      args = args.filter((_, i) => i !== cssAt && i !== cssAt + 1)
    }
    return spawnSync(
      process.execPath,
      [join(import.meta.dirname, 'check-links.ts'), '--dir', join(dir, 'dist'), ...args],
      { encoding: 'utf8' },
    )
  }

  it('exits 0 for a clean page', () => {
    const r = run(page('<a href="#a">x</a><i id="a"></i><a href="https://a.test/">y</a>'))
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/check-links: 2 links/)
  })

  it('exits 1 and names each problem', () => {
    const r = run(page('<a href="#">x</a>'))
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/bare #/)
  })

  it('exits 1 when the build pulls in a third-party stylesheet or a css @import', () => {
    const link = '<a href="#a">x</a><i id="a"></i>'
    expect(
      run(page(`${link}<link rel="stylesheet" href="https://fonts.googleapis.com/x">`)).status,
    ).toBe(1)
    const r = run(page(link), '--css', '@import url(https://x.test/a.css);')
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/x\.test/)
  })

  it('exits 1 when the page is missing or has no links, so an empty build cannot pass', () => {
    expect(run(null).status).toBe(1)
    expect(run(page('<p>none</p>')).status).toBe(1)
  })
})
