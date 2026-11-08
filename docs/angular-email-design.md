# Angular Email: design (v1)

Status: **approved 2026-11-08.** Task 1 is done: `@ng-email/render` is implemented and tested in dev and prod mode (see §9). Nothing is published.
Inputs: [reverse-engineering-notes.md](reverse-engineering-notes.md) (Phase 1/2) and the passing render spike in [`spike/`](../spike).

This is a clean-room design. react-email and vue-email (both MIT) were studied for behavior only. No source is copied or vendored.

---

## 1. Goals

* Write transactional emails as **standalone Angular components** with signal inputs.
* `renderEmail(Component, { inputs })` returns client-safe HTML, and optionally plain text, on Node with no browser.
* Ship a small set of components that carry the known Gmail, Outlook, Yahoo and Apple Mail workarounds.
* Provide a local preview that uses Angular's own build pipeline, with no Next.js and no esbuild-in-vm.

## 2. Packages and public API

Names were free on npm on 2026-11-08. The `@ng-email` scope still has to be claimed as an npm org.

| Package | Purpose | Peer deps |
|---|---|---|
| `@ng-email/render` | `renderEmail`, `toPlainText`, `cleanupEmailHtml`, types | `@angular/core`, `@angular/common`, `@angular/platform-browser`, `@angular/platform-server` (≥ 22) |
| `@ng-email/components` | Standalone email components. One entry point: with `sideEffects: false` and standalone components, unused ones already tree-shake. No dependency on `@ng-email/render` | `@angular/core`, `@angular/platform-browser` |
| `@ng-email/preview` | Angular CLI builder + schematic for the preview app, and the `ng-email export` command | `@angular/build`, `@angular/ssr` |

`html-to-text` (plain text) is a dependency of `@ng-email/render`. `prettier` is an *optional peer* that is loaded only when `pretty: true` is passed.

### 2.1 `@ng-email/render`

```ts
type EmailInputs<T> = { [K in keyof T as T[K] extends InputSignal<any> ? K : never]?:
  T[K] extends InputSignal<infer V> ? V : never };

interface RenderOptions<T> {
  inputs?: EmailInputs<T>;          // applied with ComponentRef.setInput
  providers?: Provider[];           // e.g. i18n, config services
  pretty?: boolean;                 // default false
  doctype?: string | false;         // default XHTML 1.0 Transitional
}

renderEmail<T>(component: Type<T>, options?: RenderOptions<T>): Promise<string>;
renderEmailText<T>(component: Type<T>, options?: RenderOptions<T> & { htmlToText?: HtmlToTextOptions }): Promise<string>;
renderEmailBoth<T>(component: Type<T>, options?: …): Promise<{ html: string; text: string }>; // one render, two outputs

toPlainText(html: string, options?: HtmlToTextOptions): string;
cleanupEmailHtml(html: string): string;   // string-level fallback, exported for tests/tools
```

Input typing comes from signal inputs, so `renderEmail(Welcome, { inputs: { name: 1 } })` fails to compile when `name` is a string.

### 2.2 `@ng-email/components`

Components use **attribute selectors on the real email element**, so the component host *is* the emitted tag and no custom element reaches the inbox (the spike proved this with `a[ngEmailButton]`). The selector prefix is `nge`.

```html
<html ngeHtml lang="en">
  <head ngeHead><title>Welcome</title></head>
  <body ngeBody [ngeStyle]="{ backgroundColor: '#f6f9fc' }">
    <nge-preview text="Your account is ready" />
    <table ngeContainer>
      <!-- Container renders tbody > tr > td itself and projects children into the td -->
      <h1 ngeHeading>Hi {{ name() }}</h1>
      <p ngeText>Thanks for joining.</p>
      <a ngeButton [href]="url()" [ngeStyle]="{ padding: '12px 20px' }">Confirm</a>
    </table>
  </body>
</html>
```

> Both former open items are **resolved** by tests in `packages/render/test/render-email.spec.ts`, which pass in dev and prod mode:
> * `<html>`, `<head>` and `<body>` inside a component template produce exactly one valid document, so the slot fallback is not needed.
> * Non-table children (`<h1>`, `<p>`) projected into a `table[…]` component stay inside its `td`. Angular's template parser does not re-parent them, so attribute selectors on `<table>` are kept.

