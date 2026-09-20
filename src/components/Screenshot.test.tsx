import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Screenshot } from './Screenshot.tsx'

const shot = { src: './screenshots/x', width: 1280, height: 800, alt: 'The library view' }

describe('Screenshot', () => {
  it('offers WebP first and falls back to the PNG', () => {
    const { container } = render(<Screenshot shot={shot} />)
    expect(container.querySelector('source')).toHaveAttribute('type', 'image/webp')
    expect(container.querySelector('source')).toHaveAttribute('srcset', './screenshots/x.webp')
    expect(container.querySelector('img')).toHaveAttribute('src', './screenshots/x.png')
  })

  it('has alt text and explicit dimensions, so it can be read and never shifts the layout', () => {
    const { container } = render(<Screenshot shot={shot} />)
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('alt', 'The library view')
    expect(img).toHaveAttribute('width', '1280')
    expect(img).toHaveAttribute('height', '800')
    expect(img).toHaveAttribute('decoding', 'async')
  })

  it('loads lazily by default, and eagerly when it is above the fold', () => {
    const lazy = render(<Screenshot shot={shot} />).container.querySelector('img')!
    expect(lazy).toHaveAttribute('loading', 'lazy')
    const eager = render(<Screenshot shot={shot} eager />).container.querySelector('img')!
    expect(eager).toHaveAttribute('loading', 'eager')
    expect(eager).toHaveAttribute('fetchpriority', 'high')
    expect(lazy).not.toHaveAttribute('fetchpriority')
  })

  it('scales down with its container and keeps its proportions', () => {
    const img = render(<Screenshot shot={shot} />).container.querySelector('img')!
    expect(img).toHaveClass('h-auto', 'w-full')
  })
})
