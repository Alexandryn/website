// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App.tsx'
import { site } from './content/site.ts'

// The page is prerendered with react-dom/server at build time, where there is
// no window or document. If anything touches them during render, this throws.
describe('App rendered on the server (no window, no document)', () => {
  it('has no browser globals to lean on', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })

  it('renders without throwing and produces the full page', () => {
    const html = renderToString(<App />)
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain(`id="${site.anchors.main}"`)
    expect(html).toContain(`id="${site.anchors.download}"`)
    expect(html).toContain(`id="${site.anchors.docs}"`)
    expect(html).toContain(site.nav.skipLabel)
    expect(html).toContain(site.hero.subline.replace(/&/g, '&amp;').slice(0, 30))
  })

  it('renders the nav as not scrolled, matching the first client render', () => {
    const html = renderToString(<App />)
    expect(html).toMatch(/<header[^>]*data-scrolled="false"/)
  })
})
