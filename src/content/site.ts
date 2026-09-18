// Every user-facing string, link, and the version live here, and nowhere else.
// Components take these as props and contain no prose, so a wording change is a
// one-file edit and site.test.ts can check all of it in one place.
//
// Each claim was checked against the shipped software (see SPEC.md, "Copy
// corrections"). If the software changes, change the claim here.

const version = '1.0.0'
const repo = 'https://github.com/Alexandryn/alexandryn'
const docsRepo = 'https://github.com/Alexandryn/docs'
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

  links,

  nav: {
    ariaLabel: 'Primary',
    skipLabel: 'Skip to content',
    links: [
      { label: 'Documentation', href: `#${anchors.docs}` },
      { label: 'GitHub', href: repo },
    ],
    downloadLabel: 'Download',
    downloadHref: `#${anchors.download}`,
  },

  hero: {
    headlineLead: 'A library that lives ',
    headlineEmphasis: 'at home',
    headlineEnd: '.',
    subline:
      'Runs on your desktop, or on a home server with Docker. Your books, readable from your tablet, phone, or any other device on your home network — no cloud service, no third-party account.',
    primaryLabel: 'Download',
    primaryHref: `#${anchors.download}`,
    secondaryLabel: 'Read the docs',
    secondaryHref: `#${anchors.docs}`,
    footnote: 'macOS, Windows, and Linux · Open source · AGPL-3.0',
    networkLabel: 'HOME NETWORK',
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
        body: 'Open the web reader on any device on your home network.',
      },
    ],
  },

  features: {
    library: {
      title: 'Library view',
      body: 'Your books in one place. Filter, sort, and search without a cloud.',
      filterLabel: 'Filter',
      sortLabel: 'Sort',
      countLabel: '10 BOOKS',
    },
    devices: {
      title: 'Read on any device',
      body: 'Open Alexandryn on your laptop. Pick up where you left off on your phone or tablet, over your home network.',
      desktopLabel: 'READING · DESKTOP',
      phoneLabel: 'PHONE',
      // The opening of Moby-Dick (public domain), split across the two devices.
      desktopExcerpt: 'Call me Ishmael. Some years ago — never mind how long precisely —',
      phoneExcerpt: 'having little or no money in my purse,',
    },
    privacy: {
      title: 'No cloud service',
      body: 'Your library and reading data stay on your own server. By default the only outside service Alexandryn contacts is Open Library, for book details. Alexandryn only listens on your own machine until you turn network access on, it always requires a login, and a publicly reachable setup also requires TLS.',
    },
    openSource: {
      title: 'Open source',
      body: 'Licensed AGPL-3.0-or-later. Your books stay as ordinary files in your own folders, and your reading data can be exported.',
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
    signingNote:
      'The installers are not yet code-signed, so macOS and Windows will warn you the first time you open Alexandryn.',
    dockerLead: 'Prefer Docker? Read the ',
    dockerLinkLabel: 'self-hosting guide',
    dockerHref: `${docsRepo}/blob/main/self-hosting-guide.md`,
  },

  docs: {
    heading: 'Documentation',
    cards: [
      {
        title: 'Self-hosting',
        body: 'Run Alexandryn with Docker: setup, first run, persistent data',
        href: `${docsRepo}/blob/main/self-hosting-guide.md`,
      },
      {
        title: 'Administration',
        body: 'Accounts, libraries, sources, and backups',
        href: `${docsRepo}/blob/main/administration-guide.md`,
      },
      {
        title: 'Security',
        body: 'How network access works, and what Alexandryn does not do',
        href: `${docsRepo}/blob/main/security-reference.md`,
      },
      {
        title: 'Updating',
        body: 'Pull a new version and check that it started',
        href: `${docsRepo}/blob/main/updating-guide.md`,
      },
      {
        title: 'API contract',
        body: 'The OpenAPI specification, for developers',
        href: `${repo}/blob/main/api/openapi.yaml`,
      },
    ],
  },

  footer: {
    ariaLabel: 'Footer',
    description:
      'A self-hosted digital library for your home network. Runs on your desktop or on a home server; readable from any device on your network.',
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

  // Drawn covers for the device mockups. Public-domain titles only; the
  // colours are per-cover data, not theme tokens.
  books: [
    { title: 'Middlemarch', bg: '#2a3550', fg: '#e8e4da' },
    { title: 'Frankenstein', bg: '#26494f', fg: '#e6edea' },
    { title: 'Moby-Dick', bg: '#333a63', fg: '#e4e3ee' },
    { title: 'Pride and Prejudice', bg: '#9c5b3c', fg: '#f6ede4' },
    { title: 'Walden', bg: '#3c5142', fg: '#e4ebe2' },
    { title: 'Jane Eyre', bg: '#4a3450', fg: '#ede4f0' },
    { title: 'Great Expectations', bg: '#2b4a5c', fg: '#e2ecf0' },
    { title: 'Dracula', bg: '#7f6127', fg: '#f5eddc' },
    { title: 'Wuthering Heights', bg: '#243b33', fg: '#e1eae4' },
    { title: 'The Picture of Dorian Gray', bg: '#4e4030', fg: '#efe6d8' },
  ],
} as const

export type Site = typeof site
