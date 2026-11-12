# Previewing and exporting

See your emails while you write them, and render all of them to files for review or CI.

## Live preview

```bash
npx ng-email preview src/emails/index.ts
```

This opens a local preview at `http://127.0.0.1:3000`:

- a list of your emails;
- each email in a sandboxed frame at desktop or mobile width;
- an **X-ray** toggle that outlines every table and cell;
- the HTML source and the plain-text part;
- an inputs editor (JSON) to render with other values; ⌘/Ctrl+Enter re-renders.

Saving any `.ts`, `.html`, `.css` or `.json` file in the project rebuilds. The first build links Angular and takes about a second; later rebuilds reuse that work. A failed build shows the compile error in the page and in the terminal, and the last good build stays visible. Open `/preview/<name>` to see one email as a plain page.

| Option | Default | |
|---|---|---|
| `--port <n>` | `3000` | `0` picks a free port |
| `--host <addr>` | `127.0.0.1` | Listen on another interface (only on trusted networks) |
| `--no-dev` | dev mode on | Preview in Angular production mode |
| `-p, --tsconfig <file>` | nearest | tsconfig to compile with |

Each rebuild renders in a fresh worker thread, so stale modules never linger between rebuilds.

## Which emails are listed

The preview reads the entry you pass it.

**With a registry (recommended).** Export `emails` from `defineEmails`. Each entry gets a URL-safe name, sample inputs and a description:

```ts
import { defineEmail, defineEmails } from '@ng-email/render';
import { ReceiptEmail } from './receipt.email';
import { WelcomeEmail } from './welcome.email';

export { ReceiptEmail, WelcomeEmail };

export const emails = defineEmails({
  welcome: defineEmail(WelcomeEmail, { previewInputs: { name: 'Ada' } }),
  receipt: defineEmail(ReceiptEmail, {
    previewInputs: { lines: [{ name: 'Mug', price: 12.5 }] },
    description: 'Order confirmation',
  }),
});
```

`previewInputs` are type-checked against each component's inputs. Names may contain letters, digits, `-` and `_`.

**Without a registry.** Every exported Angular component is listed under its export name and rendered with no inputs. Components with required inputs fail to render until you give them `previewInputs` through a registry.

## Exporting to files

```bash
npx ng-email export src/emails/index.ts -o out
```

This writes `out/<name>.html` and `out/<name>.txt` for every email, rendered with its preview inputs. Uses include:

- **CI artifacts:** attach the rendered emails to a pull request;
- **visual diffing:** compare renders between commits;
- **upload:** send templates to a provider that stores HTML.

The command exits with code 1 if any email fails to render. It still writes the others and names the failures.
