# ng-email

Build transactional emails as standalone Angular components, and render them to HTML that email clients accept.

> Status: early. 0.1.0 is on npm. The website (docs, block gallery and templates) is built and not yet deployed; publishing it to GitHub Pages is next.

```bash
npm install @ng-email/render @ng-email/components
```
```bash
npm install -D @ng-email/cli
```

| Package | Status |
|---|---|
| [`@ng-email/render`](packages/render) | 0.1.0 on npm: render, cleanup, plain text, `defineEmails` |
| [`@ng-email/components`](packages/components) | 0.1.0 on npm: Html, Head, Body, Preview, Container, Section, Row, Column, Text, Heading, Link, Button, Img, Hr, Font |
| [`@ng-email/cli`](packages/cli) | 0.1.0 on npm: `ng-email build` (self-contained bundle for plain Node), `preview` (live browser preview), `export` (static `.html`/`.txt`). `add` (copy blocks into your project) is unreleased |
| [`packages/blocks`](packages/blocks) | not published: source of 21 copy-paste blocks and 5 templates, plus the JSON registry behind `ng-email add` and the website |
| [`apps/web`](apps/web) | the website: a prerendered Angular app with the docs, block gallery and templates gallery, for GitHub Pages |

Design: [docs/angular-email-design.md](docs/angular-email-design.md). Research behind it: [docs/reverse-engineering-notes.md](docs/reverse-engineering-notes.md).

## Development

Requires Node `^22.22.3 || ^24.15.0 || >=26` (Angular 22).

```bash
npm install
```

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run build
```

`npm test` builds every package, then does two things:

* It compiles `render` and `components` fully ahead of time with `ngc`, links Angular with esbuild, and runs `node --test` twice: once in Angular dev mode and once in prod mode. The two modes emit different markers, so cleanup has to be proven against both.
* It runs the `ng-email build` end-to-end tests. These build a sample project and render the bundle from an empty temp directory with plain `node`.
* It runs the blocks registry and `ng-email add` tests.
* It builds the website for GitHub Pages and checks every prerendered route (`npm run test:web`).

To work on the website:

```bash
npm run build && npm run start:web
```

`spike/` holds the original feasibility spike. It is kept for reference.

## Acknowledgements

The component behavior and email-client workarounds are modeled on [react-email](https://github.com/resend/react-email) (MIT, Plus Five Five, Inc.) and [vue-email](https://github.com/vue-email/vue-email) (MIT, Vue Email). This is a clean-room reimplementation, and no code was copied.

## License

MIT