The style input is named `ngeStyle`, not `style`, so it cannot collide with the native `style` attribute binding.

Each component:
* is `standalone`, `ViewEncapsulation.None`, `OnPush`, and has **no `styles`**;
* takes `ngeStyle` as `string | Record<string, string | number>`. The library serializes it with its own `toStyleString` and binds `[attr.style]`, never `[style.x]` (see notes, Q3);
* has `host` bindings for the email attributes (`role`, `border`, `cellpadding`…) and uses `<ng-content>` for children.

## 3. v1 component list

Each row lists the behavior that must be implemented. It comes from react-email's contract, reimplemented.

| Component | Selector | Behavior |
|---|---|---|
| Html | `html[ngeHtml]` | default `lang="en"`, `dir="ltr"` |
| Head | `head[ngeHead]` | prepends `Content-Type` meta and `x-apple-disable-message-reformatting` meta |
| Body | `body[ngeBody]` | `body` keeps only background (+ zeroed margin/padding). All user styles go on an inner full-width presentation table `td` (Yahoo/AOL) |
| Preview | `nge-preview` (element, unwrapped) with a `text` input | hidden preheader, text capped at 200 chars, invisible-character filler up to the cap, `data-skip-in-text`. It is an element rather than `div[…]` because static inputs on an attribute host leak as attributes. There is no `<title>` option, because Angular does not hoist elements into `<head>`; put `<title>` in `head[ngeHead]` |
| Container | `table[ngeContainer]` | presentation table, `align=center width=100% border=0 cellpadding=0 cellspacing=0`, `max-width:37.5em`. **Padding moves to the inner `td`** |
| Section | `table[ngeSection]` | as Container without max-width |
| Row | `table[ngeRow]` | presentation table → tbody → `tr` with projected columns |
| Column | `td[ngeColumn]` | plain `td` |
| Text | `p[ngeText]` | 14px/24px, default 16px top/bottom margin unless overridden |
| Heading | `h1[ngeHeading]`…`h6[ngeHeading]` | margin shorthand inputs |
| Link | `a[ngeLink]` | `target=_blank`, default color, no text decoration |
| Button | `a[ngeButton]` | Outlook MSO padding hack: hair-space font-width math (max 500%), `mso-text-raise` in pt (px×¾), padding parsing of px/em/rem/% with 1–4 value shorthand |
| Img | `img[ngeImg]` | `alt=""` default, `display:block; outline:none; border:none; text-decoration:none` |
| Hr | `hr[ngeHr]` | full width, `border:none; border-top:1px solid #eaeaea` |
| Font | `nge-font` (element, unwrapped) | `<style>` with `@font-face` (+ `mso-font-alt`) and a global font-family rule, created through `Renderer2` because Angular strips template `<style>` |

Deferred to v2: CodeInline, CodeBlock, Markdown, a `Style` helper, and a Tailwind adapter.

## 4. Render and cleanup algorithm

```
renderEmail(Component, { inputs, providers, pretty, doctype })
 1. bootstrap  = ctx => bootstrapApplication(EmailHost, {
                    providers: [provideZonelessChangeDetection(),
                                provideServerRendering(),
                                { provide: RENDER_REQUEST, useValue: { Component, inputs } },
                                { provide: BEFORE_APP_SERIALIZED, multi: true, useFactory: domCleanup },
                                ...providers] }, ctx)
 2. EmailHost.ngOnInit: ref = outlet.createComponent(Component); for each input: ref.setInput(k, v)
 3. html = await renderApplication(bootstrap, {
               document: '<html><head></head><body><nge-root></nge-root></body></html>',
               url: 'http://localhost/', allowedHosts: ['localhost'] })
    // renderApplication waits for app stability (pending tasks, resources) before serializing
 4. domCleanup (runs on the Domino DOM, before serialization):
    a. assert: no <style ng-app-id> in document head  → throw ComponentStylesNotSupported
    b. walk the subtree of <nge-root>:
       - Comment nodes: keep iff data starts with "[if" or "<![endif]"; else remove
       - Elements: remove attrs  ng-version, ng-server-context, ngh, ng-reflect-*,
         _nghost-*, _ngcontent-*, and the library's selector attributes (nge*)
       - Elements whose tagName contains "-": unwrap (replace with children)
    c. no <script> in the subtree → assert (defense in depth)
 5. extract innerHTML of <nge-root>  (drops the outer html/head/body shell and ng-version)
 6. if the result does not start with <html: it is a fragment; return it without a doctype (useful for tests)
    else prepend doctype (unless doctype === false), removing any existing one
 7. pretty? → lazy-load prettier, HTML parser, never break lines inside conditional comments
 8. errors: any error thrown during bootstrap/render rejects the promise; partial HTML is never returned
```

