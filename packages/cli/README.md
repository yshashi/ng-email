# @ng-email/cli

The `ng-email` command line has four commands:

* **`build`** turns your Angular email components into **one self-contained ES module** that any plain Node service can import. You don't need the Angular CLI or a runtime compiler, and the output has no `node_modules` of its own.
* **`preview`** opens a live browser preview that rebuilds on every save.
* **`export`** renders every email to static `.html` and `.txt` files.
* **`add`** copies ready-made blocks and templates into your project.

```bash
npm install -D @ng-email/cli
```

```bash
npx ng-email build src/emails/index.ts -o dist/emails.mjs
```

```ts
// your Node service (worker, API, queue consumer, …)
import { renderEmailBoth, WelcomeEmail } from './dist/emails.mjs';

const { html, text } = await renderEmailBoth(WelcomeEmail, { inputs: { name: 'Ada' } });
```

## Why a build step

Angular's npm packages ship *partially compiled*. Plain Node cannot run them until the Angular Linker has processed them, and without the linker it fails with "needs to be compiled using the JIT compiler". `ng-email build` does three things:

1. **AOT-compiles** everything your entry imports with Angular's compiler, in memory, including strict template type-checking. A template error fails the build.
2. **Bundles** it with esbuild, running the **Angular Linker** over Angular, `@ng-email/*` and any other partially compiled Angular library.
3. **Re-exports** `renderEmail`, `renderEmailText`, `renderEmailBoth`, `toPlainText`, `EmailRenderError` and `XHTML_TRANSITIONAL_DOCTYPE` from the bundle. Your service then renders with the *same* linked Angular instance as the components. Importing `@ng-email/render` separately in the service would load an unlinked second copy.

It also writes `emails.d.mts`, which points back at your sources, so `inputs` stay type-checked in the service.

## Options

| Option | Default | |
|---|---|---|
| `-o, --outfile <file>` | `dist/emails.mjs` | output bundle |
| `-p, --tsconfig <file>` | nearest `tsconfig.json` above the entry | compiler options, including `angularCompilerOptions` |
| `--dev` | off | keep Angular dev mode (verbose errors, extra checks) |
| `--minify` | off | roughly halves the size |
| `--sourcemap` | off | write a `.map` file |
| `--external <pkg>` | none | leave a dependency as a runtime import (repeatable). Angular and `@ng-email/*` cannot be external |
| `--no-dts` | | skip the type declarations |

## `ng-email preview`

```bash
npx ng-email preview src/emails/index.ts
```

This opens a local preview at `http://127.0.0.1:3000/`. It lists every email, renders it in a sandboxed frame at desktop or mobile width, and shows the HTML source and the plain-text part. You can also edit the inputs as JSON and re-render with ⌘/Ctrl+Enter.

* **Live reload.** Saving a `.ts`, `.html`, `.css` or `.json` file rebuilds and refreshes the page. Rebuilds after the first take a few hundred ms, because Angular is linked only once and cached.
* **Errors stay readable.** A failed build shows the Angular diagnostic in the page and the terminal, and the last good build stays visible.
* **Isolated rendering.** Each build is rendered in a fresh worker thread, so module caches never go stale. There is no `vm`, Next.js or Angular CLI dev server involved.
* Use `/preview/<name>` to open an email as a plain page.
* Options: `--port` (`0` picks a free port), `--host` (default `127.0.0.1`), `--no-dev` (production mode), `-p <tsconfig>`.

## `ng-email export`

```bash
npx ng-email export src/emails/index.ts -o out
```

This writes `out/<name>.html` and `out/<name>.txt` for every email, rendered with its preview inputs. Use it for CI artifacts, visual diffing, or uploading templates. It exits with code 1 if any email fails to render.

## `ng-email add`

```bash
npx ng-email add header-centered order-summary welcome
```

This copies ready-made blocks and templates from the ng-email registry into `src/emails/blocks/` (change it with `-d`). You own the copied files and can edit them freely. Each file is a self-contained standalone component that depends only on `@ng-email/components`.

* `npx ng-email add --list` shows everything available.
* Existing files are never overwritten unless you pass `--overwrite`.
* `--registry <url|folder>` (or `NG_EMAIL_REGISTRY`) points at another registry, for example your own fork.
* After adding, it prints the import line and how to use the block (`<header-centered />` inside your email's template).

## `ng-email check`

```bash
npx ng-email check src/emails/index.ts
```

Renders every email with its preview inputs and reports inbox problems: Gmail clipping (over 102 kB), images without `alt`, relative URLs, flexbox and grid, missing preview text and more. Exits with 1 on errors, so it can gate CI. `--name <email>` checks one.

## `ng-email mcp`: for AI agents

```bash
claude mcp add ng-email -- npx -y @ng-email/cli mcp
```

Runs an [MCP](https://modelcontextprotocol.io) server on stdio, so coding agents (Claude Code, Cursor, VS Code, Codex, …) can list and add blocks, render and check your emails, and read the docs. Setup for each agent: [AI and agents](https://yshashi.github.io/ng-email/docs/ai-agents).

## Listing your emails

`preview` and `export` read an exported `emails` registry from the entry:

```ts
// src/emails/index.ts
import { defineEmail, defineEmails } from '@ng-email/render';
import { WelcomeEmail } from './welcome.email';
import { ReceiptEmail } from './receipt.email';

export { WelcomeEmail, ReceiptEmail };

export const emails = defineEmails({
  welcome: defineEmail(WelcomeEmail, { previewInputs: { name: 'Ada' }, description: 'Sent after sign-up' }),
  receipt: defineEmail(ReceiptEmail, { previewInputs: { lines: [{ name: 'Mug', price: 12.5 }] } }),
});
```

`previewInputs` are type-checked against each component's inputs. Without a registry, every exported component is listed under its export name and rendered with no inputs.

## Programmatic API

```ts
import { buildEmails, exportEmails, startPreview, angularLinkerPlugin } from '@ng-email/cli';

const result = await buildEmails({ entry: 'src/emails/index.ts', outfile: 'dist/emails.mjs', minify: true });
const preview = await startPreview({ entry: 'src/emails/index.ts', port: 0 });
console.log(preview.url);
await preview.close();
```

`angularLinkerPlugin({ cache })` is the esbuild plugin used internally, for your own esbuild setups. Pass `createLinkerCache()` to reuse linking work across builds.

## Size

Size is measured for a two-email project with Angular 22 in production mode. It covers Angular core, common and platform-server, the Domino DOM, and html-to-text:

| | size |
|---|---|
| default | ~2.2 MB |
| `--minify` | ~0.97 MB |

A build takes under a second.
