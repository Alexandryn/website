import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const decode = (value: string) => value.replaceAll('&amp;', '&')

interface Anchor {
  href: string | undefined
  target: string | undefined
  rel: string
}

function anchors(html: string): Anchor[] {
  const found: Anchor[] = []
  // `<a` followed by whitespace or `>` so <abbr> and <article> do not match.
  for (const tag of html.matchAll(/<a(?=[\s>])([^>]*)>/g)) {
    const attrs = new Map<string, string>()
    for (const attr of tag[1]!.matchAll(/([a-zA-Z][\w-]*)(?:="([^"]*)")?/g)) {
      attrs.set(attr[1]!.toLowerCase(), decode(attr[2] ?? ''))
    }
    found.push({
      href: attrs.get('href'),
      target: attrs.get('target'),
      rel: attrs.get('rel') ?? '',
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
        if (PLACEHOLDER_HOST.test(url.hostname)) {
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