Plain text (`renderEmailText` / `toPlainText`) uses `html-to-text` with default selectors: skip `img`, skip `[data-skip-in-text=true]`, print links without brackets and hide the href when it equals the text, and lay out `[data-text-format=dataTable]` as aligned rows. User selectors are *appended* to the defaults, never replace them.

**Bundling for Node workers.** Angular packages are partially compiled (spike failure 1). There are two supported deployment paths:
1. *Angular CLI workspace*: render from the app's existing server bundle (`@angular/build:application` with an SSR entry). The CLI links Angular already.
2. *Plain Node service*: `ng-email build src/emails/index.ts -o dist/emails.mjs` (package `@ng-email/cli`). It runs an in-memory full AOT compile (`performCompilation`), then esbuild with the Angular Linker. The service imports a self-contained ESM bundle that re-exports the render API, so rendering uses the bundled, linked Angular.
A documented escape hatch is `import '@angular/compiler'` (JIT-links at runtime). It works but is heavier and slower to start. Not recommended.

## 5. Preview approach (no Next.js, no esbuild-in-vm)

React's preview can eval a bundled file in a `vm`. Angular components cannot be loaded that way, because they need the Angular compiler and linker. We therefore **reuse the Angular CLI dev server**, which already handles AOT, linking, path aliases and HMR.

* `ng add @ng-email/preview` adds an `email-preview` application project to the user's workspace:
  * a **client** Angular app (CSR): template list, `<iframe srcdoc>` desktop/mobile widths, HTML / plain-text / source tabs, input JSON editor.
  * an SSR `server.ts` (`@angular/ssr/node`) with one extra route, `GET /__nge/render/:name?inputs=…`. It looks the email up in the registry and calls `renderEmail` inside the dev server's SSR runtime. `ng serve` runs `server.ts` through Vite SSR, so editing an email triggers a re-render with no custom watcher.
* **Explicit registry instead of file scanning:**
  ```ts
  // src/emails/index.ts
  export const emails = defineEmails({
    welcome: { component: WelcomeEmail, previewInputs: { name: 'Ada' } },
    reset:   { component: ResetEmail,   previewInputs: { url: 'https://…' } },
  });
  ```
  It is typed, needs no Babel AST detection, and can be imported by both the preview and the production sender.
* `ng-email export` (a builder) renders every registry entry to `out/<name>.html` and `.txt` for CI artifacts and diffing.
* Not in v1: sending test emails, caniemail linting, and sharing.

Fallback when the Angular CLI dev-server route turns out to be too limiting: a standalone `ng-email preview` command that runs `ngc --watch` → linked esbuild bundle → render in a **child process** (fresh module cache per rebuild, no `vm`), and serves a prebuilt preview UI.

## 6. Explicit non-goals (v1)

* Visual / drag-and-drop **editor**.
* **Tailwind** or any CSS-to-inline pipeline (no `juice`, no `styleUrl` inlining).
* **Provider SDKs** or sending (Resend, SES, SendGrid, Postmark…). We return strings.
* Runtime template compilation, or rendering templates stored as strings.
* Client-side or browser rendering of emails outside the preview UI.
* Hydration, `TransferState`, event replay.
* Code block / syntax highlighting, Markdown.
* Dark-mode helpers and AMP for email.

