import { expect, test } from '@playwright/test'
import { VIEWPORTS } from './viewports.ts'

for (const { name, width, height } of VIEWPORTS) {
  test(`no horizontal scroll at ${width}px (${name})`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBe(0)
  })

  test(`nothing is clipped past the right edge at ${width}px (${name})`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll('main *, header *, footer *')]
        .filter((el) => !el.closest('[aria-hidden="true"]'))
        .filter(
          (el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5,
        )
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`),
    )
    expect(offenders).toEqual([])
  })
}

test('the terminal command wraps at path segments, not mid-word, at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/')
  const words = await page.locator('[data-terminal-line="command"]').evaluate((el) => {
    // Every rendered line's text, from client rects of each text piece.
    const range = document.createRange()
    const lines = new Map<number, string>()
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? ''
      for (let i = 0; i < text.length; i++) {
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const rect = range.getBoundingClientRect()
        const top = Math.round(rect.top)
        lines.set(top, (lines.get(top) ?? '') + text[i])
      }
    }
    return [...lines.values()]
  })
  // A break inside a word would leave a line not ending in "/" (except the last).
  for (const line of words.slice(0, -1))
    expect(line.trimEnd().endsWith('/') || line.endsWith(' ')).toBe(true)
})

test('motion is switched off when the visitor prefers reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const behavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  )
  expect(behavior).toBe('auto')
  // `transition-property: none` is what `motion-reduce:transition-none` sets.
  const properties = await page
    .locator('header')
    .evaluate((el) => getComputedStyle(el).transitionProperty)
  expect(properties).toBe('none')
})

test('smooth scrolling and the header transition are on when motion is not reduced', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  expect(
    await page.locator('header').evaluate((el) => getComputedStyle(el).transitionProperty),
  ).not.toBe('none')
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    'smooth',
  )
})
