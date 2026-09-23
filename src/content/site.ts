// Every user-facing string, link, and the version live here, and nowhere else.
// Components take these as props and contain no prose, so a wording change is a
// one-file edit and site.test.ts can check all of it in one place.
//
// Each claim was checked against the shipped software. If the software
// changes, change the claim here.

const version = '1.0.4'
const repo = 'https://github.com/Alexandryn/alexandryn'
const docsSite = 'https://alexandryn.github.io/docs'
const releases = `${repo}/releases`

const anchors = { main: 'main', docs: 'docs', download: 'download' } as const

const links = {
  repoUrl: repo,
  cloneUrl: `${repo}.git`,
  releasesUrl: releases,
  changelogUrl: `${repo}/blob/main/CHANGELOG.md`,
  licenseUrl: `${repo}/blob/main/LICENSE`,
  securityUrl: `${repo}/blob/main/SECURITY.md`,
} as const

export const site = {
  name: 'Alexandryn',
  version,
  anchors,

  meta: {
    description:
      'Alexandryn is a self-hosted digital library. Run it on your desktop, or on a home server with Docker to read your books from any device on your home network.',
  },

  links,

  nav: {
    ariaLabel: 'Primary',
    skipLabel: 'Skip to content',
    links: [
      { label: 'Documentation', href: `#${anchors.docs}` },
      { label: 'GitHub', href: repo },
    ],
    menuLabel: 'Menu',
    downloadLabel: 'Download',
    downloadHref: `#${anchors.download}`,
  },

  hero: {
    mascotLabel: 'Meet Alex, the library guardian',
    headlineLead: 'A library that lives ',
    headlineEmphasis: 'at home',
    headlineEnd: '.',
    subline:
      'Runs on your desktop, or on a home server with Docker. On the desktop, your library is on that computer. With Docker, it is readable from any device on your home network — no cloud service, no third-party account.',
    primaryLabel: 'Download',
    primaryHref: `#${anchors.download}`,
    secondaryLabel: 'Read the docs',
    secondaryHref: `#${anchors.docs}`,
    footnote: 'macOS, Windows, and Linux · Open source · AGPL-3.0',
  },

  concepts: [
    {
      icon: 'metadata',
      title: 'Your metadata',
      body: 'Titles, authors, covers and editions — sourced from Open Library, stored on your machine. No third-party account required.',
    },
    {
      icon: 'sources',
      title: 'Your sources',
      body: 'Point it at a folder of books or an OPDS catalog. Sources can change; your reading history stays with your library.',
    },
    {
      icon: 'library',
      title: 'Your library',
      body: "What you've read, what you're reading, and how far you've got, kept on your own server.",
    },
  ],

  howItWorks: {
    heading: 'How it works',
    steps: [
      {
        number: '01',
        title: 'Install',
        body: 'Download and open Alexandryn on your laptop or desktop, or run it on a home server with Docker.',
      },
      {
        number: '02',
        title: 'Add a source',
        body: 'Point it at a folder of books or an OPDS server.',
      },
      {
        number: '03',
        title: 'Read anywhere',
        body: 'On the desktop, read in the app. With Docker, publish the port to your home network and open the web reader on any device there.',
      },
    ],
  },

  features: {
    library: {
      title: 'Library view',
      body: 'Your books in one place. Filter, sort, and search without a cloud.',
    },
    devices: {
      title: 'Read on any device',
      body: 'Run Alexandryn on a home server with Docker, and pick up where you left off on your laptop, phone, or tablet, over your home network.',
    },
    privacy: {
      title: 'No cloud service',
      body: 'Your library and reading data stay on your own server. By default the only outside service Alexandryn contacts is Open Library, for book details. Alexandryn only listens on your own machine until you choose to expose it, it always requires a login, and a publicly reachable setup also requires TLS.',
    },
    openSource: {
      title: 'Open source',
      body: 'Licensed AGPL-3.0-or-later. Alexandryn reads your books from where they already are and does not keep its own copy, and your reading data can be exported.',
      terminalCommand: `git clone ${repo}.git`,
      terminalCaption: 'License: AGPL-3.0-or-later',
      terminalNote: 'Your books, your server.',
    },
  },

  download: {
    eyebrow: 'DOWNLOAD',
    heading: 'Ready to run your own library?',
    platforms: [
      { name: 'macOS', label: 'Download for macOS', href: `${releases}/latest` },
      { name: 'Windows', label: 'Download for Windows', href: `${releases}/latest` },
      { name: 'Linux', label: 'Download for Linux', href: `${releases}/latest` },
    ],
    versionLabel: `v${version}`,
    changelogLabel: 'Changelog',
    platformNote: 'The macOS installer is for Macs with Apple silicon; there is no Intel build.',
    signingNote:
      'The installers are not yet code-signed, so macOS and Windows will warn you the first time you open Alexandryn.',
    dockerLead: 'Prefer Docker? Read the ',
    dockerLinkLabel: 'self-hosting guide →',
    dockerHref: `${docsSite}/getting-started/run-with-docker/`,
  },

  docs: {
    heading: 'Documentation',
    cards: [
      {
        title: 'Self-hosting',
        body: 'Run Alexandryn with Docker: setup, first run, persistent data',
        href: `${docsSite}/getting-started/run-with-docker/`,
      },
      {
        title: 'Administration',
        body: 'Accounts, libraries, sources, and backups',
        href: `${docsSite}/admin/accounts-and-libraries/`,
      },
      {
        title: 'Security',
        body: 'How network access works, and what Alexandryn does not do',
        href: `${docsSite}/security/how-security-works/`,
      },
      {
        title: 'Updating',
        body: 'Pull a new version and check that it started',
        href: `${docsSite}/updating/update-alexandryn/`,
      },
      {
        title: 'API contract',
        body: 'The OpenAPI specification as browsable pages, for developers',
        href: `${docsSite}/api/`,
      },
    ],
  },

  footer: {
    ariaLabel: 'Footer',
    description:
      'A self-hosted digital library for your home network. Runs on your desktop or on a home server; a server is readable from any device on your network.',
    columns: [
      [
        { label: 'GitHub', href: repo },
        { label: 'Documentation', href: `#${anchors.docs}` },
      ],
      [
        { label: 'Changelog', href: links.changelogUrl },
        { label: 'License', href: links.licenseUrl },
        { label: 'Security', href: links.securityUrl },
      ],
    ],
    licenseLine: 'GNU Affero General Public License v3.0 or later',
  },

  // Captured by scripts/capture-screenshots.ts from a public-domain sample library.
  // `src` is the path without an extension: each shot ships as .webp with a .png fallback.
  screenshots: {
    library: {
      src: './screenshots/library-desktop',
      width: 1280,
      height: 800,
      alt: 'The Alexandryn library view on a desktop: a grid of ten book covers, with search, filter, and sort controls.',
    },
    readerDesktop: {
      src: './screenshots/reader-desktop',
      width: 1280,
      height: 800,
      alt: 'The Alexandryn reader on a desktop, showing the opening of Moby-Dick with contents and text settings in the toolbar.',
    },
    readerPhone: {
      src: './screenshots/reader-phone',
      width: 390,
      height: 844,
      alt: 'The Alexandryn reader on a phone, showing the same opening of Moby-Dick.',
    },
  },
} as const

export type Site = typeof site