## 7. Test plan

**Unit (pure functions)**: port as behavior tables
* `convertToPx`: `10px→10`, `2em→32`, `1.5rem→24`, `50%→300`, `15cm→0`, `invalid→0`, `''→undefined`, `undefined→undefined`, `0→0`.
* `parsePadding`: number, 1/2/3/4-value shorthand, a specific side overriding the shorthand, an explicit `0` winning, empty→undefined.
* `pxToPt`: `10→7.5`, `20→15`, `0→0`, invalid→undefined.
* Button font-width/space-count math across padding 0, 1, 5, 12, 20, 48.
* `toStyleString`: camelCase→kebab, numbers→px where appropriate, `mso-*` kept, undefined dropped.
* Comment whitelist: `[if mso]`, `[if !mso]><!`, `<![endif]` kept. `container`, `ng-container`, empty and `bindings=…` dropped.

**Render snapshots** (Vitest inline snapshots of the *cleaned* HTML) for every component. Outlook/Gmail-sensitive ones get structural assertions too:
* **Button**: both MSO comments present and byte-exact. Per-side padding on `<a>`. `mso-padding-alt:0px`. `mso-text-raise` on the label span.
* **Container / Section**: `role=presentation`, `border=0`, `cellpadding=0`, `cellspacing=0`, `align=center`. Padding on the `td`, not the table.
* **Body**: background on `<body>`, full style on the inner `td`.
* **Preview**: 200-char truncation, filler present only under the cap, `data-skip-in-text`, absent from plain text.
* **Head**: both metas first. **Img**: `display:block`, `alt=""`. **Hr**: `border-top`.
* **Full email** (Html/Head/Body/Preview/Container/Button): doctype once, `<html>` root, valid nesting.

**Artifact-absence suite**: render every component and three full fixtures (`@if`, `@for`, `ng-content`, nested user component with element selector), then assert there is no match for
`/ng-version|ng-server-context|_nghost|_ngcontent|ng-reflect|\sngh=|<script|<nge-|<!--(?!\[if|<!\[endif)/`.

**Pipeline tests**:
* error in a component → promise rejects, no output;
* async input resolved through `resource()` / `PendingTasks` appears in the output;
* multi-byte characters (emoji, CJK) are intact;
* 100 concurrent renders, each with different inputs, never leak into each other;
* a component with `styles` → `ComponentStylesNotSupported`;
* the bundle built by `ng-email build` runs under plain `node` (regression test for spike failure 1).

**Email-client checks** (manual or scheduled, not a CI gate): send the `export` fixtures through Email on Acid or Litmus for Outlook 2016/2019/365 (Word engine), Outlook.com, Gmail web/iOS/Android, Apple Mail, Yahoo. Record screenshots per release.

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **platform-server weight**: Domino + core + common. Measured `ng-email build` output in production mode is 2.2 MB, or 0.97 MB with `--minify` | cold-start time on serverless; install size | production build with `ngDevMode=false` + minify; publish measured numbers; keep heavy deps (prettier) lazy and optional; benchmark bootstrap per render vs. a reused platform |
| ~~**Linking requirement**~~: partially compiled Angular breaks bare Node (spike failure 1) | resolved | `ng-email build` ships; e2e tests render from the bundle in an empty temp directory with plain `node` |
| **Encapsulation and component styles** silently lost | emails render unstyled | components force `None` with no `styles`; `domCleanup` throws when `<style ng-app-id>` appears; lint rule in docs |
| **Hydration markers**: `ngh`, `ng-state`, event replay scripts if a user adds `provideClientHydration` | broken markup, scripts in email | never provide hydration; strip `ngh`; assert no `<script>`; the artifact-absence suite |
| **Host elements**: user components leak `<app-foo>` tags | unknown tags in clients | attribute selectors in library components; unwrap hyphenated elements; snapshot suite |
| **Outlook tables**: Word engine ignores padding on `<a>`/tables, max-width, many CSS properties | layout drift in Outlook | presentation tables everywhere, padding on `td`, MSO hacks byte-snapshotted, manual Outlook matrix each release |
| **Style serialization**: Domino normalizes static `style` attributes; `[style.x]` may drop `mso-*` | flaky snapshots, lost Outlook styles | library builds style strings and binds `[attr.style]`; snapshot tests pin the format |
| ~~`<html>/<head>/<body>` in templates~~ | resolved: renders one valid document | covered by tests |
| **Angular SSR API churn** (`allowedHosts` arrived recently; `provideServerRendering` has moved before) | breaking upgrades | the render core is one small file; CI matrix on Angular latest and next; pin a peer range of the current major |
| **Sanitizer bypass** for MSO comments | XSS if user strings reach `bypassSecurityTrustHtml` | only library-generated constant strings are bypassed; user content always goes through interpolation |

