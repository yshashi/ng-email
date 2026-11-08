import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

/** Inbox preview text is truncated to this many characters. */
export const PREVIEW_MAX_LENGTH = 200;

/**
 * Invisible characters (NBSP, ZWNJ, ZWSP, ZWJ, BOM) used to fill the rest of
 * the preview, so clients do not pull body text into the inbox snippet.
 */
const FILLER = ' ‌​‍﻿';

/**
 * Hidden inbox preview text ("preheader"). Place it first inside `<body ngeBody>`.
 * The host element is unwrapped by the renderer, leaving only the hidden `<div>`.
 */
@Component({
  selector: 'nge-preview',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<div [attr.style]="hidden" data-skip-in-text="true">{{ preview() }}' +
    '@if (filler()) {<div>{{ filler() }}</div>}</div>',
})
export class EmailPreview {
  readonly text = input.required<string>();

  protected readonly hidden =
    'display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0';
  protected readonly preview = computed(() => this.text().slice(0, PREVIEW_MAX_LENGTH));
  protected readonly filler = computed(() => {
    const remaining = PREVIEW_MAX_LENGTH - this.preview().length;
    return remaining > 0 ? FILLER.repeat(remaining) : '';
  });
}
