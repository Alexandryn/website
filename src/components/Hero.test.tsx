import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { Hero } from './Hero.tsx'

const renderHero = () => render(<Hero hero={site.hero} books={site.books} />)
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

  it('draws 8 covers on the laptop and 4 on the phone', () => {
    const { container } = renderHero()
    const mockup = container.querySelector('[data-device-mockup]')!
    expect(mockup.querySelectorAll('[data-cover]')).toHaveLength(12)
    const laptop = mockup.querySelector('[data-device="laptop"]')!
    const phone = mockup.querySelector('[data-device="phone"]')!
    expect(laptop.querySelectorAll('[data-cover]')).toHaveLength(8)
    expect(phone.querySelectorAll('[data-cover]')).toHaveLength(4)
  })

  it('hides the whole decorative mockup from assistive technology', () => {
    const { container } = renderHero()
    expect(container.querySelector('[data-device-mockup]')).toHaveAttribute('aria-hidden', 'true')
    // The drawn covers carry no information the text does not; none may be reachable.
    expect(within(container).queryByRole('img')).toBeNull()
  })

  it('labels the phone mockup with the home-network label', () => {
    renderHero()
    expect(screen.getByText(site.hero.networkLabel)).toBeInTheDocument()
  })
})
