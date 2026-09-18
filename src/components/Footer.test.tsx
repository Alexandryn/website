import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { Footer } from './Footer.tsx'

const renderFooter = () => render(<Footer name={site.name} footer={site.footer} />)

describe('Footer', () => {
  it('is the page contentinfo landmark', () => {
    renderFooter()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('shows the name, the description, and the licence line', () => {
    renderFooter()
    expect(screen.getByText(site.name)).toBeInTheDocument()
    expect(screen.getByText(site.footer.description)).toBeInTheDocument()
    expect(screen.getByText(site.footer.licenseLine)).toBeInTheDocument()
  })

  it('lists every footer link in a labelled navigation', () => {
    renderFooter()
    const nav = screen.getByRole('navigation', { name: site.footer.ariaLabel })
    for (const link of site.footer.columns.flat()) {
      expect(within(nav).getByRole('link', { name: link.label })).toHaveAttribute('href', link.href)
    }
  })
})
