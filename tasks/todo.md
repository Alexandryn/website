# Task list: Alexandryn website

Plan: [`plan.md`](plan.md). Spec: [`../SPEC.md`](../SPEC.md).
Every task is done test-first (`/agent-skills:build`): write the failing check,
make it pass, run the task's verification, commit. Commit messages are plain
prose. Size: XS 1 file, S 1–2, M 3–5. Config-only files do not count against
the ~5-file guideline in T1.

## Phase 1 — Foundation

- [x] **T1: Toolchain that builds and typechecks** (M, config)
  - Acceptance: `npm ci` installs; `npm run typecheck` and `npm run build`
    pass on a stub `<App/>`; TS strict + `noUncheckedIndexedAccess`; React 19,
    Vite 8, Tailwind 4 versions match `alexandryn/web`; Node ≥ 24 enforced
    in `engines`; every dependency's what / why-not-stdlib / what-breaks-if-
    abandoned recorded in the commit message.
  - Verify: `npm ci && npm run typecheck && npm run build`
  - Depends on: none
  - Files: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`,
    `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [x] **T2: Lint, format, and unit-test harness** (S)
  - Acceptance: ESLint (typescript-eslint, react-hooks, `jsx-a11y`
    recommended) and Prettier (same settings as `alexandryn`) run clean;
    Vitest + jsdom + Testing Library run one smoke test that renders `<App/>`.
  - Verify: `npm run lint && npm run format:check && npm test`
  - Depends on: T1
  - Files: `eslint.config.js`, `.prettierrc.json`, `src/test/setup.ts`, `src/App.test.tsx`

- [x] **T3: Licence, ignore rules, README** (XS)
  - Acceptance: `LICENSE` is the verbatim AGPL-3.0 text and `package.json`
    declares `AGPL-3.0-or-later`; `.gitignore` covers `node_modules`, `dist`,
    `test-results`, `playwright-report`, `.env*`; README states what the repo
    is, the commands, and that it is deployed as a static site.
  - Verify: `grep -q "GNU AFFERO" LICENSE` and `git status` shows no ignored junk
  - Depends on: T1
  - Files: `LICENSE`, `.gitignore`, `README.md`

## Phase 2 — Design system and content

- [x] **T4: Tokens, self-hosted fonts, contrast check** (S)
  - Acceptance: design colours exist once as Tailwind `@theme` tokens
    (`bg`, `surface`, `surface-2`, `surface-3`, `ink`, `ink-2`, `ink-3`,
    `line`, `accent`, `accent-soft`, `warm`, …); Geist, Newsreader, IBM Plex
    Mono load from `@fontsource` (no external request); `check:contrast`
    fails if any declared text/background pair is < 4.5:1 and passes for the
    allowed set; `ink-3` is not in the allowed text pairs.
  - Verify: `npm run check:contrast && npm test && npm run build`, and the
    built CSS contains no `fonts.googleapis.com`
  - Depends on: T1, T2
  - Files: `src/styles/index.css`, `scripts/check-contrast.ts`,
    `scripts/check-contrast.test.ts`, `src/main.tsx`, `package.json`

- [x] **T5: `content/site.ts` and copy-accuracy tests** (S)
  - Acceptance: one typed module exports version (`1.0.0`), platform
    download links, docs cards (Self-hosting, Administration, Security,
    Updating, API contract), nav/footer links, and every section's prose
    using the corrected wording from the spec. Tests assert forbidden strings
    absent ("no account", "Nothing leaves your home", `v0.9`, `href="#"`)
    and required strings present (Docker mention, login/TLS statement,
    Open Library disclosure, unsigned-installer note).
  - Verify: `npm test` (write the tests first and see them fail)
  - Depends on: T2
  - Files: `src/content/site.ts`, `src/content/site.test.ts`

### Checkpoint A — foundation and content
- [ ] `npm run lint && npm run typecheck && npm test && npm run check:contrast && npm run build` all pass
- [ ] `/agent-skills:review` on the diff; no Critical/High findings
- [ ] Maintainer confirms the wording in `site.ts`

## Phase 3 — Sections (vertical slices)

- [x] **T6: Page shell: nav, footer, skip link, landmarks** (M)
  - Acceptance: skip-to-content link is the first focusable element; sticky
    nav (wordmark, Documentation, GitHub, Download button) with the design's
    scroll-activated bottom border; footer with links and the licence line;
    `<header>`, `<main>`, `<footer>` landmarks; scroll listener is passive and
    removed on unmount.
  - Also: replace the vacuous smoke test in `App.test.tsx` with a page-level
    check that runs the content audit's forbidden-string list over
    `document.body.textContent` and asserts every `site.*` link appears as an
    anchor, so prose hard-coded in JSX cannot bypass the copy tests.
  - Verify: `npm test` (nav border toggles on scroll; skip link first in tab
    order; landmarks present) and visual check in `npm run dev`
  - Depends on: T4, T5
  - Files: `src/components/Nav.tsx`, `src/components/Footer.tsx`, `src/App.tsx`,
    `src/components/Nav.test.tsx`, `src/components/Footer.test.tsx`

