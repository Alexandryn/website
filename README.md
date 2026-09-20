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

The specification is in [`SPEC.md`](SPEC.md), and the implementation plan and
task list are in [`tasks/`](tasks/).

## Licence

GNU Affero General Public License v3.0 or later. See [`LICENSE`](LICENSE).
