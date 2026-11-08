# Reverse-engineering notes: react-email and vue-email

Phase 1 (behavior study) and Phase 2 (Angular constraints) for the Angular Email design.
The design itself is in [angular-email-design.md](angular-email-design.md).

**Snapshots studied** (shallow clones, read only, nothing copied into this repo):

| Repo | Commit | Date |
|---|---|---|
| resend/react-email | `674d8ec` | 2026-11-06 |
| vue-email/vue-email | `c79f7a3` | 2026-04-10 |

Everything below describes *behavior*. Code snippets are in our own words, not quotes.

---

## Phase 1A: react-email

### 1. Package map

| Package | Version | Responsibility | Public exports |
|---|---|---|---|
| `@react-email/render` | 2.2.0 | React tree → HTML string or plain text. Node, edge and browser entries. | `render(node, options)`, `pretty`, `toPlainText`, `plainTextSelectors`, `Options` |
| `react-email` | 6.11.8 | Umbrella: re-exports `render` plus every component. Also ships the `email` CLI (`dev`, `build`, `start`, `export`, `resend setup/reset`). | `Html, Head, Body, Preview, Container, Section, Row, Column, Text, Heading, Link, Button, Img, Hr, Font, CodeBlock, CodeInline, Markdown, Tailwind`, `markAsElement` |
| `@react-email/ui` | 6.11.8 | The preview app. A Next.js app the CLI copies or starts. | (app, no library exports) |
| `create-email` | 1.2.7 | `npx create-email` scaffolder that copies a template. | bin only |
| `@react-email/editor` | 1.8.1 | TipTap-based visual editor that outputs react-email trees. | editor/core/extensions/ui/plugins |

Components used to be one npm package each (`@react-email/button` and so on). They are now folded into `react-email/src/components/*`.

### 2. Render pipeline (node entry)

