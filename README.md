# Alexandryn website

The public landing page for [Alexandryn](https://github.com/Alexandryn/alexandryn),
a self-hosted digital library. It is a single static page built with React and
Tailwind CSS, based on the Claude Design prototype for the project.

Documentation lives in the separate `docs` repository; this repository only
holds the landing page.

## Requirements

Node.js 24 or later.

## Commands

| Command                     | What it does                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `npm ci`                    | Install dependencies                                                                    |
| `npm run dev`               | Start the development server                                                            |
| `npm run build`             | Typecheck and build the static site to `dist/`                                          |
| `npm run preview`           | Serve the built site locally                                                            |
| `npm run typecheck`         | Typecheck only                                                                          |
| `npm run lint`              | ESLint, including accessibility rules                                                   |
| `npm run format:check`      | Prettier check                                                                          |
| `npm test`                  | Unit and component tests                                                                |
| `npm run test:e2e`          | Playwright: axe, keyboard, layout, no-JS                                                |
| `npm run check:contrast`    | Colour contrast of the theme and of every text-colour class                             |
| `npm run check:links`       | Links, anchors, third-party resources in `dist/` (`-- --strict` also requests each URL) |
| `npm run check:bundle-size` | Gzipped JS against the 90 KiB budget                                                    |

## How it is built

The output is plain static files in `dist/` and can be served by any static
host. Everything the page needs, including fonts, is bundled: it makes no
request to a third-party origin.

## Licence

GNU Affero General Public License v3.0 or later. See [`LICENSE`](LICENSE).

## Deploying

`.github/workflows/pages.yml` verifies the site on every push and pull
request, and deploys `dist/` to GitHub Pages when `main` changes. In the
repository settings, set Pages to deploy from GitHub Actions once. Asset URLs
are relative, so the same build works at a domain root and under a project
path such as `https://<owner>.github.io/website/`.

The workflow has not run yet: it was written while Actions was unavailable, so
treat the first run as its test. After the first deploy, check the response
headers with `curl -I`; GitHub Pages does not let a site set its own, so the
page carries its Content-Security-Policy in a `<meta>` tag instead.

## Launch checklist

Nothing here goes public until Alexandryn v1.0.0 is tagged and its installers
exist, because the download buttons point at `releases/latest`.

1. Push this repository and the `docs` repository to GitHub under the
   `Alexandryn` organisation, and make both public with `alexandryn`.
2. Deploy the docs site (`Alexandryn/docs`, Pages from GitHub Actions) so
   `https://alexandryn.github.io/docs/` answers; the documentation cards and the
   Docker link point there.
3. Run `npm run check:links -- --strict`. It requests every external URL and
   fails until those repositories are public and the release exists; that
   failure is expected before launch.
4. Re-run `scripts/capture-screenshots.ts` against the tagged version, look at
   all three images, and commit them. `public/screenshots/screenshots.json`
   records which version they came from.
5. In the repository settings, set Pages to deploy from GitHub Actions, then
   watch the first workflow run and check the headers with `curl -I`.
6. Open the site in Safari: WebKit could not be tested during development.
