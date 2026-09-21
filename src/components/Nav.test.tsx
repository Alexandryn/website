import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('has a menu button, named from site.ts, that starts closed and points at the links', () => {
    renderNav()
    const button = screen.getByRole('button', { name: site.nav.menuLabel })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    const list = document.getElementById(button.getAttribute('aria-controls')!)
    expect(list).not.toBeNull()
    for (const link of site.nav.links) {
      expect(within(list!).getByRole('link', { name: link.label })).toBeInTheDocument()
    }
  })

  it('has one set of links, not a copy for the menu and another for the bar', () => {
    renderNav()
    for (const link of site.nav.links) {
      expect(screen.getAllByRole('link', { name: link.label })).toHaveLength(1)
    }
  })

  it('opens and closes with the menu button, and keeps aria-expanded in step', () => {
    renderNav()
    const button = screen.getByRole('button', { name: site.nav.menuLabel })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape and gives focus back to the button', () => {
    renderNav()
    const button = screen.getByRole('button', { name: site.nav.menuLabel })
    fireEvent.click(button)
    fireEvent.keyDown(button, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('closes when a link is chosen, since the page has just scrolled to it', () => {
    renderNav()
    const button = screen.getByRole('button', { name: site.nav.menuLabel })
    fireEvent.click(button)
    fireEvent.click(screen.getByRole('link', { name: site.nav.links[0]!.label }))
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes when the visitor taps outside the header', () => {
    render(
      <>
        <Nav name={site.name} nav={site.nav} />
        <p>elsewhere</p>
      </>,
    )
    const button = screen.getByRole('button', { name: site.nav.menuLabel })
    fireEvent.click(button)
    fireEvent.pointerDown(screen.getByText('elsewhere'))
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not close when the tap is inside the open menu on something that is not a link', () => {
    renderNav()
    const button = screen.getByRole('button', { name: site.nav.menuLabel })
    fireEvent.click(button)
    fireEvent.pointerDown(screen.getByRole('navigation'))
    expect(button).toHaveAttribute('aria-expanded', 'true')
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
