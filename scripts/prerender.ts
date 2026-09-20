import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { site } from '../src/content/site.ts'

const EMPTY_ROOT = '<div id="root"></div>'

/** Puts `markup` inside the page's empty #root. Throws if there is no empty #root to fill. */
export function inject(html: string, markup: string): string {
  if (html.split(EMPTY_ROOT).length !== 2) {
    throw new Error('index.html must contain exactly one empty #root element')
  }
  // A function replacer, so "$&" and friends in the markup stay literal.
  return html.replace(EMPTY_ROOT, () => `<div id="root">${markup}</div>`)
}

// A meta tag cannot set frame-ancestors, and GitHub Pages sends no headers, so this is
// defence in depth for a page that has no inputs. Inline styles are allowed only as
// attributes, for the per-cover colours; script and <style> stay locked to same-origin files.
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self'",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

const escapeAttribute = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Adds the CSP and the description right after the charset tag, which must stay first. */
export function headTags(html: string, description: string): string {
  const charset = /<meta charset="[^"]*"\s*\/?>/i.exec(html)
  if (!charset)
    throw new Error('index.html must declare <meta charset> for the head tags to follow')
  const tags =
    `<meta http-equiv="Content-Security-Policy" content="${escapeAttribute(CSP)}" />` +
    `<meta name="description" content="${escapeAttribute(description)}" />`
  const end = charset.index + charset[0].length
  return html.slice(0, end) + tags + html.slice(end)
}

/** What the built page must contain for a reader without JavaScript. One message per gap. */
export function problemsWith(html: string): string[] {
  const problems: string[] = []
  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0
  if (h1s !== 1) problems.push(`expected one h1, found ${h1s}`)
  for (const heading of [site.howItWorks.heading, site.docs.heading, site.download.heading]) {
    // Matched as a heading: "Documentation" is also the nav and footer link text.
    if (!new RegExp(`<h2[^>]*>${escapeRegExp(heading)}</h2>`).test(html)) {
      problems.push(`missing heading "${heading}"`)
    }
  }
  if (/\s(?:src|href)="\/(?!\/)/.test(html)) {
    problems.push('asset paths must be relative so the page works under a Pages project path')
  }
  const hrefs = new Set(
    [
      ...site.nav.links,
      ...site.footer.columns.flat(),
      ...site.docs.cards,
      ...site.download.platforms,
    ].map((link) => link.href),
  )
  for (const href of hrefs) {
    if (!html.includes(`href="${href}"`)) problems.push(`missing link ${href}`)
  }
  return problems
}

async function main(): Promise<number> {
  const root = resolve(import.meta.dirname, '..')
  const pagePath = join(root, 'dist/index.html')
  const serverEntry = pathToFileURL(join(root, 'dist-ssr/entry-server.js')).href
  const { render } = (await import(serverEntry)) as { render: () => string }

  const html = inject(headTags(readFileSync(pagePath, 'utf8'), site.meta.description), render())
  const problems = problemsWith(html)
  if (problems.length > 0) {
    console.error('prerender: the built page is incomplete')
    for (const problem of problems) console.error(`  ${problem}`)
    return 1
  }
  writeFileSync(pagePath, html)
  console.log(`prerender: wrote ${(html.length / 1024).toFixed(1)} KiB into dist/index.html`)
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  process.exitCode = await main()
}
