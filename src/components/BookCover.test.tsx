import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BookCover } from './BookCover.tsx'

const book = { title: 'Middlemarch', bg: '#2a3550', fg: '#e8e4da' }

describe('BookCover', () => {
  it('paints the cover with the book colours', () => {
    const { container } = render(<BookCover book={book} size="hero" />)
    const cover = container.querySelector<HTMLElement>('[data-cover]')!
    expect(cover.style.backgroundColor).toBe('rgb(42, 53, 80)')
    expect(cover.style.color).toBe('rgb(232, 228, 218)')
  })

  it.each(['hero', 'feature'] as const)('shows the title on a %s cover', (size) => {
    const { getByText } = render(<BookCover book={book} size={size} />)
    expect(getByText('Middlemarch')).toBeInTheDocument()
  })

  it('shows no title on a phone cover, which is too small to read one', () => {
    const { queryByText } = render(<BookCover book={book} size="phone" />)
    expect(queryByText('Middlemarch')).toBeNull()
  })
})
