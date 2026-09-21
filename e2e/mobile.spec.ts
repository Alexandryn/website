import { expect, test } from '@playwright/test'
import { site } from '../src/content/site.ts'

const PHONES = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'small phone', width: 360, height: 740 },
  { name: 'phone', width: 390, height: 844 },
] as const

const MIN_TARGET = 44

for (const { name, width, height } of PHONES) {
  test.describe(`${name} (${width}px)`, () => {
    test.use({ viewport: { width, height } })

    test('the header is one compact row and stays at the top while scrolling', async ({ page }) => {
      await page.goto('/')
      const header = page.locator('header')
      expect((await header.boundingBox())!.height).toBeLessThanOrEqual(72)
      await page.evaluate(() => window.scrollTo(0, 1200))
      await page.waitForTimeout(150)
      expect((await header.boundingBox())!.y).toBe(0)
    })

    test('the brand, the menu button, and Download share that row without clipping', async ({
      page,
    }) => {
      await page.goto('/')
      const rects = await page.evaluate(() =>
        ['header span', 'header button', 'header a[href="#download"]'].map((sel) => {
          const r = document.querySelector(sel)!.getBoundingClientRect()
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
        }),
      )
      for (const r of rects) {
        expect(r.left).toBeGreaterThanOrEqual(0)
        expect(r.right).toBeLessThanOrEqual(width)
      }
      // They overlap vertically, so they are on one line.
      const [brand, menu, download] = rects
      for (const r of [menu!, download!]) {
        expect(r.top).toBeLessThan(brand!.bottom)
        expect(r.bottom).toBeGreaterThan(brand!.top)
      }
      expect(menu!.right).toBeLessThanOrEqual(download!.left + 1)
    })

    test('the links are behind the menu button until it is opened', async ({ page }) => {
      await page.goto('/')
      // getByRole skips display:none, so it would find the footer's link; go by the header.
      const links = site.nav.links.map((l) => page.locator('header a').filter({ hasText: l.label }))
      const menu = page.getByRole('button', { name: site.nav.menuLabel })
      await expect(menu).toHaveAttribute('aria-expanded', 'false')
      for (const link of links) await expect(link).toBeHidden()

      await menu.click()
      await expect(menu).toHaveAttribute('aria-expanded', 'true')
      for (const link of links) {
        await expect(link).toBeVisible()
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(MIN_TARGET)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0)
    })

    test('Escape closes the menu and returns focus to its button', async ({ page }) => {
      await page.goto('/')
      const menu = page.getByRole('button', { name: site.nav.menuLabel })
      await menu.click()
      await page.keyboard.press('Escape')
      await expect(menu).toHaveAttribute('aria-expanded', 'false')
      await expect(menu).toBeFocused()
    })

    test('choosing a link closes the menu and lands the section below the header', async ({
      page,
    }) => {
      await page.goto('/')
      await page.getByRole('button', { name: site.nav.menuLabel }).click()
      await page.getByRole('link', { name: site.nav.links[0]!.label, exact: true }).first().click()
      await expect(page.getByRole('button', { name: site.nav.menuLabel })).toHaveAttribute(
        'aria-expanded',
        'false',
      )
      await page.waitForTimeout(700)
      const { headerBottom, sectionTop } = await page.evaluate(() => ({
        headerBottom: document.querySelector('header')!.getBoundingClientRect().bottom,
        sectionTop: document.getElementById('docs')!.getBoundingClientRect().top,
      }))
      expect(sectionTop).toBeGreaterThanOrEqual(headerBottom - 1)
    })

    test('every button and link a thumb has to hit is at least 44px tall', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: site.nav.menuLabel }).click()
      const small = await page.evaluate((min) => {
        const found: string[] = []
        for (const el of document.querySelectorAll('header a, header button, footer a, main a')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          // Links inside a sentence are as tall as the line; the rule is for standalone targets.
          if (el.closest('p')) continue
          if (r.height < min)
            found.push(
              `${(el.textContent || el.getAttribute('aria-label') || '').trim()}: ${Math.round(r.height)}px`,
            )
        }
        return found
      }, MIN_TARGET)
      expect(small).toEqual([])
    })

    test('the phone in the hero overlaps the laptop instead of hanging below it', async ({
      page,
    }) => {
      await page.goto('/')
      const { laptop, phone } = await page.evaluate(() => {
        const box = (sel: string) => document.querySelector(sel)!.getBoundingClientRect()
        const l = box('[data-device="laptop"]')
        const p = box('[data-device="phone"]')
        return { laptop: { top: l.top, bottom: l.bottom }, phone: { top: p.top, bottom: p.bottom } }
      })
      expect(phone.top).toBeLessThan(laptop.bottom)
    })

    test('the desktop and phone readers are both big enough to see, and overlap', async ({
      page,
    }) => {
      await page.goto('/')
      const shots = await page.evaluate(() => {
        const imgs = [...document.querySelectorAll('[data-visual="devices"] img')]
        return imgs.map((el) => {
          const r = el.getBoundingClientRect()
          return { w: r.width, top: r.top, bottom: r.bottom }
        })
      })
      expect(shots).toHaveLength(2)
      expect(shots[0]!.w).toBeGreaterThanOrEqual(width - 60)
      expect(shots[1]!.w).toBeGreaterThanOrEqual(100)
      expect(shots[1]!.top).toBeLessThan(shots[0]!.bottom)
    })
  })
}

test.describe('tablet and desktop keep the inline bar', () => {
  test('at 768px the links sit in the header and the menu button is gone', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await expect(page.getByRole('button', { name: site.nav.menuLabel })).toBeHidden()
    for (const l of site.nav.links) {
      await expect(page.getByRole('link', { name: l.label, exact: true }).first()).toBeVisible()
    }
    expect((await page.locator('header').boundingBox())!.height).toBeLessThanOrEqual(72)
  })

  test('the three concept cards sit in one row from 768px and stack on a phone', async ({
    page,
  }) => {
    const columns = () =>
      page.evaluate(() => {
        const cards = [...document.querySelectorAll('main section')].find((s) =>
          s.textContent?.includes('Your metadata'),
        )!
        const tops = [...cards.querySelectorAll('h2, h3')].map((h) =>
          Math.round(h.getBoundingClientRect().top),
        )
        return new Set(tops).size
      })
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    expect(await columns()).toBe(1)
    await page.setViewportSize({ width: 375, height: 800 })
    expect(await columns()).toBe(3)
  })
})
