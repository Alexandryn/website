# Implementation plan: Alexandryn website (v1.0.0 landing page)

Spec: [`../SPEC.md`](../SPEC.md) (`APPROVED` 2026-09-18). Task list:
[`todo.md`](todo.md) (default target; no external tracker designated).

## Overview

Turn the static `Alexandryn Landing.dc.html` prototype into a React + Tailwind
single-page site with corrected copy, WCAG AA contrast, real app screenshots in
the device frames, and automated a11y / copy / link / bundle checks. Each
section is built as its own vertical slice: content in `content/site.ts`,
component, and tests, all landing together so the page is working and
verifiable after every task.

## Process

Each task is executed with `/agent-skills:build` (test first, smallest
change, verify, commit). Checkpoints get `/agent-skills:review`. The end of
the plan gets `/agent-skills:ship` before anything is announced.

## Architecture decisions

- **Copy in one file.** `src/content/site.ts` holds every string, link, and the
  version. Components take props; they contain no prose. This makes the
  copy-accuracy tests (forbidden/required strings) trivial and keeps wording
  changes out of JSX.
- **Tokens once, in `@theme`.** Colours from the design's CSS variables become
  Tailwind theme tokens (`ink`, `ink-2`, `surface`, `line`, `accent`, `wm`, …).
  The contrast script reads the same token table the CSS is generated from, so
  the two cannot drift. No hex in components (a test enforces it).
- **`--tx3` is never text.** Only `ink-2` (or darker) is allowed for text.
- **Scripts run as plain TypeScript on Node ≥ 24** (type stripping), like
  `alexandryn/web/scripts`. No `ts-node`/`tsx` dependency.
- **Fonts self-hosted** through `@fontsource/*`; no request leaves the origin.
- **Static output, configurable base.** `vite build` with `base` from an env
  var, so GitHub Pages (`/website/`) and a custom domain (`/`) both work.
- **Prettier settings match `alexandryn`** (`semi: false`, single quotes,
  trailing commas, width 100).

## Dependency graph

```
T1 toolchain ─ T2 lint/format/test harness ─ T3 licence/readme
        │
        ├─ T4 tokens + fonts + contrast script
        └─ T5 content/site.ts + copy-accuracy tests
                 │
   CHECKPOINT A ─┤
                 ├─ T6 page shell (Nav, Footer, skip link)
                 │     ├─ T7  Hero + device mockup (CSS covers)
                 │     ├─ T8  Concepts + How it works
                 │     ├─ T9  Features 1-2
                 │     ├─ T10 Features 3-4
                 │     └─ T11 Download + Docs
                 │
   CHECKPOINT B ─┤
                 ├─ T12 e2e: axe, keyboard, responsive
                 ├─ T13 static checks: links, bundle size
                 │
   CHECKPOINT C ─┤
                 ├─ T14 screenshot capture (spike first)
                 ├─ T15 screenshots into frames
                 ├─ T16 Pages workflow
                 └─ T17 final battery + review + ship
```

T7–T11 are independent once T6 lands and can be done in any order (or in
parallel) — each only adds a section to `App.tsx`. T14 depends only on the
`alexandryn` web app being runnable, so it can start any time after T1.

## Task list

See [`todo.md`](todo.md) for full acceptance criteria, verification, and files.
Summary:

### Phase 1 — Foundation
- T1 Toolchain that builds and typechecks
- T2 Lint, format, and unit-test harness
- T3 Licence, `.gitignore`, README

### Phase 2 — Design system and content
- T4 Tokens, self-hosted fonts, and the contrast check
- T5 `content/site.ts` and the copy-accuracy tests

### Checkpoint A

### Phase 3 — Sections (vertical slices)
- T6 Page shell: nav, footer, skip link, landmarks
- T7 Hero and device mockup
- T8 Concepts and How it works
- T9 Feature rows 1–2 (library view, read on any device)
- T10 Feature rows 3–4 (privacy, open source)
- T11 Download and Documentation

### Checkpoint B

### Phase 4 — Verification
- T12 Playwright: axe, keyboard, responsive
- T13 Static checks: links and bundle size

### Checkpoint C

### Phase 5 — Screenshots and release wiring
- T14 Screenshot capture
- T15 Screenshots in the device frames
- T16 GitHub Pages workflow
- T17 Final battery, review, ship

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The app's mock fixtures are mostly in-copyright titles (Dune, A Wizard of Earthsea, The Left Hand of Darkness; only Middlemarch is public domain). Spec requires public-domain sample titles. | Med | T14 starts with a time-boxed spike: capture against a sample library the website repo owns (public-domain titles), served by intercepting the app's API calls, not by editing `alexandryn`. Fallback: maintainer supplies screenshots (spec decision), frames and layout unchanged. |
| Screenshots need the `alexandryn` web app running (MSW in dev). Playwright route interception may not see requests the MSW service worker already handles. | Med | Spike decides between blocking the service worker and serving the API via `page.route`, or running the app's own MSW with an overridden fixture. Documented in the task; capture is a one-off script, not part of CI. |
| Docs and repo URLs the site links to do not exist publicly yet (`docs` has no remote, `alexandryn` is private). `check-links` forbids `#`/empty hrefs. | Med | T11 uses the intended GitHub URLs from `site.ts` constants. `check-links` has a `--strict` mode that requests every external URL; it is run at launch and is expected to fail until the repos are public. Tracked in the launch checklist, not hidden. |
| GitHub Actions is blocked (org billing). The Pages workflow can be written but not run or verified. | Low | T16 is written and reviewed, and marked unverified until Actions returns. Site is deployable by hand from `dist/` meanwhile. |
| Design's low-contrast `--tx3` text. | High if missed | T4 makes contrast a failing script before any component exists; T12 axe run backs it up. |
| New dependencies without a recorded reason (§9). | Low | Each dependency's what/why/what-breaks is recorded in the commit that adds it (T1, T4). |
| Page claims drift from shipped behaviour as v1.0.0 changes. | Med | T5's forbidden/required-string tests; every claim traced to source when written (Copy corrections table). |

## Open questions

Carried from the spec; none block T1–T10.

1. Repository visibility — needed before launch, not before build.
2. Public URLs for the docs guides — needed by T11 (provisional URLs used).
3. Custom domain — only affects T16's `base`.
4. Licence — assumed AGPL-3.0-or-later (T3).
