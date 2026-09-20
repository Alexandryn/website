# Spec: Alexandryn website (v1.0.0 landing page)

| | |
|---|---|
| **Status** | `APPROVED` — maintainer approved 2026-09-18 (copy corrections, screenshots, hosting, Docker mention) |
| **Repo** | `website` (separate from `alexandryn`, per ADR 0006) |
| **Design source** | Claude Design project "Alexandryn interactive prototype" (`78075626-e444-438f-8437-205d57129a37`), file `Alexandryn Landing.dc.html`, read 2026-09-18 |

## Objective

Ship the public landing page for Alexandryn v1.0.0: one static, responsive,
accessible page that says what Alexandryn is, who it is for, what it does,
and how to get it and its documentation.

The design already exists as a static prototype. This work turns it into a
real React + Tailwind site, faithful to the design's structure and visual
language, with the copy corrected wherever the prototype says something the
software does not do (see "Copy corrections" below).

**Audience:** someone who owns a book collection and is comfortable running
software on their own computer or home server. They may not know what OPDS
or Docker is; the page must make sense without that.

**Non-goals:** a blog, a documentation site (that is the `docs` repo), user
accounts, analytics, a CMS, i18n, a dark theme (the design defines one light
theme only).

## Assumptions

Correct any of these now, or I will proceed with them.

1. Stack mirrors `alexandryn/web`: React 19, TypeScript, Vite, Tailwind v4
   (`@tailwindcss/vite`), Vitest + Testing Library, Playwright +
   `@axe-core/playwright`. Same tooling means the maintainer already knows it
   and the a11y checks are proven.
2. One page, no client-side routing. Sections are anchors (`#download`,
   `#docs`), as in the design.
3. The site is fully static: `npm run build` produces `dist/`, deployable to
   any static host. Hosting is decided separately (see Open questions).
4. Fonts (Geist, Newsreader, IBM Plex Mono) are self-hosted via `@fontsource`
   packages, not loaded from Google's CDN. A project whose pitch is "nothing
   phones home" should not make every visitor's browser call Google Fonts.
5. Design tokens (colours, radii, shadows) come from the design's CSS custom
   properties and live once, as Tailwind `@theme` tokens. No hex values in
   components.
6. Single version constant (`1.0.0`) drives every place the version appears.
7. Same licence as the main repo: AGPL-3.0-or-later.
8. The site is not public until v1.0.0 is tagged; download links target the
   GitHub Releases page, which is empty until then.

## Copy corrections

The prototype's copy is placeholder marketing. Constitution §11 (plain,
specific, calm) and phase 99's rule (no unverifiable claims) mean these change.
Each was checked against the shipped software.

| Design copy | Problem | Replacement |
|---|---|---|
| "no cloud, no account" (hero) | Alexandryn has local accounts and requires a login. It has no *cloud* account. | "no cloud service, no third-party account" |
| "Nothing leaves your home." (feature 3) | Open Library lookups are an outbound call. | "Your library and reading data stay on your own server. By default the only outside service Alexandryn contacts is Open Library, for book details." |
| "binds to localhost by default. It will not serve outside your network without a login." | Understates the rule: any exposure beyond the machine needs a login, and a publicly reachable address additionally needs TLS. | "Alexandryn only listens on your own machine until you turn network access on. It always requires a login, and a publicly reachable setup also requires TLS." |
| `v0.9.2` | Wrong version. | `1.0.0`, from one constant. |
| Download buttons `href="#"` | Dead links. | GitHub Releases for the matching platform. Add a plain note that installers are not yet code-signed, so the OS will warn on first launch. |
| Docs cards: Getting started, Configuration, API reference, Security | Do not match the guides that exist. | Self-hosting, Administration, Security, Updating (the `docs` repo), plus the API contract link. |
| `href="https://github.com"` | Not the project. | The real repository URL. **The repository is currently private**, so this link is broken for visitors until it is made public. |
| Terminal mock line `$ license: AGPL-3.0` | Not a command. | Render as a plain caption, not as shell input. |
| "Runs on your desktop" only | Omits the Docker/home-server path that ships in v1.0.0. | Add "or on a home server with Docker" once, in the hero subline or the "How it works" step 1. |

**Contrast fix.** The design's `--tx3` (`#9C978F`) measures 2.66:1 on the page
background and 2.90:1 on white, which fails WCAG AA (4.5:1 for text). The
design uses it for real text (footnote, section labels, version line, licence
line). Text uses `--tx2` (`#6E6B66`, 4.87:1 on the background, 4.62:1 on
`--sf3`) or darker. `--tx3` is reserved for non-text decoration.

