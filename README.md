# ng-email

Build transactional emails as standalone Angular components, and render them to HTML that email clients accept.

> Status: early. `@ng-email/render` works and is tested. Components and the preview app are next. Nothing is published to npm yet.

| Package | Status |
|---|---|
| [`@ng-email/render`](packages/render) | implemented: render, cleanup, plain text |
| `@ng-email/components` | planned (Html, Head, Body, Preview, Container, Section, Row, Column, Text, Heading, Link, Button, Img, Hr, Font) |
| `@ng-email/preview` | planned (Angular CLI dev-server based preview + export) |

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

`npm test` compiles each package fully ahead of time with `ngc`, links Angular with esbuild, and runs `node --test` twice: once in Angular dev mode and once in prod mode. The two modes emit different markers, so cleanup has to be proven against both.

`spike/` holds the original feasibility spike. It is kept for reference.

## Acknowledgements

The component behavior and email-client workarounds are modeled on [react-email](https://github.com/resend/react-email) (MIT, Plus Five Five, Inc.) and [vue-email](https://github.com/vue-email/vue-email) (MIT, Vue Email). This is a clean-room reimplementation, and no code was copied.

## License

MIT
