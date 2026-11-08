import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { isBoxProperty, parsePadding, pxToPt } from './box';
import { computeHairSpaceFill, round } from './button-math';
import { type EmailStyle, mergeStyles, parseStyle, partitionStyle, toStyleString } from './style';

const HAIR_SPACE = '&#8202;';
const ZERO_WIDTH_SPACE = '&#8203;';

/**
 * Link styled as a button, with padding that also works in Outlook.
 *
 * Set padding through `ngeStyle` (`padding`, or `padding-*`, in px/em/rem/%).
 * Modern clients use the CSS padding. Outlook ignores padding on `<a>`, so
 * MSO-only conditional comments add hair spaces sized to the left/right
 * padding, and `mso-text-raise` fakes the vertical padding.
 */
@Component({
  selector: 'a[ngeButton]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.href]': 'href()', '[attr.target]': 'target()', '[attr.style]': 'buttonStyle()' },
  template:
    '<span [innerHTML]="msoBefore()"></span>' +
    '<span [attr.style]="labelStyle()"><ng-content /></span>' +
    '<span [innerHTML]="msoAfter()"></span>',
})
export class EmailButton {
  readonly href = input.required<string>();
  readonly target = input('_blank');
  readonly ngeStyle = input<EmailStyle>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly style = computed(() => parseStyle(this.ngeStyle()));
  private readonly padding = computed(() => parsePadding(this.style()));

  protected readonly buttonStyle = computed(() => {
    const [, rest] = partitionStyle(this.style(), (p) => isBoxProperty(p, 'padding'));
    const { top, right, bottom, left } = this.padding();
    return toStyleString(
      mergeStyles(
        'line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px',
        rest,
        { paddingTop: top, paddingRight: right, paddingBottom: bottom, paddingLeft: left },
      ),
    );
  });

  protected readonly labelStyle = computed(() => {
    const raise = pxToPt(this.padding().bottom);
    return toStyleString(
      mergeStyles('max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px', {
        msoTextRaise: raise === undefined ? undefined : round(raise),
      }),
    );
  });

  // Only library-built strings of numbers reach the bypass, never user input.
  protected readonly msoBefore = computed(() => {
    const { top, bottom, left } = this.padding();
    const fill = computeHairSpaceFill(left);
    const raise = round(pxToPt((top ?? 0) + (bottom ?? 0)) ?? 0);
    return this.sanitizer.bypassSecurityTrustHtml(
      `<!--[if mso]><i style="mso-font-width:${round(fill.fontWidth * 100)}%;mso-text-raise:${raise}px" hidden>` +
        `${HAIR_SPACE.repeat(fill.spaceCount)}</i><![endif]-->`,
    );
  });

  protected readonly msoAfter = computed(() => {
    const fill = computeHairSpaceFill(this.padding().right);
    return this.sanitizer.bypassSecurityTrustHtml(
      `<!--[if mso]><i style="mso-font-width:${round(fill.fontWidth * 100)}%" hidden>` +
        `${HAIR_SPACE.repeat(fill.spaceCount)}${ZERO_WIDTH_SPACE}</i><![endif]-->`,
    );
  });
}