- [x] **T7: Hero and device mockup** (M)
  - Acceptance: single `h1` with the design's serif headline and the
    accent underline on "at home"; corrected subline including the Docker
    mention; primary + secondary CTA; footnote in `ink-2`; laptop + phone
    frames with CSS-drawn book covers from a `books` list in `site.ts`;
    decorative mockup is `aria-hidden`; layout wraps at 320 px.
  - Verify: `npm test`; `npm run dev` at 320 / 768 / 1280 px, no overlap
  - Depends on: T6
  - Files: `src/components/Hero.tsx`, `src/components/DeviceMockup.tsx`,
    `src/components/BookCover.tsx`, `src/components/Hero.test.tsx`

- [x] **T8: Concepts and How it works** (S)
  - Acceptance: three concept cards (metadata, sources, library) with the CSS
    icons, each icon decorative; three numbered steps with dividers that
    hide when wrapped; concept titles are `h2` (the prototype gives the cards no
    section heading, so `h3` would skip a level under the `h1`); step titles are
    `h3` under the `h2` "How it works".
  - Verify: `npm test`; visual check at 320 and 1280 px
  - Depends on: T6
  - Files: `src/components/Concepts.tsx`, `src/components/HowItWorks.tsx`,
    `src/components/Concepts.test.tsx`

- [x] **T9: Feature rows 1–2 (library view, read on any device)** (M)
  - Acceptance: alternating text/visual rows with the design's library-grid
    panel and the desktop + phone reading panels; visuals `aria-hidden` with
    the meaning carried by the row's text; row order flips on wrap as in
    the design.
  - Verify: `npm test`; visual check
  - Depends on: T6
  - Files: `src/components/Features.tsx`, `src/components/FeatureRow.tsx`,
    `src/components/Features.test.tsx`

- [x] **T10: Feature rows 3–4 (privacy, open source)** (S)
  - Acceptance: privacy row uses the corrected paragraph (own server, login
    always, TLS for public setups, Open Library disclosure); open-source row
    shows the terminal panel with `git clone <real URL>` and the licence as a
    plain caption (not shell input); terminal text meets contrast.
  - Verify: `npm test` (copy assertions from T5 still pass); visual check
  - Depends on: T9
  - Files: `src/components/Features.tsx`, `src/components/TerminalPanel.tsx`,
    `src/components/Features.test.tsx`

- [ ] **T11: Download and Documentation** (M)
  - Acceptance: heading, three equal platform buttons (no platform detection, so
    the prerendered page never flickers) linking to the matching GitHub Releases
    asset page; version and Changelog link; a plain note that installers are
    not yet code-signed and the OS will warn on first launch; a Docker/
    self-hosting link; Documentation section with the four guides + API
    contract; every link is a real URL.
  - Note: all three platform buttons use `releases/latest` until asset names
    exist; `/latest` 404s if only pre-releases are published, so v1.0.0 must
    be a full release. Per-platform asset links are a follow-up.
  - Verify: `npm test`; `npm run check:links` (after T13)
  - Depends on: T6
  - Files: `src/components/Download.tsx`, `src/components/Docs.tsx`,
    `src/components/Download.test.tsx`, `src/components/Docs.test.tsx`

### Checkpoint B — whole page renders
- [ ] Full page matches the prototype's structure at 320 / 768 / 1280 px
- [ ] `npm run lint && npm run typecheck && npm test && npm run check:contrast && npm run build`
- [ ] `/agent-skills:review` (five axes); fix Critical/High
- [ ] Maintainer looks at `npm run dev` and approves the look

## Phase 4 — Verification

- [ ] **T12a: Prerender the page at build time** (S)
  - Acceptance: after `vite build`, a script renders `<App/>` with
    `react-dom/server` and writes the HTML into `dist/index.html`; the client
    entry uses `hydrateRoot`; nothing in the component tree touches `window`
    or `document` during render; `dist/index.html` contains the `h1`, all
    section headings, and every link without running JavaScript.
  - Note: `scripts/prerender.ts` needs JSX and DOM libs, so give it its own
    tsconfig (or move it under `src/`); `tsconfig.node.json` has neither.
  - Verify: `npm test` (built HTML contains headings and links) and
    `npm run build`; open `dist/index.html` with JS disabled and confirm the
    page reads
  - Depends on: T11
  - Files: `scripts/prerender.ts`, `scripts/prerender.test.ts`, `src/main.tsx`,
    `src/entry-server.tsx`, `package.json`

