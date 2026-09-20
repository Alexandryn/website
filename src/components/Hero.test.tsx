import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { Hero } from './Hero.tsx'

const renderHero = () => render(<Hero hero={site.hero} screenshots={site.screenshots} />)
const { headlineLead, headlineEmphasis, headlineEnd } = site.hero

describe('Hero', () => {
  it('has exactly one h1 that reads as the headline', () => {
    renderHero()
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(h1.textContent).toBe(`${headlineLead}${headlineEmphasis}${headlineEnd}`)
  })

  it('underlines the emphasised words with a decorative mark', () => {
    renderHero()
    const emphasis = screen.getByText(headlineEmphasis, { exact: false })
    const mark = emphasis.querySelector('svg')
    expect(mark).not.toBeNull()
    expect(mark).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the subline, both calls to action, and the footnote', () => {
    renderHero()
    expect(screen.getByText(site.hero.subline)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: site.hero.primaryLabel })).toHaveAttribute(
      'href',
      site.hero.primaryHref,
    )
    expect(screen.getByRole('link', { name: site.hero.secondaryLabel })).toHaveAttribute(
      'href',
      site.hero.secondaryHref,
    )
    expect(screen.getByText(site.hero.footnote)).toBeInTheDocument()
  })

  it('shows the real library and phone screenshots in the device frames', () => {
    const { container } = renderHero()
    const mockup = container.querySelector('[data-device-mockup]')!
    expect(within(mockup as HTMLElement).getAllByRole('img')).toHaveLength(2)
    expect(screen.getByRole('img', { name: site.screenshots.library.alt })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: site.screenshots.readerPhone.alt })).toBeInTheDocument()
  })
})
