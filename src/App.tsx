import { Footer } from './components/Footer.tsx'
import { Nav } from './components/Nav.tsx'
import { site } from './content/site.ts'

export function App() {
  return (
    <>
      <a
        href={`#${site.anchors.main}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent focus:no-underline"
      >
        {site.nav.skipLabel}
      </a>
      <Nav name={site.name} nav={site.nav} />
      <main id={site.anchors.main} tabIndex={-1} className="outline-none" />
      <Footer name={site.name} footer={site.footer} />
    </>
  )
}
