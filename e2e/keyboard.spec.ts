import { expect, test } from '@playwright/test'

const FOCUSABLE = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])'

test('Tab reaches every link in document order and each focus is visible', async ({
  page,
  browserName,
}) => {
  // Safari does not Tab to links unless the OS setting is on, so only the
  // order-independent checks below run there.
  test.skip(browserName === 'webkit', 'Safari skips links when tabbing by default')
  await page.goto('/')
  const expected = await page
    .locator(FOCUSABLE)
    // A control hidden at this width (the menu button on a wide screen) is not a tab stop.
    .evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLElement).checkVisibility())
        .map((el) => el.getAttribute('href') ?? ''),
    )
  expect(expected.length).toBeGreaterThan(15)

  const visited: string[] = []
  for (let i = 0; i < expected.length; i++) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const cs = getComputedStyle(el)
      return {
        href: el.getAttribute('href') ?? '',
        // The base layer draws :focus-visible with a real outline.
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
      }
    })
    visited.push(info.href)
    expect(info.outline, `focus outline on ${info.href}`).toBe(true)
  }
  expect(visited).toEqual(expected)
})

test('the skip link moves focus to the main landmark', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Safari skips links when tabbing by default')
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toHaveText('Skip to content')
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
})

test('the header links scroll to their sections', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Download', exact: true }).first().click()
  await expect(page).toHaveURL(/#download$/)
  await expect(page.locator('#download')).toBeInViewport()
})
