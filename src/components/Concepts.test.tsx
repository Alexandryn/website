import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { Concepts } from './Concepts.tsx'

describe('Concepts', () => {
  it('shows each concept as a card with its title as an h2 and its body', () => {
    render(<Concepts concepts={site.concepts} />)
    for (const concept of site.concepts) {
      expect(screen.getByRole('heading', { level: 2, name: concept.title })).toBeInTheDocument()
      expect(screen.getByText(concept.body)).toBeInTheDocument()
    }
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3)
  })

  it('draws a decorative icon on every card, hidden from assistive technology', () => {
    const { container } = render(<Concepts concepts={site.concepts} />)
    const icons = container.querySelectorAll('svg')
    expect(icons).toHaveLength(3)
    for (const icon of icons) expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws a different icon for each concept', () => {
    const { container } = render(<Concepts concepts={site.concepts} />)
    const shapes = [...container.querySelectorAll('svg')].map((svg) => svg.innerHTML)
    expect(new Set(shapes).size).toBe(3)
  })
})