## 9. Tasks

1. ✅ Repo (npm workspaces + ng-packagr), `@ng-email/render` with the DOM-based cleanup, full-document rendering proven. 35 tests, each run in Angular dev and prod mode. What the implementation taught us:
   * Errors thrown in the component tree go to `ErrorHandler` during SSR, and a partial page is still returned. The renderer installs its own `ErrorHandler` and rejects.
   * platform-server *swallows* exceptions thrown in `BEFORE_APP_SERIALIZED` and only logs a warning. Cleanup records them and rethrows after rendering.
   * Prod mode shortens Angular errors to codes (`NG0950` = required input missing).
   * Static host attributes are serialized before bound ones. Snapshots must pin that order.
   * The test pipeline is `ngc` (full) → esbuild + Angular Linker → `node --test` (`tools/run-tests.mjs`). It is the seed of `ng-email build` in task 3.
   * Deferred from the §2.1 API: `pretty`. It needs a printer that is proven never to re-wrap MSO conditionals.
2. ✅ `@ng-email/components`: all 15 v1 components plus the style/padding utilities. 71 tests, each run in dev and prod mode: exact output for Button/Container/Section/Row/Body/Text/Heading/Link/Img/Hr/Preview, padding-math tables, and a full email with every component (no artifacts, a single document, MSO hacks intact, plain text). What the implementation taught us:
   * **Static inputs leak as attributes.** `mx="8px"` on an attribute-selector host is also written to the DOM. Heading clears its non-HTML input names with `[attr.x]: null` host bindings. Preview and Font use element selectors, which get unwrapped.
   * Attribute order is static host attributes, then static template attributes, then bound attributes.
   * `imports` passed through an object spread is **not** seen by the compiler. Write `imports: [EMAIL_COMPONENTS]` directly.
   * `<td ngeColumn>` written directly inside `<table ngeRow>` is not re-parented by the template parser.
   * An abstract base class that declares inputs needs `@Directive()`.
   * Font's `<style>` is created with `Renderer2` in `ngOnInit`. User-supplied font names and URLs are stripped of characters that could escape the CSS.
3. ✅ `@ng-email/cli` with `ng-email build` and the programmatic `buildEmails()`. There are 13 e2e tests. They build a real consumer project, render the bundle from an empty temp directory with plain `node` in production mode (including `@for` and `CurrencyPipe` from `@angular/common`), type-check a consumer against the generated `.d.mts`, and cover `--dev`, `--minify` and `--external` plus the error paths. The test runner now uses the same `angularLinkerPlugin()`. What the implementation taught us:
   * `@angular/compiler-cli`'s typings use extensionless relative re-exports. A consumer compiled with `moduleResolution: NodeNext` sees **no exports**. The CLI is compiled with `Bundler` resolution and explicit `.js` imports.
   * TypeScript 6 requires an explicit `rootDir` whenever `outDir` is set (TS5011). The in-memory compile uses the filesystem root.
   * The linker must also run outside `node_modules`: symlinked workspace packages resolve to their real path.
   * The bundle must re-export the render API. A separately imported `@ng-email/render` would bring a second, unlinked Angular.
   * TS 6 `tsc` refuses `files on the command line` when a tsconfig exists (TS5112) unless you pass `--ignoreConfig`.
4. Preview schematic + SSR render route + export builder.
