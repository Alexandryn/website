import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { Docs } from './Docs.tsx'

const renderDocs = () => render(<Docs id={site.anchors.docs} docs={site.docs} />)

describe('Docs', () => {
  it('is the documentation section with an h2', () => {
    const { container } = renderDocs()
    expect(container.querySelector('section')).toHaveAttribute('id', site.anchors.docs)
    expect(screen.getByRole('heading', { level: 2, name: site.docs.heading })).toBeInTheDocument()
  })

  it('makes every guide a link whose text is its title and description', () => {
    renderDocs()
    for (const card of site.docs.cards) {
      const link = screen.getByRole('link', { name: new RegExp(`^${card.title}`) })
      expect(link).toHaveAttribute('href', card.href)
      expect(within(link).getByText(card.title)).toBeInTheDocument()
      expect(within(link).getByText(card.body)).toBeInTheDocument()
    }
    expect(screen.getAllByRole('link')).toHaveLength(site.docs.cards.length)
  })

  it('hides the decorative chevron from assistive technology', () => {
    const { container } = renderDocs()
    const chevrons = container.querySelectorAll('[data-chevron]')
    expect(chevrons).toHaveLength(site.docs.cards.length)
    for (const chevron of chevrons) expect(chevron).toHaveAttribute('aria-hidden', 'true')
  })
})
