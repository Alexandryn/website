import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { site } from '../content/site.ts'
import { Nav } from './Nav.tsx'

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  fireEvent.scroll(window)
}

afterEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})

const renderNav = () => render(<Nav name={site.name} nav={site.nav} />)

describe('Nav', () => {
  it('is the page banner with a labelled primary navigation', () => {
    renderNav()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: site.nav.ariaLabel })).toBeInTheDocument()
  })

  it('shows the wordmark, the nav links, and the download button', () => {
    renderNav()
    expect(screen.getByText(site.name)).toBeInTheDocument()
    for (const link of site.nav.links) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href)
    }
    expect(screen.getByRole('link', { name: site.nav.downloadLabel })).toHaveAttribute(
      'href',
      site.nav.downloadHref,
    )
  })

  it('is not scrolled at the top of the page', () => {
    renderNav()
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'false')
  })

  it('marks itself scrolled once the page scrolls, and clears it again at the top', () => {
    renderNav()
    const header = screen.getByRole('banner')
    scrollTo(40)
    expect(header).toHaveAttribute('data-scrolled', 'true')
    scrollTo(2)
    expect(header).toHaveAttribute('data-scrolled', 'false')
  })

  it('is scrolled immediately when mounted on an already-scrolled page', () => {
    Object.defineProperty(window, 'scrollY', { value: 300, configurable: true })
    renderNav()
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true')
  })

  it('listens for scroll passively and removes the listener on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderNav()

    const added = add.mock.calls.find(([type]) => type === 'scroll')
    expect(added).toBeDefined()
    expect(added![2]).toEqual({ passive: true })

    unmount()
    const removed = remove.mock.calls.find(([type]) => type === 'scroll')
    expect(removed?.[1]).toBe(added![1])
    add.mockRestore()
    remove.mockRestore()
  })
})
