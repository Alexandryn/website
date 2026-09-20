# Scripts

| Script                   | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `check-contrast.ts`      | WCAG AA contrast of the theme and of every text colour class |
| `check-links.ts`         | Links, anchors and third-party resources in `dist/`          |
| `check-bundle-size.ts`   | Gzipped JavaScript against the 90 KiB budget                 |
| `prerender.ts`           | Build step: renders the page into `dist/index.html`          |
| `capture-screenshots.ts` | One-off: screenshots of the real app, see below              |

## Capturing screenshots

The page shows real screenshots of the Alexandryn web app inside its device
frames. They are captured, not drawn, so they show what the app looks like.

```sh
# in the alexandryn repo
cd web && npm run dev            # serves on http://localhost:5173

# in this repo
APP_URL=http://localhost:5173 node scripts/capture-screenshots.ts
```

The script writes `public/screenshots/{library-desktop,reader-desktop,reader-phone}`
as `.webp` with a `.png` fallback, plus `screenshots.json` recording the app
version (the page's `site.version`) and the capture time. Re-run it after the
app's UI changes and commit the result.

### Decision: how the sample library gets into the app

The app's development mode fills itself with mock data through a service
worker, and those mocks are mostly in-copyright titles. The capture must show
only public-domain books, and must not require editing the `alexandryn` repo.

Chosen: block the service worker (`serviceWorkers: 'block'` in the Playwright
context) and answer every `/api/**` request from Playwright's own
`context.route`, using `sample-library.json`, which this repo owns. Playwright
cannot intercept requests that a service worker has already answered, which is
why the worker has to be blocked rather than overridden.

Rejected:

- **Editing the app's mock fixtures.** Couples a marketing task to the app's
  test data and would need a change in a second repository.
- **Running a real server with imported books.** Slower, needs a database, and
  proves nothing extra: the screenshots only need the API's responses.

The cost: the sample handlers copy the API's response shapes for the few
endpoints the three views use. If the app changes those shapes the capture
shows an error state or a blank screen, which is visible when you open the
images. The script prints any API call it does not serve.

### What the sample contains

`sample-library.json`: the ten public-domain titles drawn on the page, and the
opening of _Moby-Dick_ (Herman Melville, 1851) for the reader view. A test
(`sample-library.test.ts`) checks the titles match the page's drawn covers. No
real person's library, paths, or data appear.
