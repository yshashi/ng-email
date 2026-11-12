# ng-email website (`apps/web`)

The ng-email site: home page, the block gallery and the templates gallery. It's an Angular 22 app, **fully prerendered** to static HTML (`outputMode: "static"`), so it can be hosted on GitHub Pages without a server. It is built with ng-email itself.

## Pages

| Route | What |
|---|---|
| `/` | Hero with a live X-ray of the welcome template, source beside output, the three steps, and links into the gallery |
| `/components` | Every block category |
| `/components/:category` | Every block in a category, with preview (desktop/mobile, X-ray), Angular source, HTML output, plain text, copy buttons and its `ng-email add` command |
| `/templates` | Live, scaled-down thumbnails of every template |
| `/templates/:name` | One template in the full viewer |

Every URL is prerendered. Unknown URLs fall back to `index.csr.html`, which renders the not-found page. On GitHub Pages that file becomes `404.html`.

## Where the content comes from

`scripts/sync-registry.mjs` runs before every build:

1. It reads the block registry in `packages/blocks/dist/r`. Run `npm run build` at the repo root first.
2. It writes `src/generated/`:
   * `catalog.ts`: names, categories, and lazy loaders for each item;
   * `items/*.json`: source, preview HTML and plain text, plus code highlighted at build time with Shiki in light and dark themes. Each item is its own small lazy chunk.
3. It copies the raw registry to `public/r/`, so the deployed site *is* the registry `ng-email add` downloads from. It copies images to `public/static/`.

Preview HTML references images as `static/…`, relative to `<base href>`. That way images work locally (`/`) and on GitHub Pages (`/ng-email/`). The "Copy HTML" button copies the exact `ng-email` output, with public image URLs.

## Scripts

```bash
npm run start -w @ng-email/web
```
Dev server with live reload, at http://localhost:4200.

```bash
npm run build -w @ng-email/web
```
Production build for `/`, written to `dist/browser`.

```bash
npm run build:pages -w @ng-email/web
```
Production build for GitHub Pages (`--base-href /ng-email/`).

```bash
node apps/web/scripts/serve-dist.mjs 4330 /ng-email/
```
Serves `dist/browser` the way GitHub Pages does, with directory index pages and a 404 fallback, under a base path.

```bash
npm run test:web
```
Builds for Pages, then checks every route, the base path, previews, images, the published registry and the 404 fallback.

## Design

* **Palette:** paper `#F4F6FA`, ink `#131A2A`, muted `#5B6478`, line `#DCE1EA`, plus one accent, X-ray magenta `#C2367A`. There is a matching dark theme via `prefers-color-scheme`. Email previews stay light, as most inboxes render them.
* **Type:** Bricolage Grotesque (display), Public Sans (body) and IBM Plex Mono (code), all self-hosted from `@fontsource`. The site makes no third-party requests.
* **Signature, the X-ray:** an outline of every `<table>` and `<td>`, the structure HTML email is really made of. It's available on every preview, and on the home page it plays once as a scan. With reduced motion, it shows without animating.
