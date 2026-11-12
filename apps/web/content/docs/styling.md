# Styling

Email clients only reliably support inline styles. ng-email builds those for you from `ngeStyle`.

## ngeStyle

Every email component takes `ngeStyle`, as an object or as a CSS string:

```html
<p ngeText [ngeStyle]="{ color: '#374151', fontSize: 15, lineHeight: '24px' }">…</p>
<p ngeText ngeStyle="color:#374151;font-size:15px">…</p>
```

- Keys can be camelCase or kebab-case: `fontSize` and `font-size` both work. `msoPaddingAlt` becomes `mso-padding-alt`.
- Numbers get `px`, except unitless properties such as `lineHeight`, `opacity`, `fontWeight` and `zIndex`. `0` stays `0`.
- `null`, `undefined` and empty strings are dropped.
- Your styles are merged over each component's defaults. When a property appears twice, the later one wins.

The style attribute text is written exactly as built. That's why Outlook-only properties such as `mso-line-height-rule` survive: they don't pass through the browser's style parser.

## What not to use

| Don't use | Why | Use instead |
|---|---|---|
| Component `styles` / `styleUrl` | Angular puts them in the page `<head>`, outside the email. The renderer throws `COMPONENT_STYLES` rather than lose them silently. | `ngeStyle`, or a `<style>` inside `head ngeHead` |
| `[style.x]`, `[ngStyle]` | They go through the DOM's style object, which can drop `mso-*` properties. | `ngeStyle` on email components, `[attr.style]` on plain elements |
| Flexbox, grid, positioning | Many clients ignore them, Outlook in particular. | `table ngeRow` with `td ngeColumn` |

On plain elements such as a `<span>`, set a string with `[attr.style]`:

```html
<span [attr.style]="'color:#4f46e5;font-weight:600'">New</span>
```

## Layout

Build layout from tables:

- **`table ngeContainer`:** centered, up to 600px wide (37.5em). Wrap your content in one.
- **`table ngeSection`:** a full-width band, for example with its own background or padding.
- **`table ngeRow` with `td ngeColumn`:** side-by-side columns. Give columns a `width` in `ngeStyle`.

Padding on Container and Section is moved to their inner cell automatically, because Outlook ignores padding on tables.

## Fonts

Web fonts work in Apple Mail, iOS Mail and some others; Gmail and Outlook fall back. Declare the font once in the head with a fallback:

```html
<head ngeHead>
  <nge-font
    fontFamily="Inter"
    [fallbackFontFamily]="['Helvetica', 'sans-serif']"
    [webFont]="{ url: 'https://example.com/fonts/inter.woff2', format: 'woff2' }"
  />
</head>
```

This emits `@font-face` plus a global font-family rule. It also sets `mso-font-alt`, so Outlook uses your first fallback instead of Times New Roman.

## Images

- Use absolute `https://` URLs. Email has no relative paths.
- Set `width` and `height` attributes. Outlook ignores CSS sizes on images.
- Always write meaningful `alt` text; many clients block images by default.
- Bind a dynamic URL with `[attr.src]`: `<img ngeImg [attr.src]="logoUrl()" width="120" height="36" alt="Acme" />`.

`img ngeImg` already sets `display:block` and removes borders and outlines.

## Outlook notes

- **Buttons:** `a ngeButton` adds MSO-only spacing, so its padding also shows in Outlook. Set padding in px, em, rem or %.
- **Rounded corners and shadows:** classic Outlook for Windows ignores `border-radius` and `box-shadow`. Designs should still look right with square corners.
- **Background images:** not shown by classic Outlook. Set a solid `background-color` too.

## See the structure

Turn on **X-ray** in `ng-email preview` or on the website. It outlines every table and cell, which is the quickest way to see why something lines up the way it does.
