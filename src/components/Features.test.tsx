import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { Features } from './Features.tsx'

const renderFeatures = () =>
  render(<Features features={site.features} screenshots={site.screenshots} />)

describe('Features: library view and read-on-any-device', () => {
  it('shows each row as an h2 title with its body text', () => {
    renderFeatures()
    for (const row of [site.features.library, site.features.devices]) {
      expect(screen.getByRole('heading', { level: 2, name: row.title })).toBeInTheDocument()
      expect(screen.getByText(row.body)).toBeInTheDocument()
    }
  })

  it('hides only the drawn privacy graphic from assistive technology', () => {
    const { container } = renderFeatures()
    const hidden = [...container.querySelectorAll('[data-feature-visual]')].filter(
      (el) => el.getAttribute('aria-hidden') === 'true',
    )
    expect(hidden).toHaveLength(1)
    expect(hidden[0]!.querySelector('[data-visual="privacy"]')).not.toBeNull()
  })

  it('shows the library screenshot with its alt text, lazily loaded below the fold', () => {
    const { container } = renderFeatures()
    const panel = container.querySelector<HTMLElement>('[data-visual="library"]')!
    const img = within(panel).getByRole('img', { name: site.screenshots.library.alt })
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('shows the reader on a desktop and on a phone, both with alt text and lazily loaded', () => {
    const { container } = renderFeatures()
    const panel = container.querySelector<HTMLElement>('[data-visual="devices"]')!
    for (const shot of [site.screenshots.readerDesktop, site.screenshots.readerPhone]) {
      const img = within(panel).getByRole('img', { name: shot.alt })
      expect(img).toHaveAttribute('loading', 'lazy')
    }
  })

  it('puts the illustration first in the second row only, as in the prototype', () => {
    const { container } = renderFeatures()
    const rows = container.querySelectorAll('[data-feature-row]')
    expect(rows[0]).toHaveAttribute('data-visual-first', 'false')
    expect(rows[1]).toHaveAttribute('data-visual-first', 'true')
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
    expect(command).toHaveAttribute('data-prompt', 'true')
    for (const text of [terminalCaption, terminalNote]) {
      expect(within(panel).getByText(text)).not.toHaveAttribute('data-prompt')
    }
  })

  it('offers a line-break opportunity after each path slash and keeps the text intact', () => {
    const { container } = renderFeatures()
    const command = container.querySelector<HTMLElement>('[data-terminal-line="command"]')!
    // git clone https:// | github.com/ | Alexandryn/ | alexandryn.git
    expect(command.querySelectorAll('wbr')).toHaveLength(3)
    expect(command.textContent).toBe(site.features.openSource.terminalCommand)
    // Whether it really wraps mid-word is a layout question; the 320px Playwright spec covers it.
  })

  it('leaves the clone command available to screen readers, since users would run it', () => {
    const { container } = renderFeatures()
    const panel = container.querySelector('[data-visual="terminal"]')!
    expect(panel.closest('[aria-hidden="true"]')).toBeNull()
    expect(panel.closest('[data-feature-visual]')).not.toHaveAttribute('aria-hidden')
  })

  it('clones the real repository', () => {
    expect(site.features.openSource.terminalCommand).toBe(`git clone ${site.links.cloneUrl}`)
  })

  it('puts the illustration first in the last row, like the second', () => {
    const { container } = renderFeatures()
    const rows = container.querySelectorAll('[data-feature-row]')
    expect(rows).toHaveLength(4)
    expect(rows[2]).toHaveAttribute('data-visual-first', 'false')
    expect(rows[3]).toHaveAttribute('data-visual-first', 'true')
  })
})