## Tech stack

- React 19, TypeScript ~6.0 (strict), Vite 8, Tailwind 4 — versions matching
  `alexandryn/web/package.json`.
- `@fontsource/geist`, `@fontsource/newsreader`, `@fontsource/ibm-plex-mono`
  — new dependencies; each needs a recorded reason (what it does, why not
  stdlib, what breaks if abandoned) before it is added (constitution §9).
- Dev: Vitest 4, `@testing-library/react`, ESLint (+ `jsx-a11y`), Prettier,
  Playwright, `@axe-core/playwright`.

Recorded reasons for the dev-only additions (constitution §9). Neither is
imported from `src/`, so neither can reach `dist/`.

| Package | What it does | Why not stdlib or jsdom | What breaks if abandoned |
| --- | --- | --- | --- |
| `@playwright/test` | Drives Chromium, Firefox and WebKit against the built page | jsdom has no layout, so it cannot check overflow, real tab order, focus outlines, or reduced motion | The `e2e/` suite; the site is unaffected |
| `@axe-core/playwright` | Runs axe-core's WCAG rules in that real page | Hand-written accessibility rules would cover far less and go stale | The axe spec; keyboard and layout specs still run |

## Commands

```
Install:      npm ci
Dev:          npm run dev
Build:        npm run build            # tsc -b && vite build
Preview:      npm run preview
Typecheck:    npm run typecheck        # tsc -b --noEmit
Lint:         npm run lint
Format check: npm run format:check
Unit tests:   npm test                 # vitest run
E2E + axe:    npx playwright test
Contrast:     npm run check:contrast   # token pairs vs WCAG AA
Links:        npm run check:links      # no href="#" placeholders, no empty hrefs
Prerender:    npm run build            # runs scripts/prerender.ts after vite build
Bundle size:  npm run check:bundle-size
```

## Project structure

```
website/
  SPEC.md                    this file
  index.html                 document shell, <title>, meta, favicon
  src/
    main.tsx                 mounts <App/>
    App.tsx                  page composition, section order
    content/site.ts          ALL user-facing copy, version, links (single source)
    components/              Nav, Hero, DeviceMockup, Concepts, HowItWorks,
                             Features, Download, Docs, Footer
    styles/index.css         Tailwind import + @theme tokens
  public/
    screenshots/             optimised app screenshots (WebP + fallback)
  e2e/                       Playwright specs (a11y, keyboard, viewports)
  scripts/                   check-contrast, check-links, check-bundle-size, prerender
  LICENSE                    AGPL-3.0-or-later
```

Copy lives in `content/site.ts`, not in JSX, so wording changes are one-file
edits and the copy-accuracy tests have one place to read.

## Code style

Small typed function components, tokens by name, semantic HTML, no inline
styles carrying colour.

```tsx
type DocLink = { title: string; body: string; href: string }

export function DocsCard({ title, body, href }: DocLink) {
  return (
    <a
      href={href}
      className="flex items-center gap-3.5 rounded-xl border border-line bg-surface p-5 text-ink shadow-sm hover:no-underline focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="min-w-0 flex-1">
        <span className="mb-1 block text-[15.5px] font-semibold">{title}</span>
        <span className="block text-[13.5px] text-ink-2">{body}</span>
      </span>
    </a>
  )
}
```

