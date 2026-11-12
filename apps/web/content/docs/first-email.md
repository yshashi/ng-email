# Your first email

Write a welcome email, preview it in the browser, and render it from a Node script. This takes about ten minutes.

This guide assumes you have [installed](/docs/installation) the packages.

## 1. Write the component

An email is a standalone component. Import `EMAIL_COMPONENTS` and build the template from the email components. Every value that changes per recipient is a signal input.

```angular-ts
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
          <a
            ngeButton
            [href]="url()"
            [ngeStyle]="{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px 20px', borderRadius: '8px' }"
          >Open your dashboard</a>
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

A few things to notice:

- `<html ngeHtml>`, `<head ngeHead>` and `<body ngeBody>` build the document skeleton, including the metas email clients need.
- `<nge-preview>` sets the inbox preview text, the line shown under the subject.
- `<table ngeContainer>` centers the content at up to 600px, the standard email width.
- Styles go in `[ngeStyle]`, never in component `styles`. See [Styling](/docs/styling).

## 2. List your emails

Create an entry file that exports a registry. `previewInputs` are the sample values the preview uses. They are type-checked against the component's inputs.

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

## 3. Preview it

```bash
npx ng-email preview src/emails/index.ts
```

Open `http://127.0.0.1:3000`. Every save rebuilds the preview. Switch between desktop and mobile widths, read the plain-text part, and turn on **X-ray** to see the table structure ng-email generated. If you break the template, the compile error shows in the page, and the last good version stays visible.

## 4. Build it for your service

```bash
npx ng-email build src/emails/index.ts -o dist/emails.mjs
```

This compiles the emails ahead of time and bundles them, Angular included, into a single file. The file also re-exports the render functions.

## 5. Render it

```ts
// scripts/try-email.mjs
import { renderEmailBoth, WelcomeEmail } from '../dist/emails.mjs';

const { html, text } = await renderEmailBoth(WelcomeEmail, {
  inputs: { name: 'Grace', url: 'https://example.com/app' },
});

console.log(html.slice(0, 200));
console.log(text);
```

> **Import the render functions from the bundle,** not from `@ng-email/render`. The bundle contains the compiled, linked copy of Angular that your emails were built with. A second, separately imported copy can't render them.

Next: [send it](/docs/sending), or learn what the renderer guarantees in [Rendering](/docs/rendering).
