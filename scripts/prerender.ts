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

/** What the built page must contain for a reader without JavaScript. One message per gap. */
export function problemsWith(html: string): string[] {
  const problems: string[] = []
  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0
  if (h1s !== 1) problems.push(`expected one h1, found ${h1s}`)
  for (const heading of [site.howItWorks.heading, site.docs.heading, site.download.heading]) {
    if (!html.includes(heading)) problems.push(`missing heading "${heading}"`)
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

  const html = inject(readFileSync(pagePath, 'utf8'), render())
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
