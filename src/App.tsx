import { Concepts } from './components/Concepts.tsx'
import { Features } from './components/Features.tsx'
import { Docs } from './components/Docs.tsx'
import { Download } from './components/Download.tsx'
import { Footer } from './components/Footer.tsx'
import { Hero } from './components/Hero.tsx'
import { HowItWorks } from './components/HowItWorks.tsx'
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
      <main id={site.anchors.main} tabIndex={-1} className="outline-none">
        <Hero hero={site.hero} screenshots={site.screenshots} />
        <Concepts concepts={site.concepts} />
        <HowItWorks howItWorks={site.howItWorks} />
        <Features features={site.features} screenshots={site.screenshots} />
        <Download id={site.anchors.download} download={site.download} links={site.links} />
        <Docs id={site.anchors.docs} docs={site.docs} />
      </main>
      <Footer name={site.name} footer={site.footer} />
    </>
  )
}
