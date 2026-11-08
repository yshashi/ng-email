# @ng-email/components

Standalone Angular components for HTML email. Each component renders the markup and email-client workarounds that Outlook, Gmail, Yahoo and Apple Mail need. Render emails built from them with [`@ng-email/render`](../render).

```ts
import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

@Component({
  selector: 'welcome-email',
  imports: [EMAIL_COMPONENTS],
  template: `
    <html ngeHtml>
      <head ngeHead><title>Welcome</title></head>
      <body ngeBody [ngeStyle]="{ backgroundColor: '#f6f9fc' }">
        <nge-preview [text]="'Confirm your email, ' + name()" />
        <table ngeContainer [ngeStyle]="{ backgroundColor: '#ffffff', padding: '20px 0 48px' }">
          <h1 ngeHeading [mt]="0">Welcome, {{ name() }}</h1>
          <p ngeText>Thanks for signing up.</p>
          <a ngeButton [href]="url()" [ngeStyle]="{ backgroundColor: '#5469d4', color: '#fff', padding: '12px 20px' }">
            Confirm email
          </a>
        </table>
      </body>
    </html>`,
})
export class WelcomeEmail {
  readonly name = input.required<string>();
  readonly url = input.required<string>();
}
```

```ts
const html = await renderEmail(WelcomeEmail, { inputs: { name: 'Ada', url: 'https://…' } });
```

## Components

Most components are **attribute selectors on the real element**, so the component host *is* the email tag. `nge-preview` and `nge-font` are elements that the renderer unwraps.

| Component | Use as | What it does |
|---|---|---|
| `EmailHtml` | `<html ngeHtml>` | `lang="en"`, `dir="ltr"` defaults |
| `EmailHead` | `<head ngeHead>` | adds the charset meta and `x-apple-disable-message-reformatting` |
| `EmailBody` | `<body ngeBody>` | keeps only the background on `<body>`, and puts the full style on an inner table cell (Yahoo/AOL drop body styles) |
| `EmailPreview` | `<nge-preview [text]>` | hidden inbox preview text, 200 chars max, padded with invisible characters, left out of plain text |
| `EmailContainer` | `<table ngeContainer>` | centered presentation table, max 37.5em (600px), with padding moved to the cell (Outlook) |
| `EmailSection` | `<table ngeSection>` | full-width presentation table with padding on the cell |
| `EmailRow` / `EmailColumn` | `<table ngeRow>` + `<td ngeColumn>` | columns |
| `EmailText` | `<p ngeText>` | 14px / 24px, 16px vertical margin, `margin` shorthand expanded |
| `EmailHeading` | `<h1 ngeHeading>` … `<h6>` | `m`, `mx`, `my`, `mt`, `mr`, `mb`, `ml` margin inputs |
| `EmailLink` | `<a ngeLink>` | `target="_blank"`, default color, no underline |
| `EmailButton` | `<a ngeButton>` | CSS padding plus Outlook hair-space padding and `mso-text-raise` |
| `EmailImg` | `<img ngeImg>` | `display:block`, no border or outline, `alt=""` default |
| `EmailHr` | `<hr ngeHr>` | consistent 1px rule |
| `EmailFont` | `<nge-font>` inside `<head ngeHead>` | `@font-face` with an Outlook `mso-font-alt` fallback |

## Styles

Pass styles with `ngeStyle`, either as a string (`'color:#333;padding:8px'`) or an object (`{ color: '#333', padding: 8 }`). Numbers become `px`, except unitless properties such as `lineHeight` and `fontWeight`. The components build the `style` attribute text themselves, so non-standard `mso-*` properties survive exactly as written.

Do not use component `styles`, `styleUrl` or `[style.x]` in emails. Use `ngeStyle`, or a `<style>` inside `<head ngeHead>`.
