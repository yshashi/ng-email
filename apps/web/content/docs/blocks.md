# Blocks and templates

Start from ready-made sections and complete emails, then make them yours.

The [components gallery](/components) has blocks: sections such as headers, pricing cards and order summaries that you drop into an email. The [templates gallery](/templates) has complete emails: welcome, receipt, password reset, sign-in code and team invite. Each one is a single, self-contained Angular component whose only dependency is `@ng-email/components`.

## Add them with the CLI

> `ng-email add` ships in `@ng-email/cli` 0.2.0. With 0.1.0, copy the code from the gallery's **Angular** tab instead.

```bash
npx ng-email add header-centered order-summary footer-simple
```

The files are written to `src/emails/blocks/`. For each one the command prints the import line and how to use it:

```text
✔ Added header-centered → src/emails/blocks/header-centered.ts
    import { HeaderCentered } from './src/emails/blocks/header-centered';
    use it inside an email template: <header-centered />
```

| Option | |
|---|---|
| `--list` | Show every block and template in the registry |
| `-d, --dir <dir>` | Write somewhere other than `src/emails/blocks` |
| `--overwrite` | Replace files that already exist. Without it, your edits are never touched. |
| `--registry <url\|folder>` | Use another registry, such as a fork or a local folder. `NG_EMAIL_REGISTRY` does the same. |

If the project doesn't have `@ng-email/components` installed yet, the command says so.

## Use a block

Blocks are sections designed for a 600px container. Import the class and use its element inside your email's `table ngeContainer`:

```angular-ts
import { Component } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';
import { FooterSimple } from './blocks/footer-simple';
import { HeaderCentered } from './blocks/header-centered';

@Component({
  selector: 'newsletter-email',
  imports: [EMAIL_COMPONENTS, HeaderCentered, FooterSimple],
  template: `
    <html ngeHtml>
      <head ngeHead></head>
      <body ngeBody>
        <table ngeContainer>
          <header-centered [brand]="'Lumen'" />
          <p ngeText>This month in Lumen…</p>
          <footer-simple />
        </table>
      </body>
    </html>
  `,
})
export class NewsletterEmail {}
```

Every block input has a sample default, so a block renders before you set anything. Override what you need, such as `[brand]` above. The block's element (`<header-centered>`) is removed during rendering; only its email markup remains.

## Use a template

Templates are complete documents. Render them directly, or add them to your [registry](/docs/preview-and-export#which-emails-are-listed):

```ts
import { renderEmailBoth, WelcomeEmail } from './dist/emails.mjs';

const { html, text } = await renderEmailBoth(WelcomeEmail, {
  inputs: { name: 'Priya', workspace: 'priya-design', dashboardUrl: 'https://example.com/app' },
});
```

## Make it yours

The copied file is your code. Change the copy, colors, spacing or structure freely. Each file keeps its styles in one object near the bottom and its font stack in a `FONT` constant, so restyling is quick. Images point at the ng-email website. Replace them with your own hosted images before sending.

## Safety

`ng-email add` treats registry data as untrusted. It only writes plain `.ts` file names into the folder you chose. An entry with a path such as `../escaped.ts` is refused, and nothing is written.
