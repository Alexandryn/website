import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { HowItWorks } from './HowItWorks.tsx'

describe('HowItWorks', () => {
  it('has an h2 heading', () => {
    render(<HowItWorks howItWorks={site.howItWorks} />)
    expect(
      screen.getByRole('heading', { level: 2, name: site.howItWorks.heading }),
    ).toBeInTheDocument()
  })

  it('lists the steps in order as a numbered list, each with an h3 title and body', () => {
    render(<HowItWorks howItWorks={site.howItWorks} />)
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(site.howItWorks.steps.length)
    site.howItWorks.steps.forEach((step, i) => {
      const item = items[i]!
      expect(within(item).getByText(step.number)).toBeInTheDocument()
      expect(within(item).getByRole('heading', { level: 3, name: step.title })).toBeInTheDocument()
      expect(within(item).getByText(step.body)).toBeInTheDocument()
    })
  })
})
