# Introduction

ng-email lets you write HTML emails as standalone Angular components and render them into the table-based, inline-styled HTML that email clients expect.

Email HTML is its own dialect. Layout is nested tables, styles must be inline, Outlook ignores padding on links, and some clients strip `<body>` styles. ng-email puts those rules into a small set of components, so you write Angular templates with signal inputs and get markup that holds up in the inbox.

```angular-ts
@Component({
  selector: 'welcome-email',
  imports: [EMAIL_COMPONENTS],
  template: `
    <html ngeHtml>
      <body ngeBody>
        <table ngeContainer>
          <h1 ngeHeading>Welcome, {{ name() }}</h1>
          <a ngeButton [href]="url()" [ngeStyle]="{ padding: '12px 20px' }">Open dashboard</a>
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
const { html, text } = await renderEmailBoth(WelcomeEmail, {
  inputs: { name: 'Ada', url: 'https://example.com/app' },
});
```

## What you get

- **Components for email layout.** Fifteen primitives, including `Html`, `Body`, `Container`, `Section`, `Row`, `Column`, `Text`, `Heading`, `Button` and `Img`. Each renders the email-safe markup for its job. They are attribute components on real elements (`<table ngeContainer>`), so no custom tags reach the inbox.
- **A renderer.** `renderEmail()` turns a component into a complete HTML document with an XHTML doctype. It removes everything Angular adds (`ng-version`, component hosts, comments) and keeps Outlook's conditional comments. `renderEmailText()` produces the plain-text part.
- **A CLI.**
  - `ng-email preview` gives you a live preview with desktop and mobile widths and an X-ray of the table structure.
  - `ng-email build` bundles your emails into one file that any Node service can import.
  - `ng-email export` writes static `.html` and `.txt` files.
  - `ng-email add` copies ready-made blocks into your project.
- **Blocks and templates.** Over twenty [copy-paste blocks](/components) and five [complete templates](/templates), each one a self-contained Angular component you own and can edit.

## How it works

ng-email renders with Angular's own server renderer, `@angular/platform-server`. No browser is involved. After rendering, it cleans the document: it unwraps component host elements, strips Angular's attributes and comments, and refuses output that contains scripts or component styles. Your component's inputs are set with `ComponentRef.setInput`, so they are type-checked against its signal inputs.

Angular's npm packages ship partially compiled, so plain Node can't run them as published. `ng-email build` handles that: it compiles your emails ahead of time and runs the Angular Linker, producing a bundle that runs anywhere Node does.

## Packages

| Package | What it does |
|---|---|
| `@ng-email/render` | `renderEmail`, `renderEmailText`, `renderEmailBoth`, plain-text conversion, the `defineEmails` registry |
| `@ng-email/components` | The email components and `EMAIL_COMPONENTS` |
| `@ng-email/cli` | The `ng-email` command: `build`, `preview`, `export`, `add` |

## Status

ng-email is young (0.x). The rendering pipeline and every component are covered by tests that run in both Angular dev and production mode. The email-client workarounds follow well-known client behavior: presentation tables, padding on cells, the Outlook button fix, and body styles moved to an inner cell. They have **not yet been checked across a full client matrix** such as Litmus or Email on Acid. If something renders wrong in a client, please [open an issue](https://github.com/yshashi/ng-email/issues) with the client and version.

ng-email is a community project and is not affiliated with the Angular team or Google. Its component behavior is modeled on [react-email](https://github.com/resend/react-email) and [vue-email](https://github.com/vue-email/vue-email); it is a clean-room implementation.

Next: [install ng-email](/docs/installation).
