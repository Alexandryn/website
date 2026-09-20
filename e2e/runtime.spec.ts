import { expect, test } from '@playwright/test'
import { site } from '../src/content/site.ts'

test('loads with no console errors, page errors, or CSP violations, and hydrates', async ({
  page,
}) => {
  const problems: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
  await page.goto('/')
  // The nav flips data-scrolled from the client, so this proves hydration ran.
  await page.evaluate(() => window.scrollTo(0, 200))
  await expect(page.locator('header')).toHaveAttribute('data-scrolled', 'true')
  expect(problems).toEqual([])
})

test('requests nothing from any origin but its own', async ({ page, baseURL }) => {
  const origins = new Set<string>()
  page.on('request', (r) => origins.add(new URL(r.url()).origin))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect([...origins]).toEqual([new URL(baseURL!).origin])
})

test('every image loads under the strict policy, in WebP and in the PNG fallback', async ({
  page,
}) => {
  await page.goto('/')
  const sources = await page.locator('picture').evaluateAll((pictures) =>
    pictures.map((picture) => ({
      webp: picture.querySelector('source')!.getAttribute('srcset')!,
      png: picture.querySelector('img')!.getAttribute('src')!,
    })),
  )
  expect(sources.length).toBe(Object.keys(site.screenshots).length + 2) // hero pair + feature reuse
  for (const { webp, png } of sources) {
    for (const path of [webp, png]) {
      const response = await page.request.get(new URL(path, page.url()).href)
      expect(response.status(), path).toBe(200)
      expect(response.headers()['content-type'], path).toMatch(/^image\//)
    }
  }
  // And the browser really decoded the ones it chose.
  await page.locator('img').last().scrollIntoViewIfNeeded()
  await page.waitForLoadState('networkidle')
  const widths = await page
    .locator('img')
    .evaluateAll((els) => els.map((el) => (el as HTMLImageElement).naturalWidth))
  for (const width of widths) expect(width).toBeGreaterThan(0)
})

test('has no inline style attributes, which the policy would block', async ({ page }) => {
  await page.goto('/')
  expect(await page.locator('[style]').count()).toBe(0)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the prerendered page still has its headings and links', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h2').first()).toBeVisible()
    expect(await page.locator('a[href]').count()).toBeGreaterThan(15)
    await expect(page.locator('header')).toBeVisible()
  })
})
