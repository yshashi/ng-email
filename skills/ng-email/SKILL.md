---
name: ng-email
description: Build, preview, check and send HTML emails as standalone Angular components with ng-email (@ng-email/render, @ng-email/components, @ng-email/cli). Use when the user wants to create or change a transactional or marketing email in an Angular or Node project, render an Angular component to email HTML or plain text, add ready-made email blocks or templates (welcome, receipt, password reset, sign-in code, invite), or fix an email that breaks in Gmail, Outlook or Apple Mail.
---

# ng-email

ng-email renders standalone Angular components to the table-based, inline-styled HTML that email clients expect, plus a plain-text version. You write Angular; the components and the renderer handle Outlook, Gmail and Yahoo quirks.

Docs for agents: https://yshashi.github.io/ng-email/llms.txt (index) and `https://yshashi.github.io/ng-email/docs/<page>.md` (pages: `first-email`, `components`, `styling`, `rendering`, `sending`, `blocks`, `cli`, `api`).

If the ng-email MCP server is connected (tools named `list_blocks`, `get_block`, `add_blocks`, `render_email`, `check_email`, `get_docs`), prefer its tools over the shell commands below.

## Workflow

1. **Check the setup.** `@ng-email/render` and `@ng-email/components` must be dependencies and `@ng-email/cli` a dev dependency, on Angular 22 and TypeScript 6.0. If they are missing, install them:
   ```bash
   npm install @ng-email/render @ng-email/components
   npm install -D @ng-email/cli
   ```
   A project that is not an Angular app also needs `@angular/core@22 @angular/common@22 @angular/platform-browser@22 @angular/platform-server@22 rxjs` and, as dev dependencies, `@angular/compiler@22 @angular/compiler-cli@22 typescript@~6.0`.
2. **Start from a block or template when one fits.** `npx ng-email add --list` shows them; `npx ng-email add welcome footer-simple` copies them into `src/emails/blocks/` as editable files.
3. **Write the email** as a standalone component (rules below), in `src/emails/<name>.email.ts`.
4. **Register it** in the entry file, `src/emails/index.ts`, with sample `previewInputs`.
5. **Check it:** `npx ng-email check src/emails/index.ts`. It compiles every email, renders it with its preview inputs and reports problems (Gmail clipping, images without alt, relative URLs, flexbox, missing preview text). Fix every `✖` error. Exit code 1 means errors remain.
6. **Tell the user how to look at it:** `npx ng-email preview src/emails/index.ts` opens a live preview with desktop and mobile widths, the plain-text part and an X-ray of the tables.
7. **Ship it:** `npx ng-email build src/emails/index.ts -o dist/emails.mjs`, then import `renderEmailBoth` *from that bundle* in the service.

## An email component

```ts
// src/emails/welcome.email.ts
import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

@Component({
  selector: 'welcome-email',
  imports: [EMAIL_COMPONENTS],
  template: `
    <html ngeHtml>
      <head ngeHead><title>Welcome to Acme</title></head>
      <body ngeBody [ngeStyle]="{ backgroundColor: '#f3f4f6' }">
        <nge-preview [text]="'Your workspace is ready, ' + name()" />
        <table ngeContainer [ngeStyle]="{ backgroundColor: '#ffffff', padding: '32px' }">
          <h1 ngeHeading [mt]="0">Welcome, {{ name() }}</h1>
          <p ngeText>Your workspace is ready. Here is where to start.</p>
          <a ngeButton [href]="url()"
             [ngeStyle]="{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px 20px', borderRadius: '8px' }">
            Open your dashboard
          </a>
          <img ngeImg src="https://example.com/logo.png" width="120" height="36" alt="Acme" />
        </table>
      </body>
    </html>
  `,
})
export class WelcomeEmail {
  readonly name = input.required<string>();
  readonly url = input.required<string>();
}
```

```ts
// src/emails/index.ts
import { defineEmail, defineEmails } from '@ng-email/render';
import { WelcomeEmail } from './welcome.email';

export { WelcomeEmail };

export const emails = defineEmails({
  welcome: defineEmail(WelcomeEmail, {
    previewInputs: { name: 'Ada', url: 'https://example.com/app' },
    description: 'Sent after sign-up',
  }),
});
```

## Rules

- **Skeleton:** `<html ngeHtml>`, `<head ngeHead>` (with a `<title>`), `<body ngeBody>`, then `<nge-preview [text]>` first in the body.
- **Layout is tables.** Wrap content in `<table ngeContainer>` (centered, max 600px). Use `<table ngeSection>` for full-width bands and `<table ngeRow>` with `<td ngeColumn>` for columns, giving columns a `width` in `ngeStyle`. Never flexbox, grid or `position`.
- **Styles go in `[ngeStyle]`** (object or CSS string; numbers become px). Never use component `styles`/`styleUrl` (the renderer throws `COMPONENT_STYLES`), `[style.x]` or `[ngStyle]`. On plain elements use `[attr.style]="'color:#111'"`.
- **Per-recipient values are signal inputs** (`input()` / `input.required()`), passed with `renderEmailBoth(Email, { inputs: { … } })`.
- **Images:** absolute `https://` URLs, `width` and `height` attributes, meaningful `alt` (`alt=""` only for decoration). Dynamic URLs: `[attr.src]="logo()"`.
- **Links and buttons:** absolute URLs. `a ngeButton` sets Outlook-safe padding; give its padding in px, em, rem or %.
- **Outlook:** it ignores `border-radius`, `box-shadow` and background images. Designs must still work with square corners and a solid `background-color`.
- **Fonts:** declare web fonts with `<nge-font>` inside the head, always with `fallbackFontFamily`.
- **Size:** keep the HTML under 102 kB, or Gmail clips it.
- **Rendering in a service:** import `renderEmailBoth` from the built bundle, not from `@ng-email/render`. The bundle carries the compiled copy of Angular the emails were built with.

## Components at a glance

| Use as | Purpose |
|---|---|
| `html ngeHtml`, `head ngeHead`, `body ngeBody` | Document skeleton with the metas clients need |
| `nge-preview [text]` | Inbox preview text (hidden in the email) |
| `table ngeContainer` / `table ngeSection` | Centered 600px column / full-width band |
| `table ngeRow` + `td ngeColumn` | Columns |
| `p ngeText`, `h1–h6 ngeHeading` (`[mt]`, `[mb]`, …) | Text |
| `a ngeLink [href]`, `a ngeButton [href]` | Link, button with Outlook padding |
| `img ngeImg`, `hr ngeHr` | Image without gaps or borders, divider |
| `nge-font` | Web font with fallbacks, including Outlook's |

Full inputs: https://yshashi.github.io/ng-email/docs/components.md

## Commands

| Command | Does |
|---|---|
| `npx ng-email add --list` / `add <name…>` | List / copy blocks and templates into `src/emails/blocks` |
| `npx ng-email check <entry>` | Render every email and report inbox problems |
| `npx ng-email preview <entry>` | Live preview in the browser |
| `npx ng-email export <entry> -o out` | Write `<name>.html` and `<name>.txt` for every email |
| `npx ng-email build <entry> -o dist/emails.mjs` | Bundle the emails for a Node service |
| `npx ng-email mcp` | The MCP server for agents |

## When something fails

- `NG0950` / "required input": the email needs inputs; add `previewInputs` in `defineEmails`.
- `COMPONENT_STYLES`: move styles from `styles` to `[ngeStyle]`.
- `UNKNOWN_INPUT`: an input name passed to `renderEmail` doesn't exist on the component.
- Compile errors name the file and line; fix them and run `ng-email check` again.
