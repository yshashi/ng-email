# Installation

Add ng-email to an existing Angular project or to any TypeScript project that will render emails.

## Requirements

| | Version |
|---|---|
| Angular | 22 (`@angular/core`, `common`, `platform-browser`, `platform-server`) |
| TypeScript | 6.0 |
| Node | 22.22.3+, 24.15+ or 26+ |

## Install the packages

The renderer and the components are runtime dependencies. The CLI is a dev dependency.

```bash
npm install @ng-email/render @ng-email/components
```

```bash
npm install -D @ng-email/cli
```

If your project isn't an Angular app yet, add the Angular packages ng-email needs:

```bash
npm install @angular/core@22 @angular/common@22 @angular/platform-browser@22 @angular/platform-server@22 rxjs
```

```bash
npm install -D @angular/compiler@22 @angular/compiler-cli@22 typescript@~6.0
```

## TypeScript configuration

`ng-email build` and `ng-email preview` compile your emails with the nearest `tsconfig.json`. Any Angular 22 workspace config works. For a standalone setup, this is enough:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true
  }
}
```

With `strictTemplates`, template mistakes such as a misspelled input or a wrong type fail the build instead of producing a broken email.

## Where to put your emails

A common layout is one folder with an entry file that lists every email:

```text
src/emails/
  index.ts             ← exports the emails (an ng-email "registry")
  welcome.email.ts
  receipt.email.ts
  blocks/              ← blocks added with `ng-email add`
```

Next: [build your first email](/docs/first-email).
