// Captures the app's real UI against a sample library that this repo owns.
// See scripts/README.md for how it works and how to run it.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { site } from '../src/content/site.ts'
import { chromium, type BrowserContext, type Page, type Route } from '@playwright/test'

interface Work {
  id: string
  editionId: string
  title: string
  subtitle: string
  authors: string[]
  addedAt: string
}
interface Sample {
  collection: { id: string; name: string }
  readerBook: { workIndex: number; title: string; chapterTitle: string; paragraphs: string[] }
  works: Work[]
}

const root = resolve(import.meta.dirname, '..')
const sample = JSON.parse(readFileSync(join(root, 'scripts/sample-library.json'), 'utf8')) as Sample
const escapeXml = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

const CONTAINER = `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`
const book = sample.readerBook
const OPF = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">urn:sample:${book.title}</dc:identifier><dc:title>${escapeXml(book.title)}</dc:title><dc:language>en</dc:language></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="c1" href="chapter1.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/></spine></package>`
const NAV = `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol><li><a href="chapter1.xhtml">${escapeXml(book.chapterTitle)}</a></li></ol></nav></body></html>`
const CHAPTER = `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeXml(book.chapterTitle)}</title></head><body><h1>${escapeXml(book.chapterTitle)}</h1>${book.paragraphs.map((p) => `<p>${escapeXml(p)}</p>`).join('')}</body></html>`

const unhandled = new Set<string>()

/** Serves the whole API from the sample library. The app's own mock worker is blocked. */
async function mockApi(context: BrowserContext): Promise<void> {
  // A predicate, not a glob: `**/api/**` would also catch a source module such as /src/api/x.ts.
  await context.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const url = new URL(route.request().url())
      const path = url.pathname
      const method = route.request().method()
      const now = new Date().toISOString()

      if (path === '/api/bootstrap') {
        return json(route, {
          capabilities: {
            sources: true,
            import: true,
            settings: true,
            system: true,
            network: true,
          },
        })
      }
      if (path === '/api/v1/library') {
        return json(route, {
          works: sample.works.map((w) => ({
            id: w.id,
            title: w.title,
            subtitle: w.subtitle,
            authors: w.authors,
            isOwned: true,
            collections: [{ ...sample.collection, addedAt: w.addedAt }],
            addedAt: w.addedAt,
          })),
          nextCursor: null,
        })
      }
      const work = /^\/api\/v1\/works\/([^/]+)$/.exec(path)
      if (work) {
        const w = sample.works.find((x) => x.id === work[1])
        if (!w) return json(route, { code: 'not_found', message: 'no work with that id' }, 404)
        return json(route, {
          id: w.id,
          title: w.title,
          subtitle: w.subtitle,
          authors: w.authors,
          subjects: ['Fiction'],
          originalLanguage: 'en',
          ownedEditions: [
            { id: w.editionId, language: 'en', addedAt: w.addedAt, formats: ['epub'] },
          ],
          collections: [{ ...sample.collection, addedAt: w.addedAt }],
        })
      }
      if (path === '/api/v1/collections') {
        return json(route, {
          collections: [{ ...sample.collection, workCount: sample.works.length }],
        })
      }
      if (path.includes('/reader/content/')) {
        const file = decodeURIComponent(path.split('/reader/content/')[1] ?? '')
        const bodies: Record<string, string> = {
          'META-INF/container.xml': CONTAINER,
          'OEBPS/content.opf': OPF,
          'OEBPS/nav.xhtml': NAV,
          'OEBPS/chapter1.xhtml': CHAPTER,
        }
        const body = bodies[file]
        if (body === undefined) return json(route, { code: 'not_found' }, 404)
        return route.fulfill({ status: 200, contentType: 'application/xhtml+xml', body })
      }
      if (path.endsWith('/progress')) return json(route, { progress: null })
      if (path === '/api/v1/reading/preferences') {
        return json(route, {
          preferences: {
            font: 'serif',
            fontSize: 19,
            lineSpacing: 1.5,
            theme: 'light',
            layoutMode: 'paginated',
            columnWidth: 'default',
          },
        })
      }
      if (path.endsWith('/bookmarks')) return json(route, { bookmarks: [] })
      if (path.endsWith('/highlights')) return json(route, { highlights: [] })
      if (path === '/api/v1/auth/setup/status') return json(route, { isSetup: true })
      if (path === '/api/v1/libraries') {
        return json(route, {
          libraries: [
            {
              id: '00000000-0000-0000-0000-000000000001',
              name: 'Sample library',
              description: '',
              allowReaderUploads: false,
              createdAt: now,
              updatedAt: now,
            },
          ],
        })
      }
      unhandled.add(`${method} ${path}`)
      return json(route, { code: 'not_found', message: 'not part of the sample library' }, 404)
    },
  )
}

const WEBP_QUALITY = 0.86

/** Re-encodes PNG bytes as WebP with the browser's own encoder, so no image library is needed. */
async function toWebp(converter: Page, png: Buffer): Promise<Buffer> {
  const base64 = await converter.evaluate(
    async ({ data, quality }) => {
      const image = new Image()
      image.src = `data:image/png;base64,${data}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d')!.drawImage(image, 0, 0)
      const blob = await new Promise<Blob | null>((done) =>
        canvas.toBlob(done, 'image/webp', quality),
      )
      if (!blob) throw new Error('this browser cannot encode WebP')
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let binary = ''
      for (const byte of bytes) binary += String.fromCharCode(byte)
      return btoa(binary)
    },
    { data: png.toString('base64'), quality: WEBP_QUALITY },
  )
  return Buffer.from(base64, 'base64')
}

interface Shot {
  name: string
  width: number
  height: number
}
const written: Array<Shot & { png: number; webp: number }> = []

async function shoot(page: Page, converter: Page, shot: Shot, outDir: string): Promise<void> {
  const png = await page.screenshot({ type: 'png' })
  const webp = await toWebp(converter, png)
  writeFileSync(join(outDir, `${shot.name}.png`), png)
  writeFileSync(join(outDir, `${shot.name}.webp`), webp)
  written.push({ ...shot, png: png.length, webp: webp.length })
  console.log(
    `  ${shot.name}: ${shot.width}x${shot.height}, png ${(png.length / 1024).toFixed(0)} KiB, webp ${(webp.length / 1024).toFixed(0)} KiB`,
  )
}

async function main(): Promise<number> {
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  const outDir = join(root, 'public/screenshots')
  mkdirSync(outDir, { recursive: true })
  const reader = sample.works[sample.readerBook.workIndex]!

  const browser = await chromium.launch()
  try {
    const converter = await browser.newPage()
    const errors: string[] = []
    const views: Array<{ shot: Shot; path: string; ready: (page: Page) => Promise<void> }> = [
      {
        shot: { name: 'library-desktop', width: 1280, height: 800 },
        path: '/library',
        ready: (p) => p.getByText(sample.works[0]!.title).first().waitFor(),
      },
      {
        shot: { name: 'reader-desktop', width: 1280, height: 800 },
        path: `/read/${reader.id}/${reader.editionId}`,
        ready: (p) => p.frameLocator('iframe').getByText('Call me Ishmael').waitFor(),
      },
      {
        shot: { name: 'reader-phone', width: 390, height: 844 },
        path: `/read/${reader.id}/${reader.editionId}`,
        ready: (p) => p.frameLocator('iframe').getByText('Call me Ishmael').waitFor(),
      },
    ]

    console.log(`capturing from ${appUrl}`)
    for (const { shot, path, ready } of views) {
      const context = await browser.newContext({
        viewport: { width: shot.width, height: shot.height },
        deviceScaleFactor: 1,
        // The app's own mock worker would answer first; this repo's sample library must.
        serviceWorkers: 'block',
        reducedMotion: 'reduce',
      })
      await mockApi(context)
      const page = await context.newPage()
      page.on('pageerror', (e) => errors.push(`${shot.name}: ${e.message}`))
      await page.goto(`${appUrl}${path}`)
      await ready(page)
      await page.waitForTimeout(400)
      await shoot(page, converter, shot, outDir)
      await context.close()
    }

    writeFileSync(
      join(outDir, 'screenshots.json'),
      JSON.stringify(
        { appVersion: site.version, capturedAt: new Date().toISOString(), files: written },
        null,
        2,
      ) + '\n',
    )
    if (unhandled.size > 0)
      console.warn('API calls the sample library does not serve:', [...unhandled])
    if (errors.length > 0) {
      console.error('page errors:', errors)
      return 1
    }
  } finally {
    await browser.close()
  }
  return 0
}

process.exitCode = await main()
