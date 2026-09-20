import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { VIEWPORTS } from './viewports.ts'

for (const { name, width, height } of VIEWPORTS) {
  test(`no axe violations at ${width}px (${name})`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze()
    expect(
      results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
      ),
    ).toEqual([])
    // Guards against an axe run that silently checked nothing.
    expect(results.passes.length).toBeGreaterThan(10)
  })
}

test('has one h1 and never skips a heading level', async ({ page }) => {
  await page.goto('/')
  const levels = await page
    .locator('h1,h2,h3,h4,h5,h6')
    .evaluateAll((els) => els.map((el) => Number(el.tagName[1])))
  expect(levels[0]).toBe(1)
  expect(levels.filter((l) => l === 1)).toHaveLength(1)
  levels.forEach((level, i) => {
    if (i > 0) expect(level, `heading ${i + 1}`).toBeLessThanOrEqual(levels[i - 1]! + 1)
  })
})