Conventions: 2-space indent, no semicolons, single quotes (matches
`alexandryn/web`'s Prettier config), named exports, one component per file,
comments only for a non-obvious *why*.

## Testing strategy

| Layer | Tool | Covers |
|---|---|---|
| Unit / component | Vitest + Testing Library | Each section renders its content from `site.ts`; download buttons map to the right platform links; version constant appears everywhere it should |
| Copy accuracy | Vitest | The "Copy corrections" table becomes assertions: forbidden strings ("no account", "Nothing leaves your home", `v0.9`, `href="#"`) absent; required strings present |
| Static checks | scripts | Contrast of every text/background token pair ≥ 4.5:1; no placeholder or empty hrefs; JS bundle under budget |
| Accessibility | Playwright + axe | Zero axe violations at 320, 768, 1280 px; landmark structure; one `h1`; heading order |
| Keyboard | Playwright | Full tab order reaches every link and button in reading order, visible focus everywhere, skip link works |
| Responsive | Playwright | No horizontal scroll at 320 px; nav and device mockup reflow without overlap |

Bugs and copy fixes follow red → green: write the failing assertion first.
axe covers only part of WCAG; the keyboard and reflow specs exist because of
that, not in addition to it being enough.

## Screenshots

The brief is "minimal plus screenshots". The design draws its device mockups
with CSS. Plan: keep the design's laptop and phone frames and put **real
screenshots of the app** inside them (library view, reader, phone view).

- Captured from the actual `alexandryn/web` UI against its mock fixtures,
  showing public-domain sample titles only — never a personal library.
- Optimised (WebP with a PNG fallback), with explicit `width`/`height` to
  prevent layout shift, and meaningful `alt` text (not "screenshot").
- Screenshots go stale as the UI changes. Each is tagged with the app version
  it was taken from, and refreshing them is a release-checklist item.

## Boundaries

**Always**
- Write the failing test before the code that makes it pass.
- Keep all copy in `content/site.ts`; keep all colour in `@theme` tokens.
- Meet WCAG 2.1 AA: semantic landmarks, one `h1`, keyboard operable, visible
  focus, text contrast ≥ 4.5:1, `prefers-reduced-motion` respected.
- Write copy that is plain, specific, and calm: no exclamation marks, no
  superlatives, no claim the software cannot back up.
- Check every factual claim about Alexandryn against the shipped behaviour
  before it goes on the page.

**Ask first**
- Adding any dependency (record what it does, why not stdlib, what breaks if
  abandoned — §9).
- Adding analytics, a third-party embed, a cookie, or any request to a domain
  other than the site's own.
- Adding a page or route beyond the single landing page.
- Changing the design's structure or visual language, as opposed to fixing its
  copy or contrast.
- Choosing the hosting target or the custom domain.

**Never**
- Load fonts, scripts, or images from a third-party CDN.
- Ship a placeholder link (`href="#"`, empty, or `example.com`).
- Ship copy from the prototype that the "Copy corrections" table replaces.
- Use `--tx3` for text.
- Use a screenshot that shows a real person's library or personal data.
- Commit secrets, or delete or skip a failing test to get green.

## Success criteria

1. `npm run build` succeeds; the page renders from `dist/` with no runtime
   network request to a third-party origin.
2. Structure and visual language match `Alexandryn Landing.dc.html`: nav, hero
   with device mockup, three concept cards, how-it-works, four feature rows,
   download, docs, footer.
3. Zero axe violations at 320 / 768 / 1280 px; no horizontal scroll at 320 px;
   every interactive element reachable and visibly focused by keyboard.
4. Every text/background token pair used for text is ≥ 4.5:1 (script-enforced).
5. No forbidden string or placeholder link present (test-enforced).
6. The version shown is `1.0.0`, from one constant.
7. Screenshots are real, sample-data only, have alt text and explicit
   dimensions, and cause no layout shift.
8. Total JS ≤ 90 KiB gzipped (measured baseline: React 19 + react-dom is
   68.6 KiB of that, so the original 60 KiB guess was unachievable), and the
   built `index.html` contains the full page content — prerendered at build
   time and hydrated — so the page is readable with JavaScript disabled or
   slow. (Corrected 2026-09-18 after measuring the T1 stub.)
9. Every link resolves once the repository is public and v1.0.0 is released
   (verified manually at launch; the automated check covers placeholders only).

## Decisions (2026-09-18, maintainer)

- **Copy corrections:** approved as written in the table above.
- **Screenshots:** captured from the real `alexandryn/web` UI on its mock
  fixtures (public-domain sample titles), placed in the design's device frames.
- **Hosting:** GitHub Pages. The build sets a configurable `base` path. The
  deploy workflow is written but cannot run until GitHub Actions billing is
  restored, so deployment waits on that.
- **Docker mention:** approved — "or on a home server with Docker" goes in the
  hero subline.

## Open questions

1. **Repository visibility.** The `alexandryn` repo is private. The site's
   GitHub, Releases, and Changelog links only work once it is public. When?
2. **Where the docs are published.** The `docs` repo holds Markdown guides
   today. The site's docs cards need a public URL for each — GitHub-rendered
   Markdown, or a docs site?
3. **Custom domain**, if any (affects Pages config only).
4. **Licence file** for this repo: assumed AGPL-3.0-or-later (assumption 7).
