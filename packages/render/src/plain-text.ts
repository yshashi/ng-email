import { convert, type HtmlToTextOptions, type SelectorDefinition } from 'html-to-text';

/**
 * Default plain-text rules. Mark anything that must not appear in the text
 * part (preheaders, decorative blocks) with `data-skip-in-text="true"`, and a
 * layout table that should become aligned rows with `data-text-format="dataTable"`.
 */
export const plainTextSelectors: readonly SelectorDefinition[] = [
  { selector: 'img', format: 'skip' },
  { selector: '[data-skip-in-text=true]', format: 'skip' },
  { selector: 'a', options: { linkBrackets: false, hideLinkHrefIfSameAsText: true } },
  { selector: '[data-text-format="dataTable"]', format: 'dataTable' },
];

/** Converts email HTML to its plain-text alternative. User selectors are appended to the defaults. */
export function toPlainText(html: string, options: HtmlToTextOptions = {}): string {
  return convert(html, {
    wordwrap: false,
    ...options,
    selectors: [...plainTextSelectors, ...(options.selectors ?? [])],
  });
}
