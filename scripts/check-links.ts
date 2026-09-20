import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const decode = (value: string) => value.replaceAll('&amp;', '&')

interface Anchor {
  href: string | undefined
  target: string | undefined
  rel: string
}

// A tag's attribute text: quoted values may contain ">", so they are matched whole.
const TAG_BODY = String.raw`((?:"[^"]*"|'[^']*'|[^>"'])*)`

function parseAttributes(text: string): Map<string, string> {
  const attrs = new Map<string, string>()
  const pattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  for (const attr of text.matchAll(pattern)) {
    attrs.set(attr[1]!.toLowerCase(), decode(attr[2] ?? attr[3] ?? attr[4] ?? ''))
  }
  return attrs
}

function anchors(html: string): Anchor[] {
  const found: Anchor[] = []
  // `<a` followed by whitespace or `>` so <abbr> and <article> do not match.
  for (const tag of html.matchAll(new RegExp(`<a(?=[\\s>])${TAG_BODY}>`, 'gi'))) {
    const attrs = parseAttributes(tag[1]!)
    found.push({
      href: attrs.get('href'),
      target: attrs.get('target')?.toLowerCase(),
      rel: attrs.get('rel')?.toLowerCase() ?? '',
    })
  }
  return found
}

const PLACEHOLDER_HOST = /(^|\.)example\.(com|org|net)$/i

/** One message per problem with the links and ids in built HTML; empty means clean. */
export function findLinkProblems(html: string): string[] {
  const problems: string[] = []
  const ids = [...html.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]!)
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) {
    problems.push(`duplicate id "${id}"`)
  }

  for (const { href, target, rel } of anchors(html)) {
    if (href === undefined) {
      problems.push('a link has no href')
      continue
    }
    if (href === '') problems.push('a link has an empty href')
    else if (href === '#') problems.push('a link points at a bare #')
    else if (href.startsWith('#')) {
      if (!ids.includes(href.slice(1))) problems.push(`${href} matches no element`)
    } else {
      let url: URL | undefined
      try {
        url = new URL(href)
      } catch {
        problems.push(`${href} is not an absolute URL`)
      }
      if (url) {
        if (url.protocol !== 'https:') {
          problems.push(
            `${href}: only https links (or #anchors) are allowed, found scheme ${url.protocol}`,
          )
        }
        if (PLACEHOLDER_HOST.test(url.hostname.replace(/\.$/, ''))) {
          problems.push(`${href} points at ${url.hostname}, a placeholder host`)
        }
      }
    }
    if (target === '_blank' && !/(^|\s)noopener(\s|$)/.test(rel)) {
      problems.push(`${href} opens a new tab without rel="noopener"`)
    }
  }
  return problems
}

const REQUEST_ATTRIBUTES = ['href', 'src', 'srcset', 'action', 'formaction', 'poster', 'data']
const ABSOLUTE = /^\s*(?:https?:)?\/\//i
const CSS_ABSOLUTE_URL = /url\(\s*(["']?)\s*((?:https?:)?\/\/[^)"']*)\1\s*\)/gi
const CSS_ABSOLUTE_IMPORT = /@import\s+(["'])\s*((?:https?:)?\/\/[^"']*)\1/gi

/**
 * Resources the page would fetch from another origin: anything but an <a> link
 * that points off-site, and any absolute url() in CSS. Links only navigate when
 * clicked, so they are not requests. SPEC success criterion 1: no third-party origin.
 */
export function findThirdPartyResources(source: string, kind: 'html' | 'css' = 'html'): string[] {
  const found: string[] = []
  if (kind === 'css') {
    for (const m of source.matchAll(CSS_ABSOLUTE_URL)) found.push(`url(${m[2]}) in CSS`)
    for (const m of source.matchAll(CSS_ABSOLUTE_IMPORT)) found.push(`@import ${m[2]} in CSS`)
    return found
  }
  for (const tag of source.matchAll(new RegExp(`<(?!a[\\s>])([a-z][\\w-]*)${TAG_BODY}>`, 'gi'))) {
    const attrs = parseAttributes(tag[2]!)
    if (tag[1]!.toLowerCase() === 'link' && /canonical/.test(attrs.get('rel') ?? '')) continue
    for (const name of REQUEST_ATTRIBUTES) {
      const value = attrs.get(name)
      if (value !== undefined && ABSOLUTE.test(value)) found.push(`<${tag[1]} ${name}="${value}">`)
    }
    for (const m of (attrs.get('style') ?? '').matchAll(CSS_ABSOLUTE_URL)) {
      found.push(`<${tag[1]} style> loads ${m[2]}`)
    }
  }
  return found
}

/** Each external https URL once, in page order, with anchors left out. */
export function externalUrls(html: string): string[] {
  const urls = anchors(html)
    .map((a) => a.href ?? '')
    .filter((href) => /^https?:\/\//.test(href))
  return [...new Set(urls)]
}

interface ReachOptions {
  timeoutMs?: number
  /** Tests serve from http://127.0.0.1; real runs only ever see https. */
  allowInsecure?: boolean
}

/** Requests every URL and reports the ones that do not answer 2xx (after redirects). */
export async function checkReachable(
  urls: string[],
  options: ReachOptions = {},
): Promise<string[]> {
  const timeoutMs = options.timeoutMs ?? 10_000
  const results = await Promise.all(
    urls.map(async (url): Promise<string | undefined> => {
      if (!options.allowInsecure && !url.startsWith('https://')) return `${url}: not https`
      try {
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(timeoutMs),
          headers: { 'user-agent': 'alexandryn-website-link-check' },
        })
        await response.body?.cancel()
        return response.ok ? undefined : `${url}: HTTP ${response.status}`
      } catch (error) {
        const reason =
          (error as Error).name === 'TimeoutError' ? 'timed out' : (error as Error).message
        return `${url}: ${reason}`
      }
    }),
  )
  return results.filter((r): r is string => r !== undefined)
}

async function main(argv: string[]): Promise<number> {
  const dirFlag = argv.indexOf('--dir')
  const dir = resolve(dirFlag >= 0 ? argv[dirFlag + 1]! : join(import.meta.dirname, '../dist'))
  let html: string
  try {
    html = readFileSync(join(dir, 'index.html'), 'utf8')
  } catch {
    console.error(`check-links: cannot read ${join(dir, 'index.html')}; run the build first`)
    return 1
  }
  const total = anchors(html).length
  if (total === 0) {
    console.error('check-links: the page has no links, which means the build is empty')
    return 1
  }
  const problems = findLinkProblems(html)
  for (const resource of findThirdPartyResources(html)) {
    problems.push(`third-party resource: ${resource}`)
  }
  const assets = join(dir, 'assets')
  const stylesheets = existsSync(assets)
    ? readdirSync(assets).filter((n) => n.endsWith('.css'))
    : []
  for (const name of stylesheets) {
    const css = readFileSync(join(assets, name), 'utf8')
    for (const resource of findThirdPartyResources(css, 'css')) {
      problems.push(`third-party resource: ${resource} (${name})`)
    }
  }
  if (argv.includes('--strict')) problems.push(...(await checkReachable(externalUrls(html))))
  if (problems.length > 0) {
    console.error('check-links: failed')
    for (const problem of problems) console.error(`  ${problem}`)
    return 1
  }
  console.log(
    `check-links: ${total} links ok${argv.includes('--strict') ? ' (all reachable)' : ''}`,
  )
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  process.exitCode = await main(process.argv.slice(2))
}
