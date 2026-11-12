# Rendering

Turn a component into email HTML and plain text, and learn what the renderer guarantees.

## The three functions

```ts
import { renderEmail, renderEmailText, renderEmailBoth } from './dist/emails.mjs';

const html = await renderEmail(WelcomeEmail, { inputs: { name: 'Ada' } });
const text = await renderEmailText(WelcomeEmail, { inputs: { name: 'Ada' } });
const both = await renderEmailBoth(WelcomeEmail, { inputs: { name: 'Ada' } }); // { html, text }
```

Prefer `renderEmailBoth` when you send both parts: it renders once and derives the text from that render.

Import these from your [`ng-email build`](/docs/cli#ng-email-build) bundle, as shown above. The bundle re-exports them alongside your emails.

## Options

| Option | Type | |
|---|---|---|
| `inputs` | object | Values for the component's signal inputs, type-checked against them. Unknown names are rejected before rendering. |
| `providers` | `Provider[]` | Providers for this render, for example a service your email injects. |
| `doctype` | `string \| false` | Doctype for full documents. Defaults to XHTML 1.0 Transitional. `false` omits it. |
| `htmlToText` | `HtmlToTextOptions` | For `renderEmailText` and `renderEmailBoth`: options passed to html-to-text. |

```ts
await renderEmail(InvoiceEmail, {
  inputs: { invoiceId: 'INV-2041' },
  providers: [{ provide: LOCALE_ID, useValue: 'de-DE' }],
});
```

## What the renderer guarantees

- **A clean document.** No `ng-version`, `_ngcontent`, `ng-reflect-*` or hydration attributes. No component host tags: any element with a hyphen in its name is unwrapped. No Angular comments.
- **Outlook comments kept.** `<!--[if mso]>…<![endif]-->` blocks survive, because email clients rely on them.
- **The doctype only where it belongs.** Output that starts with `<html>` gets the doctype. A fragment, such as a single block, doesn't.
- **Finished async work.** Rendering waits until the app is stable, so data loaded with `resource()` or tracked by `PendingTasks` is in the output.
- **Errors reject.** An error thrown while rendering, or a missing required input, rejects the promise. You never get half an email.
- **No silent style loss.** Component `styles`/`styleUrl` raise an error instead of disappearing. See [Styling](/docs/styling).

## Errors

The renderer's own checks throw `EmailRenderError` with a `code`:

| Code | Meaning |
|---|---|
| `NOT_A_COMPONENT` | The class passed in isn't an Angular component. |
| `UNKNOWN_INPUT` | `inputs` contains a name the component doesn't declare. |
| `COMPONENT_STYLES` | A rendered component declares `styles` or `styleUrl`. |
| `SCRIPT_IN_OUTPUT` | The output contains a `<script>` element. |
| `NO_OUTPUT` | Angular finished without producing the email. |

```ts
import { EmailRenderError, renderEmail } from './dist/emails.mjs';

try {
  await renderEmail(WelcomeEmail, { inputs });
} catch (error) {
  if (error instanceof EmailRenderError && error.code === 'UNKNOWN_INPUT') {
    // a caller passed a field the template doesn't have
  }
  throw error;
}
```

Errors from your own component are rethrown unchanged. In production builds, Angular shortens its errors to codes. For example, `NG0950` means a required input wasn't set. Build with `--dev` to get the full messages.

## Plain text

The text part is derived from the rendered HTML:

- Images are left out.
- Elements marked `data-skip-in-text="true"` are left out. The preview text (`<nge-preview>`) is marked this way.
- Links render as `label url`, and just the URL when the label already is the URL.
- A table marked `data-text-format="dataTable"` becomes aligned rows.
- Lines aren't wrapped.

```html
<p data-skip-in-text="true">Only in the HTML version</p>
```

Pass `htmlToText` to adjust the conversion. Your selectors are added after the defaults rather than replacing them.

## Rendering without the CLI

`renderEmail` works in any environment where Angular itself runs: Angular's compiler has processed your components (AOT) and the Angular Linker has processed the framework packages. `ng-email build` does both for you, and its output is tested by rendering from an empty folder with plain `node`. If you assemble your own build, `angularLinkerPlugin()` from `@ng-email/cli` is the esbuild plugin it uses.
