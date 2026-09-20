import { expect, test } from '@playwright/test'

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

test('every image loads under the strict policy and is not broken', async ({ page }) => {
  await page.goto('/')
  await page.locator('img').last().scrollIntoViewIfNeeded()
  await page.waitForLoadState('networkidle')
  const images = await page.locator('img').evaluateAll((els) =>
    els.map((el) => ({
      src: (el as HTMLImageElement).currentSrc,
      width: (el as HTMLImageElement).naturalWidth,
    })),
  )
  expect(images.length).toBe(5)
  for (const image of images) expect(image.width, image.src).toBeGreaterThan(0)
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
