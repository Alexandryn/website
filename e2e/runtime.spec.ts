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

test('the strict policy still lets the drawn covers keep their colours', async ({ page }) => {
  await page.goto('/')
  const backgrounds = await page
    .locator('[data-cover]')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
  expect(backgrounds.length).toBeGreaterThan(5)
  for (const colour of backgrounds) expect(colour).not.toBe('rgba(0, 0, 0, 0)')
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
