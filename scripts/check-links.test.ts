// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { externalUrls, findLinkProblems, checkReachable } from './check-links.ts'

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

  it('does not mistake <abbr> or <article> for links', () => {
    expect(findLinkProblems(page('<abbr>x</abbr><article></article>'))).toEqual([])
  })

  it('finds nothing to check in a page with no links, which the CLI treats as an error', () => {
    expect(externalUrls(page('<p>hi</p>'))).toEqual([])
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

  it('exits 1 when the page is missing or has no links, so an empty build cannot pass', () => {
    expect(run(null).status).toBe(1)
    expect(run(page('<p>none</p>')).status).toBe(1)
  })
})
