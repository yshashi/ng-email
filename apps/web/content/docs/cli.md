# CLI

The `ng-email` command from `@ng-email/cli`.

```bash
npm install -D @ng-email/cli
```

```bash
npx ng-email --help
```

## ng-email build

Compile your emails and bundle them into one ES module that any Node service can import.

```bash
npx ng-email build src/emails/index.ts -o dist/emails.mjs
```

The build:

1. compiles everything the entry imports with Angular's AOT compiler, type-checking templates;
2. bundles it with esbuild, running the Angular Linker over Angular and any other partially compiled library;
3. re-exports `renderEmail`, `renderEmailText`, `renderEmailBoth`, `toPlainText`, `EmailRenderError`, `defineEmail` and `defineEmails`.

Your service renders with the same Angular instance the emails were compiled against. A template error fails the build and prints Angular's diagnostic.

| Option | Default | |
|---|---|---|
| `-o, --outfile <file>` | `dist/emails.mjs` | Output bundle |
| `-p, --tsconfig <file>` | nearest to the entry | Compiler options, including `angularCompilerOptions` |
| `--dev` | off | Keep Angular dev mode (full error messages) |
| `--minify` | off | Roughly halves the size |
| `--sourcemap` | off | Write a `.map` file |
| `--external <pkg>` | none | Leave a dependency as a runtime import (repeatable). Angular and `@ng-email/*` can't be external. |
| `--no-dts` | | Skip `emails.d.mts` |

## ng-email preview

A live preview in the browser that rebuilds on every save. See [Previewing and exporting](/docs/preview-and-export).

```bash
npx ng-email preview src/emails/index.ts
```

| Option | Default | |
|---|---|---|
| `--port <n>` | `3000` | `0` picks a free port |
| `--host <addr>` | `127.0.0.1` | Interface to listen on |
| `--no-dev` | dev mode on | Preview in production mode |
| `-p, --tsconfig <file>` | nearest | |

## ng-email export

Render every email to `<name>.html` and `<name>.txt`, using its preview inputs.

```bash
npx ng-email export src/emails/index.ts -o out
```

| Option | Default | |
|---|---|---|
| `-o, --outdir <dir>` | `out` | Output folder |
| `-p, --tsconfig <file>` | nearest | |
| `--dev` | off | Angular dev mode |

The command exits with code 1 if any email fails to render.

## ng-email add

Copy blocks and templates from the ng-email registry into your project. See [Blocks and templates](/docs/blocks). Available from `@ng-email/cli` 0.2.0.

```bash
npx ng-email add header-centered welcome
```

| Option | Default | |
|---|---|---|
| `-d, --dir <dir>` | `src/emails/blocks` | Where files are written |
| `--list` | | List the registry |
| `--overwrite` | off | Replace existing files |
| `--registry <url\|folder>` | the ng-email website | Also settable with `NG_EMAIL_REGISTRY` |

## ng-email check

```bash
npx ng-email check src/emails/index.ts
```

Renders every email with its preview inputs and reports inbox problems: HTML over Gmail's 102 kB clipping limit, images without `alt`, relative links, flexbox and more. See the [full list](/docs/ai-agents#check-emails). Exits with 1 when an email has an error, so it can run in CI. Available from 0.3.0.

| Option | Default | |
|---|---|---|
| `--name <email>` | all | Check one email (repeatable) |
| `-p, --tsconfig <file>` | nearest | |

## ng-email mcp

```bash
npx -y @ng-email/cli mcp
```

Runs the MCP server for AI agents on stdio. See [AI and agents](/docs/ai-agents#mcp-server) for how to connect it. Available from 0.3.0.

| Option | Default | |
|---|---|---|
| `--registry <url\|folder>` | the ng-email website | Registry for the block tools |

## Programmatic API

Everything the CLI does is available from `@ng-email/cli`:

```ts
import { buildEmails, exportEmails, startPreview, addBlocks } from '@ng-email/cli';

const build = await buildEmails({ entry: 'src/emails/index.ts', outfile: 'dist/emails.mjs', minify: true });
// → { outfile, dtsFile, bytes, durationMs, mode }

const exported = await exportEmails({ entry: 'src/emails/index.ts', outdir: 'out' });
// → { outdir, written, failed }

const preview = await startPreview({ entry: 'src/emails/index.ts', port: 0 });
console.log(preview.url);
await preview.close();
```

| Export | |
|---|---|
| `buildEmails(options)` | `ng-email build`; throws `BuildError` (with `details`) on failure |
| `exportEmails(options)` | `ng-email export` |
| `startPreview(options)` | `ng-email preview`; returns `{ url, state(), rebuild(), close() }` |
| `addBlocks(options)`, `listRegistry(registry?)` | `ng-email add`; throws `RegistryError` |
| `loadCatalog(bundleUrl)` | Lists and renders the emails in a built bundle |
| `renderEntry(options)` | Builds an entry in memory, then renders and checks its emails |
| `checkEmailHtml(html, text?)` | The `ng-email check` rules, on any HTML |
| `createMcpServer(options?)`, `runMcpServer(options?)` | The MCP server, to embed or run |
| `angularLinkerPlugin({ cache? })`, `createLinkerCache()` | The esbuild plugin that links Angular, for your own builds |
