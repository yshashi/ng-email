# @ng-email/cli

`ng-email build` turns your Angular email components into **one self-contained ES module** that any plain Node service can import. You don't need the Angular CLI or a runtime compiler, and the output has no `node_modules` of its own.

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

## Programmatic API

```ts
import { buildEmails, angularLinkerPlugin } from '@ng-email/cli';

const result = await buildEmails({ entry: 'src/emails/index.ts', outfile: 'dist/emails.mjs', minify: true });
```

`angularLinkerPlugin()` is the esbuild plugin used internally, for your own esbuild setups.

## Size

Size is measured for a two-email project with Angular 22 in production mode. It covers Angular core, common and platform-server, the Domino DOM, and html-to-text:

| | size |
|---|---|
| default | ~2.2 MB |
| `--minify` | ~0.97 MB |

A build takes under a second.
