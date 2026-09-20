import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { DeviceMockup } from './DeviceMockup.tsx'

const { library, readerPhone } = site.screenshots
const renderMockup = () => render(<DeviceMockup library={library} phone={readerPhone} />)

describe('DeviceMockup', () => {
  it('shows the library on the laptop and the reader on the phone', () => {
    const { container } = renderMockup()
    const laptop = container.querySelector<HTMLElement>('[data-device="laptop"]')!
    const phone = container.querySelector<HTMLElement>('[data-device="phone"]')!
    expect(within(laptop).getByRole('img', { name: library.alt })).toBeInTheDocument()
    expect(within(phone).getByRole('img', { name: readerPhone.alt })).toBeInTheDocument()
  })

  it('exposes both images to assistive technology, since they now carry real content', () => {
    const { container } = renderMockup()
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('loads both eagerly, because they sit in the first screen', () => {
    const { container } = renderMockup()
    for (const img of container.querySelectorAll('img')) {
      expect(img).toHaveAttribute('loading', 'eager')
    }
  })

  it('draws no book covers of its own any more', () => {
    const { container } = renderMockup()
    expect(container.querySelector('[data-cover]')).toBeNull()
  })
})
