import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { Features } from './Features.tsx'

const renderFeatures = () => render(<Features features={site.features} books={site.books} />)

describe('Features: library view and read-on-any-device', () => {
  it('shows each row as an h2 title with its body text', () => {
    renderFeatures()
    for (const row of [site.features.library, site.features.devices]) {
      expect(screen.getByRole('heading', { level: 2, name: row.title })).toBeInTheDocument()
      expect(screen.getByText(row.body)).toBeInTheDocument()
    }
  })

  it('hides every illustration from assistive technology', () => {
    const { container } = renderFeatures()
    const visuals = container.querySelectorAll('[data-feature-visual]')
    expect(visuals.length).toBeGreaterThanOrEqual(2)
    for (const visual of visuals) expect(visual).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws the library panel with filter and sort chips, a count, and all ten covers', () => {
    const { container } = renderFeatures()
    const panel = container.querySelector<HTMLElement>('[data-visual="library"]')!
    expect(within(panel).getByText(site.features.library.filterLabel)).toBeInTheDocument()
    expect(within(panel).getByText(site.features.library.sortLabel)).toBeInTheDocument()
    expect(within(panel).getByText(site.features.library.countLabel)).toBeInTheDocument()
    expect(panel.querySelectorAll('[data-cover]')).toHaveLength(site.books.length)
  })

  it('says how many books it draws, rather than an invented library size', () => {
    expect(site.features.library.countLabel).toBe(`${site.books.length} BOOKS`)
  })

  it('draws the desktop and phone reading panels from the same passage', () => {
    const { container } = renderFeatures()
    const panel = container.querySelector<HTMLElement>('[data-visual="devices"]')!
    const { desktopLabel, phoneLabel, desktopExcerpt, phoneExcerpt } = site.features.devices
    for (const text of [desktopLabel, phoneLabel, desktopExcerpt, phoneExcerpt]) {
      expect(within(panel).getByText(text)).toBeInTheDocument()
    }
  })

  it('quotes only the opening of Moby-Dick, which is public domain', () => {
    const { desktopExcerpt, phoneExcerpt } = site.features.devices
    expect(desktopExcerpt).toMatch(/^Call me Ishmael\./)
    expect(`${desktopExcerpt} ${phoneExcerpt}`).toMatch(
      /never mind how long precisely.*having little or no money/,
    )
  })

  it('flips the second row so its illustration comes first, as in the prototype', () => {
    const { container } = renderFeatures()
    const rows = container.querySelectorAll('[data-feature-row]')
    expect(rows[0]).toHaveClass('flex-wrap')
    expect(rows[1]).toHaveClass('flex-wrap-reverse')
  })
})

describe('Features: privacy and open source', () => {
  it('shows both rows as h2 titles with their body text', () => {
    renderFeatures()
    for (const row of [site.features.privacy, site.features.openSource]) {
      expect(screen.getByRole('heading', { level: 2, name: row.title })).toBeInTheDocument()
      expect(screen.getByText(row.body)).toBeInTheDocument()
    }
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4)
  })

  it('draws the privacy illustration as one decorative graphic', () => {
    const { container } = renderFeatures()
    const visual = container.querySelector('[data-visual="privacy"]')!
    expect(visual.closest('[data-feature-visual]')).toHaveAttribute('aria-hidden', 'true')
    expect(visual.querySelector('svg')).not.toBeNull()
  })

  it('shows the clone command with a prompt, and the licence and note without one', () => {
    const { container } = renderFeatures()
    const panel = container.querySelector<HTMLElement>('[data-visual="terminal"]')!
    const { terminalCommand, terminalCaption, terminalNote } = site.features.openSource
    const command = within(panel).getByText(terminalCommand)
    expect(command).toHaveAttribute('data-terminal-line', 'command')
    expect(command.className).toContain("before:content-['$_']")
    for (const text of [terminalCaption, terminalNote]) {
      expect(within(panel).getByText(text).className).not.toContain('before:content')
    }
  })

  it('lets a long command wrap only after a slash, never mid-word', () => {
    const { container } = renderFeatures()
    const command = container.querySelector<HTMLElement>('[data-terminal-line="command"]')!
    // git clone https:// | github.com/ | Alexandryn/ | alexandryn.git
    expect(command.querySelectorAll('wbr')).toHaveLength(3)
    expect(command.className).not.toContain('break-all')
    expect(command.textContent).toBe(site.features.openSource.terminalCommand)
  })

  it('clones the real repository', () => {
    expect(site.features.openSource.terminalCommand).toBe(`git clone ${site.links.cloneUrl}`)
  })

  it('wraps the last row in reverse, like the second', () => {
    const { container } = renderFeatures()
    const rows = container.querySelectorAll('[data-feature-row]')
    expect(rows).toHaveLength(4)
    expect(rows[2]).toHaveClass('flex-wrap')
    expect(rows[3]).toHaveClass('flex-wrap-reverse')
  })
})
