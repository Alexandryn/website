import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { site } from '../content/site.ts'
import { Download } from './Download.tsx'

const renderDownload = () =>
  render(<Download id={site.anchors.download} download={site.download} links={site.links} />)

describe('Download', () => {
  it('is the download section, with an h2 and an eyebrow label', () => {
    const { container } = renderDownload()
    expect(container.querySelector('section')).toHaveAttribute('id', site.anchors.download)
    expect(
      screen.getByRole('heading', { level: 2, name: site.download.heading }),
    ).toBeInTheDocument()
    expect(screen.getByText(site.download.eyebrow)).toBeInTheDocument()
  })

  it('offers macOS, Windows, and Linux as three equal links to the release page', () => {
    renderDownload()
    for (const platform of site.download.platforms) {
      expect(screen.getByRole('link', { name: platform.label })).toHaveAttribute(
        'href',
        platform.href,
      )
    }
  })

  it('shows the version and links to the changelog', () => {
    renderDownload()
    expect(screen.getByText(site.download.versionLabel, { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: site.download.changelogLabel })).toHaveAttribute(
      'href',
      site.links.changelogUrl,
    )
  })

  it('warns that the installers are not yet code-signed', () => {
    renderDownload()
    expect(screen.getByText(site.download.signingNote)).toBeInTheDocument()
  })

  it('points Docker users at the self-hosting guide', () => {
    renderDownload()
    const link = screen.getByRole('link', { name: site.download.dockerLinkLabel })
    expect(link).toHaveAttribute('href', site.download.dockerHref)
    expect(link.closest('p')).toHaveTextContent(site.download.dockerLead.trim())
  })
})