- [ ] **T12: Playwright — axe, keyboard, responsive** (M)
  - Acceptance: zero axe violations at 320, 768, 1280 px; one `h1`, no skipped
    heading levels; Tab order reaches every link/button in reading order with
    visible focus, skip link works; no horizontal scroll at 320 px;
    `prefers-reduced-motion` honoured.
  - Verify: `npx playwright test` (Chromium + Firefox; WebKit where the host
    allows it — note any gap plainly)
  - Depends on: Checkpoint B
  - Files: `playwright.config.ts`, `e2e/a11y.spec.ts`, `e2e/keyboard.spec.ts`,
    `e2e/responsive.spec.ts`

- [ ] **T13: Static checks — links and bundle size** (S)
  - Acceptance: `check:links` fails on `href="#"`, empty, `example.com`, or
    missing `rel="noopener"` on `target=_blank`; `--strict` additionally
    requests every external URL (for launch; expected to fail until repos are
    public); `check:bundle-size` fails above 90 KiB gzipped JS. Each script has
    a fixture test that proves it fails on bad input.
  - Verify: `npm test && npm run build && npm run check:links && npm run check:bundle-size`
  - Depends on: T11
  - Files: `scripts/check-links.ts`, `scripts/check-links.test.ts`,
    `scripts/check-bundle-size.ts`, `scripts/check-bundle-size.test.ts`, `package.json`

### Checkpoint C — page is verified
- [ ] Every command in the spec's Commands section passes
- [ ] Success criteria 1–6 and 8 met (8: ≤ 90 KiB JS, content in built HTML)
- [ ] `/agent-skills:review` including a security pass (no third-party origin
      at runtime, no secrets, `rel` attributes)

## Phase 5 — Screenshots and release wiring

- [ ] **T14: Screenshot capture (spike, then script)** (M)
  - Acceptance: time-boxed spike picks the capture approach (see plan risks)
    and records the decision in `scripts/README.md`; a public-domain sample
    library (e.g. Middlemarch, Frankenstein, Moby-Dick, Pride and Prejudice,
    Walden) drives the app's library, reader, and phone views; script writes
    optimised WebP + PNG fallback with the app version in the filename or
    metadata; nothing personal or in-copyright is shown.
  - Verify: run the script against `alexandryn/web`'s dev server; open each
    output and check it by eye
  - Depends on: T1 (independent of T6–T13)
  - Files: `scripts/capture-screenshots.ts`, `scripts/sample-library.json`,
    `scripts/README.md`, `public/screenshots/*`

- [ ] **T15: Screenshots in the device frames** (M)
  - Acceptance: hero laptop and phone frames and the two feature visuals show
    the real screenshots; each `<img>` has meaningful `alt`, explicit
    `width`/`height`, `decoding="async"`, and `loading="lazy"` below the
    fold; no layout shift; bundle-size and axe checks still pass.
  - Verify: `npm test && npx playwright test && npm run build`
  - Depends on: T7, T9, T14
  - Files: `src/components/DeviceMockup.tsx`, `src/components/Features.tsx`,
    `src/content/site.ts`, `src/components/DeviceMockup.test.tsx`

- [ ] **T16: GitHub Pages workflow** (S)
  - Acceptance: build honours a `BASE_PATH` env var; a workflow builds and
    deploys `dist/` to Pages using SHA-pinned actions and least-privilege
    `permissions`; documented as unverified until Actions billing is restored.
  - Verify: `BASE_PATH=/website/ npm run build` produces correct asset URLs;
    workflow YAML parses; `actionlint` if available
  - Depends on: T1
  - Files: `.github/workflows/pages.yml`, `vite.config.ts`

- [ ] **T17: Final battery, review, ship** (S)
  - Acceptance: every command in the spec passes on the exact commit;
    `/agent-skills:review` and `/agent-skills:ship` run; SPEC.md status set to
    `IMPLEMENTED`; README lists the launch checklist (make repos public,
    `check:links --strict`, refresh screenshots for the tagged version,
    enable Pages).
  - Verify: the full command list; `npm run check:links --strict` result
    recorded honestly
  - Depends on: T15, T16
  - Files: `SPEC.md`, `README.md`

### Checkpoint D — ready to publish
- [ ] Maintainer sign-off; nothing goes public until `alexandryn` v1.0.0 is tagged
