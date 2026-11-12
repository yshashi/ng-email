# Render API

Everything exported by `@ng-email/render`.

In a service, import these from your [`ng-email build`](/docs/cli#ng-email-build) bundle, which re-exports them. Import from `@ng-email/render` directly in your email sources, such as for `defineEmails`.

## renderEmail

```ts
function renderEmail<T>(component: Type<T>, options?: RenderOptions<T>): Promise<string>;
```

Renders a standalone component to email HTML. Output that starts with `<html>` gets a doctype; fragments don't.

```ts
interface RenderOptions<T> {
  inputs?: EmailInputs<T>;    // signal inputs, type-checked
  providers?: Provider[];
  doctype?: string | false;   // default XHTML 1.0 Transitional
}
```

## renderEmailText

```ts
function renderEmailText<T>(component: Type<T>, options?: TextRenderOptions<T>): Promise<string>;

interface TextRenderOptions<T> extends RenderOptions<T> {
  htmlToText?: HtmlToTextOptions;
}
```

Renders the plain-text alternative. See [Plain text](/docs/rendering#plain-text).

## renderEmailBoth

```ts
function renderEmailBoth<T>(component: Type<T>, options?: TextRenderOptions<T>): Promise<{ html: string; text: string }>;
```

One render, both parts.

## defineEmails and defineEmail

```ts
function defineEmail<T>(component: Type<T>, options?: { previewInputs?: EmailInputs<T>; description?: string }): EmailDefinition<T>;
function defineEmails<R extends EmailRegistry>(registry: R): R;
```

These declare the emails that `ng-email preview` and `ng-email export` list. Names must be URL- and file-safe (letters, digits, `-`, `_`). The registry is also a convenient way for your service to reach every email: `emails.welcome.component`.

## toPlainText

```ts
function toPlainText(html: string, options?: HtmlToTextOptions): string;
```

Converts any email HTML with ng-email's plain-text rules. `plainTextSelectors` holds the default rules.

## cleanupEmailHtml

```ts
function cleanupEmailHtml(html: string): string;
```

Applies the renderer's cleanup to HTML from elsewhere, using string rules:

- removes Angular attributes and comments;
- keeps Outlook conditional comments;
- unwraps hyphenated tags.

`renderEmail` itself cleans the DOM before serializing, which is more robust. `isOutlookConditionalComment(data)` reports whether a comment's text is an Outlook conditional.

## describeEmailComponent and isEmailComponent

```ts
function describeEmailComponent(component: Type<unknown>): {
  name: string;
  selector: string;
  inputs: Array<{ name: string; alias: string }>;
};
function isEmailComponent(value: unknown): boolean;
```

These inspect a component: its selector and inputs, and whether a value is an Angular component at all. The preview's inputs editor uses them.

## EmailRenderError

```ts
class EmailRenderError extends Error {
  readonly code: 'NOT_A_COMPONENT' | 'UNKNOWN_INPUT' | 'COMPONENT_STYLES' | 'SCRIPT_IN_OUTPUT' | 'NO_OUTPUT';
}
```

See [Errors](/docs/rendering#errors).

## Types and constants

| Export | |
|---|---|
| `EmailInputs<T>` | The signal inputs of `T`, typed by the value each accepts |
| `RenderOptions<T>`, `TextRenderOptions<T>` | Options above |
| `EmailDefinition<T>`, `EmailRegistry` | Registry types |
| `EmailComponentInfo` | Return type of `describeEmailComponent` |
| `EmailRenderErrorCode` | The error codes |
| `XHTML_TRANSITIONAL_DOCTYPE` | The default doctype string |