1. Lazy-import `react-dom/server`.
2. Wrap the node in `<ErrorBoundary><Suspense>{node}</Suspense></ErrorBoundary>`. The boundary *rejects the promise* instead of letting React fall back to client rendering.
3. Stream-render. `renderToReadableStream` is used when `WritableStream` exists, otherwise `renderToPipeableStream`. `progressiveChunkSize: Infinity` stops React from splitting large output into streamed chunks, which would otherwise add `<template>` and `$RC` hydration scripts (issue #2353). The code waits for `allReady`/`onAllReady`, so all Suspense data has resolved before it reads the string.
4. Remove `\0` bytes (a React 18 streaming bug).
5. `stripImagePreloadLinks`: React 19 adds `<link rel="preload" as="image">` for every `<img>`. These links are removed by parsing their attributes. Other `<link>`s are kept.
6. When `plainText` is set, return `html-to-text` output. Its selectors skip `img` and `[data-skip-in-text=true]`, print links without brackets and hide the href when it equals the link text, and lay out `[data-text-format=dataTable]` tables. An in-house converter (`unstableTextConversion`) is also available.
7. Otherwise prepend the XHTML 1.0 Transitional doctype, replacing any doctype already present.
8. When `pretty` is set, run Prettier standalone with the HTML plugin. The printer is patched so it never adds line breaks inside IE/MSO conditional comments. Prettier is only loaded on first use.

### 3. Component contract and email-client hacks

| Component | Emits | Hacks / defaults |
|---|---|---|
| Html | `<html lang="en" dir="ltr">` | defaults lang and dir |
| Head | `<head>` + `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">` + `<meta name="x-apple-disable-message-reformatting">` | Apple Mail auto-reformat off |
| Body | `<body>` with only background and zeroed margin/padding, then a full-width presentation `<table><tbody><tr><td style=…all user styles…>` | Yahoo/AOL turn `<body>` into a div and drop its styles, so the real styles go on the inner `td` |
| Preview | `<title>` (optional) + hidden `<div>` (display:none, opacity 0, max-height 0 …) holding the text capped at **200** chars, padded with invisible characters (`\xa0‌​‍﻿`) | inbox preheader. Stops clients from pulling body text into the preview. Marked `data-skip-in-text` |
| Container | `<table align=center width=100% border=0 cellpadding=0 cellspacing=0 role=presentation style="max-width:37.5em">` → tbody → `tr` → `td` | `padding*` styles move from the table to the `td`, because padding on a table is unreliable in Outlook. Tailwind padding classes are routed the same way |
| Section | same as Container without max-width | same padding split |
| Row | presentation table → tbody → `<tr>` holding the children | |
| Column | `<td data-id="__react-email-column">` | |
| Text | `<p>` with font-size 14px, line-height 24px, default top/bottom margin 16px | margin shorthand expanded |
| Heading | `<h1>`–`<h6>` through `as`, with `m/mx/my/mt/…` margin props | |
| Link | `<a target=_blank>` with color #067df7 and no text decoration | |
| Button | `<a>` (inline-block, line-height 100%, `mso-padding-alt:0`) with explicit per-side padding. Inside: left `<span>` holding `<!--[if mso]><i style="mso-font-width:X%;mso-text-raise:Ypx" hidden>&#8202;…</i><![endif]-->`, the label `<span>` (`mso-text-raise`), and a right MSO span | **Outlook button padding.** Outlook ignores padding on `<a>`, so hair-spaces are used, with font-width scaled so their total equals the left/right padding (cap 5 → 500%). `mso-text-raise` (px→pt ×¾) fakes vertical padding. Padding parsing supports `px/em/rem/%` (em/rem ×16, % of 600px) and 1–4 value shorthand |
| Img | `<img alt="" style="display:block;outline:none;border:none;text-decoration:none">` | removes gaps and blue borders |
| Hr | `<hr>` width 100%, `border:none`, `border-top:1px solid #eaeaea` | consistent rules across clients |
| Font | `<style>` with `@font-face` (+ `mso-font-alt` = first fallback) and `* { font-family: … }` | Outlook fallback font |
| CodeInline | `<code class="cino">` + `<span class="cio" style="display:none">` + a `<style>` with `meta ~ .cino` selectors | Orange.fr strips `<code>` while keeping `<style>` |
| CodeBlock | `<pre>` with Prism tokens as inline-styled spans | bundles Prism (~730 kB of source) |
| Markdown | `marked` → inline-styled elements | |
| Tailwind | rewrites the subtree (see §4) | |

### 4. Styling model

* **Inline style objects first.** Each component merges its defaults *under* the user's `style`.
* **Tailwind** (`<Tailwind config theme utility>`): runs Tailwind v4 in-process. It walks the React tree and collects every `className`, generates CSS, then **sanitizes** it: resolves CSS variables, folds `calc()`, rewrites declarations that email clients cannot parse, and drops empty `--tw-*` variables. Rules split into
  * *inlinable* rules, which are merged into each element's `style`, and
  * *non-inlinable* rules (media queries, pseudo-classes), which are "downleveled" for email clients and emitted in one `<style>` placed inside `<head>`. If no `<head>` sits inside `<Tailwind>`, it **throws** and names the offending classes.
  * `markAsElement(component, { resolveTailwind })` lets a component decide where the resolved classes go (Container/Section send padding classes to their `td`).
  * A `pixelBasedPreset` swaps rem for px, because many clients mishandle rem.
* **Stripped**: image preload links, `\0`, React streaming markers (prevented rather than stripped), and any extra doctype.

### 5. Preview / CLI architecture

* `email dev` starts an HTTP server that serves the **Next.js** preview app (`@react-email/ui`), with socket.io for hot reload.
* To render a template, the UI **bundles the user's `.tsx` with esbuild in memory**. Plugins inline CSS imports and export rendering utilities. The bundle runs in a **Node `vm` context** (`run-bundled-code`) with a curated set of globals and a `require` shim. The default export is called with `PreviewProps` and passed to `render`.
* Hot reload: chokidar watches files. A dependency graph built from imports, path aliases included, decides which templates to re-render.
* Template discovery: walk the emails directory and detect files whose default export is a component.
* Other features: caniemail-based compatibility linting, a "send test" through Resend, and `email export`, which renders every template to static HTML in `out/`.
* **Why it works in React:** a JSX file compiles to plain JS functions in one esbuild pass. There is no framework compiler, so "bundle → eval in vm → call function → renderToString" is enough. Angular has no equivalent shortcut (Phase 2 explains why).

### 6. Framework artifacts removed

`<link rel=preload as=image>`, `\0`, the streaming `<template>`/`$RC` hydration scripts (avoided through `progressiveChunkSize`), and duplicate doctypes. React 19 output has no `data-reactroot`, so nothing else is needed.

### 7. Tests worth copying as *behavior*

* Padding math: `convertToPx` (`10px`→10, `2em`→32, `1.5rem`→24, `50%`→300, unsupported unit→0, `''`/undefined→undefined, 0→0). `parsePadding` with 1–4 value shorthand, where a specific side overrides the shorthand and an explicit 0 wins. `pxToPt` (10→7.5).
* Button snapshot including both MSO comments.
* Container/Section: padding classes and styles land on the `td`.
* Preview: truncated to the cap, whitespace filler present only under the cap, excluded from plain text.
* Render: component throw → promise rejects. Multi-byte characters survive. Large emails have no hydration markers. Async data is awaited before output.
* Plain text: images skipped, `data-skip-in-text` skipped, links without brackets, custom selectors merge with the defaults.
* Pretty: never wraps inside MSO conditionals, strips `\0`, loads lazily.
* Image preload stripping: attribute order does not matter, non-image preloads are kept, text that only mentions a tag is untouched.

### 8. License

MIT, "Copyright 2024 Plus Five Five, Inc". MIT only obliges keeping the notice in copies. A clean-room reimplementation copies nothing, so legally no notice is needed. We will still add a courtesy "Inspired by react-email (MIT)" line to the README. Prism (CodeBlock) and caniemail data carry their own licenses. Check them before using either.

---

## Phase 1B: vue-email

### 1. Package map

One npm package per component, all at `0.0.x`: `@vue-email/{body,button,code-block,code-inline,column,container,font,head,heading,hr,html,img,link,markdown,preview,row,section,style,tailwind,text}`. On top of these:

* `@vue-email/render` 0.0.9: `render(component, props, options)`, `cleanup`, `plainTextSelectors`, `Options`. Depends on `vue`, `html-to-text` and `js-beautify`.
* `@vue-email/components` 0.0.21: umbrella re-export.
* There is **no CLI or preview server in this snapshot**. The README sends users to the docs site and a Nuxt/Nitro integration. The repo is marked "experimental".

### 2. Render pipeline

1. `createSSRApp(component, props)` → `renderToString(app)` from `vue/server-renderer`.
2. When `plainText` is set, convert with `html-to-text`: skip `img` and `#__vue-email-preview`, print links without brackets. **No cleanup runs on this path.**
3. Otherwise run `cleanup(markup)`, which applies these regex replacements:
   * removes `data-v-inspector="…"` attributes,
   * removes Vue fragment markers `<!--[-->` and `<!--]-->`,
   * removes **every** HTML comment `<!--…-->`,
   * removes `<style>…</style>` blocks *with no attributes*,
   * removes all `<script>` elements,
   * unwraps `<template>` tags and the Tailwind helper wrapper `<tailwind-clean-component>`.
4. Prepend the XHTML 1.0 Transitional doctype.
5. When `pretty` is set, run `js-beautify` (code/pre/em/strong/span left unformatted).

**Behavior we must not copy:** stripping all comments also deletes the `<!--[if mso]>` blocks the Button emits, so the Outlook padding hack never ships. Stripping bare `<style>` also hits a `<style>` without attributes, such as Font's output, unless something adds an attribute first. The Style component adds `data-id`, so its output survives. In both cases a blunt regex fights the components. The plain-text selector `#__vue-email-preview` does not match anything the current Preview renders.

### 3. Components

They are close to react-email's, with these differences:

* Preview caps at **150** chars and adds `‎‏` to the filler.
* Button uses the *older* algorithm: one `&nbsp;` with `letter-spacing: Npx; mso-font-width:-100%` per side.
* Column is `<td role="presentation">`.
* `Style` is a separate `<style data-id="__vue-email-style">` component.
* CodeBlock uses Shiki instead of Prism.

### 4. Styling model

Inline `style` objects, plus `<Tailwind>`. Tailwind's async `setup()` **renders its own slot to a string**, generates CSS for that markup, moves media queries into `<head>` with `!important`, inlines the remaining per-class styles, and throws if responsive classes are used without `<Html>` and `<Head>`. Extra wrappers are removed by `cleanup`.

### 5. Preview / CLI

None in the repo, as described in §1. What works for Vue is that `renderToString` accepts any compiled component, and SFCs compile with Vite. The renderer stays tiny because Vue's SSR output is already plain HTML apart from fragment comments.

### 6. Artifacts removed

Fragment comments, devtools `data-v-inspector`, `<template>` wrappers, scripts, and helper wrapper elements, as listed in §2.

### 7. Tests worth copying as behavior

Each component has a render-contains test. The Font test checks the `@font-face` defaults (normal / 400 / quoted family). The Style test snapshots exact output. Their weak coverage is itself a lesson: we need snapshots plus artifact-absence assertions.

### 8. License

MIT, "Copyright (c) 2023 Vue Email". Same position as react-email.

---

## Comparison: what to take, ignore, or rebuild for Angular

| Area | react-email | vue-email | Angular Email decision |
|---|---|---|---|
| Render core | stream render + Suspense + error boundary | `renderToString` | **Copy behavior:** reject on error, wait for async work, return one string. **Port as:** `renderApplication` + `whenStable` (proved by the spike) |
| Doctype | XHTML 1.0 Transitional, de-duplicated | same | **Copy** |
| Cleanup | targeted (image preloads only) | blunt regexes, kills MSO comments | **Copy react-email's targeted approach**, applied to the DOM before serialization. **Ignore** vue's strip-all-comments |
| Comment handling | MSO comments come out through `dangerouslySetInnerHTML` | lost | **Whitelist** `[if …]` / `<![endif]` comments and drop every other comment (proved by the spike) |
| Plain text | html-to-text + selectors (`data-skip-in-text`, dataTable) | html-to-text, broken selector | **Copy react-email's selector behavior** |
| Pretty | Prettier with an MSO-safe printer | js-beautify | **Copy behavior** (never wrap inside conditionals). Keep it lazy and optional |
| Components | rich, many hacks | older hacks | **Copy the react-email hack set as behavior** (Button MSO math, Body inner td, Container padding split, Preview filler). Reimplement it from the notes above |
| Tailwind | in-process v4 + sanitizer + head injection | slot-to-string | **Ignore for v1** (non-goal) |
| Preview | Next.js + esbuild-in-vm | none | **Cannot port.** Angular components need the Angular compiler and linker. Use Angular's own build pipeline (see design) |
| Discovery | filesystem scan + export detection | n/a | **Ignore.** Use an explicit typed registry |
| Props injection | call the function with props | `createSSRApp(c, props)` | **Port as** `ComponentRef.setInput` (proved by the spike) |
| `markAsElement` / tree walking | walks React elements before render | renders the slot to a string | **Cannot port directly.** Angular has no pre-render element tree. Anything tree-shaped (Tailwind, class routing) must run on the rendered DOM |
| Host elements | none (JSX components disappear) | none | **New Angular problem.** Components have host elements. Use attribute selectors on native tags and unwrap custom elements (see Phase 2) |

---

## Phase 2: Angular constraints

Spike: [`spike/`](../spike). Angular **22.2.5**, Node 24.16, no browser (platform-server uses Domino). Run it with `cd spike && npm test`.

### Spike result: PASS (after two pipeline fixes)

`renderEmail(Button, { href, label })` returns:

```html
<a href="https://example.com/confirm" target="_blank" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px;padding:12px 20px 12px 20px"><span><!--[if mso]><i style="mso-font-width:400%;mso-text-raise:18pt" hidden>&#8202;&#8202;</i><![endif]--></span><span style="max-width: 100%; display: inline-block; line-height: 120%; mso-padding-alt: 0px; mso-text-raise: 9pt;">Confirm email</span><span><!--[if mso]><i style="mso-font-width:400%" hidden>&#8202;&#8202;&#8203;</i><![endif]--></span></a>
```

Assertions: has `<a href=…>` ✔, no `ng-version` ✔, no `<script` ✔. Extra checks: label present ✔, MSO conditional comments preserved ✔, no selector attribute / `ng-container` / `ng-server-context` ✔.

The first two runs failed. Both errors are recorded here because they shape the design:

1. **Without the Angular Linker** (`npm run test:unlinked` still reproduces this):
   `Error: The injectable 'PlatformLocation' needs to be compiled using the JIT compiler, but '@angular/compiler' is not available.`
   Angular's own npm packages ship *partially compiled* (`ɵɵngDeclare*`). Plain `node` cannot run them. Either the **build-time Angular Linker** has to process them (the spike does this with esbuild plus `@angular/compiler-cli/linker/babel` in `spike/link.mjs`), or `@angular/compiler` has to be imported at runtime. The Angular CLI does the linking for you. A bare Node worker does not.
2. **Host validation**: `NG05706: Host http://localhost/ is not allowed. You can configure 'allowedHosts' option.` Angular 22 SSR rejects URLs whose host is not allow-listed. The renderer must pass `allowedHosts: ['localhost']` together with a fixed `url`.

Raw output before cleanup, showing every Ivy artifact this case produced:

```html
<html><head></head><body><ng-email-host ng-version="22.2.5" ng-server-context="other"><a ngemailbutton="" href=…>…</a><!--ng-container--></ng-email-host></body></html>
```

Size and speed: the linked dev-mode bundle (Angular + platform-server + Domino, unminified) is **2.2 MB**. The first render including bootstrap took about 17 ms and the next about 4 ms on this machine. These numbers are indicative only.

### Answers

**Q1. Can platform-server render one standalone component to a string with `setInput` props, without a browser?**
**Yes, verified.** The pattern is a generic AOT-compiled host component bootstrapped through `renderApplication`. In `ngOnInit` it calls `ViewContainerRef.createComponent(Type)` and then `ref.setInput(name, value)` for each input. Required: zoneless change detection, `provideServerRendering()`, `allowedHosts`, and a **linked** build (see failure 1).

**Q2. Which Ivy markers appear, and can cleanup remove them?**
Seen in the spike: `ng-version` and `ng-server-context` on the root host, the custom root host element itself, `<!--ng-container-->` anchor comments, and the component's selector attribute (lowercased by the DOM: `ngemailbutton=""`). **All of them were removed.** Cleanup keeps only the host's inner HTML, drops every comment except MSO conditionals, and strips the known attributes.
Expected in other cases but *not exercised by the spike*: `_nghost-*`/`_ngcontent-*` (emulated encapsulation with styles), `<style ng-app-id>` in the document `<head>` (any component styles), control-flow anchor comments (`@if`/`@for`), dev-mode `ng-reflect-*` / `bindings=` comments, and `ngh` attributes, `<script id="ng-state">` and event-replay scripts (only with `provideClientHydration`, which we will never provide). All of these are attributes, comments or elements outside the host, so the same cleanup removes them. Doing it as a DOM pass instead of regex is the design choice (see design §3).

**Q3. Can email components force `ViewEncapsulation.None` and inline styles?**
**Yes, verified for Button.** `encapsulation: None` gave no `_ngcontent` attributes. A host `[attr.style]` string binding and a static template `style="…"` both kept non-standard `mso-*` properties. Domino re-serialized the static attribute in normalized form (`max-width: 100%; …`). It did not drop properties, but this is a snapshot-instability risk. Not verified: `[style.prop]` / `[ngStyle]` bindings, which go through `CSSStyleDeclaration`. Domino may discard unknown `mso-*` properties there. The library will therefore build style strings itself and bind `[attr.style]` only.

**Q4. What breaks with structural directives, content projection, or external CSS?**
(Reasoned from Angular's rendering model. The spike was scoped to Button only.)
* *Structural directives / `@if` / `@for`*: they render fine and leave anchor comments, which cleanup removes. Old `*ngIf` adds `bindings=` comments in dev mode, which are also removed. Nothing in the output breaks.
* *Content projection (`<ng-content>`)*: works on the server and adds no markers. The real hazard is **host elements**. `<nge-section>` would end up as an unknown tag in the email. The fix is attribute selectors on native tags (`table[ngeSection]`, as the spike's `a[ngEmailButton]` shows), plus a cleanup rule that unwraps any element whose name contains a hyphen (no real HTML email tag does). Users' own sub-components keep element selectors and get unwrapped.
* *External / component CSS* (`styles`, `styleUrl`): **this breaks silently.** Angular puts component styles in the *document* `<head>` as `<style ng-app-id>`. That is outside the email host, so cleanup discards them. Emulated encapsulation also adds `_ngcontent` attributes, which mean nothing in an email. v1 makes this an error ("component styles are not supported; use inline styles or `<style>` inside `nge-head`"). It does not inline them.
* *Template `<style>` and comments*: Angular's compiler pulls `<style>` out of templates and strips HTML comments. Font, Head styles and MSO comments therefore have to be created programmatically, through `bypassSecurityTrustHtml` on `[innerHTML]` or `Renderer2.createComment` / `createElement('style')`. The spike proves the innerHTML route.

**Q5. Is runtime template compilation needed for v1?**
**No, verified.** All components are AOT-compiled with `ngc`, and nothing imports `@angular/compiler`. The caveat is that *framework linking* is required at build time. "No runtime compiler" therefore means "you need a build step." For Angular CLI apps that build step is the server build that already exists. Bare Node workers need a linked bundle, which we will provide (see design).
