# Components

Every component in `@ng-email/components`, with its selector, inputs and the markup it produces.

Import them all at once:

```ts
import { EMAIL_COMPONENTS } from '@ng-email/components';

@Component({ imports: [EMAIL_COMPONENTS], /* … */ })
```

Most components are attributes on the real element (`<table ngeContainer>`), so the element itself is what reaches the inbox. `nge-preview` and `nge-font` are elements that the renderer removes, leaving only their output. Every component that renders visible markup accepts [`ngeStyle`](/docs/styling#ngestyle).

| Component | Use as | |
|---|---|---|
| `EmailHtml` | `<html ngeHtml>` | Document root |
| `EmailHead` | `<head ngeHead>` | Required metas |
| `EmailBody` | `<body ngeBody>` | Body with Yahoo/AOL-safe styling |
| `EmailPreview` | `<nge-preview [text]>` | Inbox preview text |
| `EmailContainer` | `<table ngeContainer>` | Centered 600px column |
| `EmailSection` | `<table ngeSection>` | Full-width band |
| `EmailRow` / `EmailColumn` | `<table ngeRow>` / `<td ngeColumn>` | Columns |
| `EmailText` | `<p ngeText>` | Paragraph |
| `EmailHeading` | `<h1 ngeHeading>` … `<h6>` | Heading |
| `EmailLink` | `<a ngeLink>` | Link |
| `EmailButton` | `<a ngeButton>` | Button with Outlook padding |
| `EmailImg` | `<img ngeImg>` | Image |
| `EmailHr` | `<hr ngeHr>` | Divider |
| `EmailFont` | `<nge-font>` | Web font with fallback |

## Html

`html[ngeHtml]` is the document root.

| Input | Type | Default |
|---|---|---|
| `lang` | `string` | `'en'` |
| `dir` | `'ltr' \| 'rtl' \| 'auto'` | `'ltr'` |

## Head

`head[ngeHead]` adds `<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">` and `<meta name="x-apple-disable-message-reformatting">`, which stops Apple Mail from rescaling text. Put `<title>`, `<nge-font>` and any `<style>` inside it.

## Body

`body[ngeBody]`. Yahoo and AOL turn `<body>` into a `<div>` and drop its styles. So the body keeps only `background`/`background-color` (plus zeroed margin and padding when you set them), and your full style goes on an inner full-width table cell.

| Input | Type | Default |
|---|---|---|
| `ngeStyle` | style | none |
| `lang` | `string` | `'en'` |
| `dir` | `'ltr' \| 'rtl' \| 'auto'` | `'ltr'` |

## Preview

`<nge-preview [text]="…" />` sets the inbox preview text, the line under the subject. The text is capped at 200 characters and padded with invisible characters, so clients don't pull body text into the preview. It's hidden in the email and left out of the plain-text part.

| Input | Type | Default |
|---|---|---|
| `text` | `string` | required |

Put it first inside the body.

## Container

`table[ngeContainer]` is a centered presentation table, `max-width: 37.5em` (600px). Children go into its single cell. Padding in `ngeStyle` is moved to that cell, because Outlook ignores padding on tables. Everything else stays on the table.

| Input | Type | Default |
|---|---|---|
| `ngeStyle` | style | none |
| `width` | `string` | `'100%'` |
| `align` | `'left' \| 'center' \| 'right'` | `'center'` |

## Section

`table[ngeSection]` works like Container without the max width. Use it for bands with their own background or padding.

## Row and Column

`table[ngeRow]` is a presentation table with one row; put `td[ngeColumn]` cells directly inside it.

```html
<table ngeRow>
  <td ngeColumn [ngeStyle]="{ width: '50%' }">Left</td>
  <td ngeColumn [ngeStyle]="{ width: '50%', textAlign: 'right' }">Right</td>
</table>
```

Row inputs: `ngeStyle`, `width` (`'100%'`), `align` (`'center'`). Column inputs: `ngeStyle`.

## Text

`p[ngeText]` is a paragraph with email-safe defaults: `font-size: 14px`, `line-height: 24px`, and `16px` top and bottom margins. A `margin` shorthand is expanded to the four longhands. A side you don't set keeps its default.

## Heading

`h1[ngeHeading]` through `h6[ngeHeading]`.

| Input | Type | |
|---|---|---|
| `ngeStyle` | style | Applied after the margin inputs |
| `m`, `mx`, `my`, `mt`, `mr`, `mb`, `ml` | `string \| number` | Margin shorthands; numbers are px |

## Link

`a[ngeLink]` opens in a new tab and has a visible default color.

| Input | Type | Default |
|---|---|---|
| `href` | `string` | required |
| `target` | `string` | `'_blank'` |
| `ngeStyle` | style | `color:#067df7; text-decoration-line:none` |

## Button

`a[ngeButton]` is a link styled as a button. Set its padding in `ngeStyle` (px, em, rem or %, with 1 to 4 values). Modern clients use the CSS padding. Outlook ignores padding on links, so the button adds MSO-only conditional comments: hair-space characters sized to the left and right padding, plus `mso-text-raise` for the vertical padding.

| Input | Type | Default |
|---|---|---|
| `href` | `string` | required |
| `target` | `string` | `'_blank'` |
| `ngeStyle` | style | `display:inline-block`, `line-height:100%`, no underline |

## Img

`img[ngeImg]` gets `display:block`, no border, no outline, no text decoration. That removes the gaps and blue borders some clients add.

| Input | Type | Default |
|---|---|---|
| `alt` | `string` | `''` |
| `ngeStyle` | style | none |

Set `src`, `width` and `height` as attributes: `src="…"`, or `[attr.src]="url()"` for a dynamic URL.

## Hr

`hr[ngeHr]` is a full-width 1px rule (`border-top: 1px solid #eaeaea`). Override it with `ngeStyle`.

## Font

`<nge-font>` goes inside `head[ngeHead]`. It emits `@font-face`, a global `font-family` rule and `mso-font-alt`, so Outlook falls back to your first fallback font.

| Input | Type | Default |
|---|---|---|
| `fontFamily` | `string` | required |
| `fallbackFontFamily` | `FallbackFont \| FallbackFont[]` | required |
| `webFont` | `{ url: string; format: FontFormat }` | none |
| `fontStyle` | `'normal' \| 'italic' \| 'oblique'` | `'normal'` |
| `fontWeight` | `string \| number` | `400` |

`FallbackFont` is one of `'Arial'`, `'Helvetica'`, `'Verdana'`, `'Georgia'`, `'Times New Roman'`, `'serif'`, `'sans-serif'`, `'monospace'`, `'cursive'` or `'fantasy'`.

## Utilities

`@ng-email/components` also exports the helpers the components use. They're handy for building your own email components:

| Export | |
|---|---|
| `parseStyle(style)` | String or object → ordered style map |
| `mergeStyles(...parts)` | Merge style parts; later wins |
| `toStyleString(style)` | Style map → `a:b;c:d` (or `null` when empty) |
| `toKebabCase(prop)` | `msoPaddingAlt` → `mso-padding-alt` |
| `convertToPx(value)`, `parsePadding(map)`, `expandShorthand(value)`, `pxToPt(px)` | Length and padding math |
| `computeHairSpaceFill(px)` | The Outlook button padding calculation |
| `buildFontCss(options)` | The CSS `<nge-font>` emits |
| `PREVIEW_MAX_LENGTH` | `200` |
