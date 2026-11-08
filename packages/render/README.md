# @ng-email/render

Render a standalone Angular component to email-client-safe HTML and plain text on the server. No browser is needed.

```ts
import { renderEmail, renderEmailBoth } from '@ng-email/render';
import { WelcomeEmail } from './emails/welcome.email';

const html = await renderEmail(WelcomeEmail, { inputs: { name: 'Ada' } });
const { html: body, text } = await renderEmailBoth(WelcomeEmail, { inputs: { name: 'Ada' } });
```

## What it guarantees

* `inputs` are type-checked against the component's signal inputs. Unknown names are rejected before rendering.
* Async work (`resource`, pending tasks) is finished before the HTML is serialized.
* Any error thrown while rendering **rejects the promise**. You never get partial HTML.
* Angular artifacts are removed: `ng-version`, `ng-server-context`, `_nghost`/`_ngcontent`, `ng-reflect-*`, `ngh`, `nge*` selector attributes, and anchor comments. Component host elements whose tag contains a hyphen are unwrapped.
* Outlook conditional comments (`<!--[if mso]>…<![endif]-->`) are **kept**.
* A full document (output starting with `<html>`) gets the XHTML 1.0 Transitional doctype. Fragments get none.
* Component `styles` / `styleUrl` raise `EmailRenderError('COMPONENT_STYLES')` instead of being silently lost.

## Writing email components

* Use `encapsulation: ViewEncapsulation.None` and no `styles`. Put styles inline.
* `<html>`, `<head>` and `<body>` can sit directly in a component template.
* Comments in templates are stripped by Angular. To emit an Outlook conditional, bind trusted HTML: `[innerHTML]="sanitizer.bypassSecurityTrustHtml(constantString)"`. Never pass user data through the bypass.
* Domino normalizes *static* `style` attributes (`color:red` becomes `color: red;`). Bind `[attr.style]` when the exact text matters.

## Running outside the Angular CLI

Angular's npm packages ship partially compiled, so plain `node` cannot run them as published. Do one of the following:

* render from a server bundle built by the Angular CLI (`@angular/build:application` with SSR), or
* bundle your entry point with the Angular Linker (`@angular/compiler-cli/linker/babel`). See [`tools/run-tests.mjs`](../../tools/run-tests.mjs) for a working esbuild setup.

## API

| Export | |
|---|---|
| `renderEmail(component, { inputs, providers, doctype })` | HTML string |
| `renderEmailText(component, { …, htmlToText })` | plain text |
| `renderEmailBoth(component, { … })` | `{ html, text }` from one render |
| `toPlainText(html, options)` / `plainTextSelectors` | html-to-text with email defaults |
| `cleanupEmailHtml(html)` | string-level cleanup for HTML from elsewhere |
| `EmailRenderError` (`code`) | `NOT_A_COMPONENT`, `UNKNOWN_INPUT`, `COMPONENT_STYLES`, `SCRIPT_IN_OUTPUT`, `NO_OUTPUT` |
