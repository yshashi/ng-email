import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

import { isBoxProperty, readBox } from './box';
import { type EmailStyle, type StyleValue, mergeStyles, parseStyle, partitionStyle, toStyleString } from './style';

/**
 * Paragraph with email-safe defaults (14px / 24px, 16px top and bottom margin).
 * A `margin` shorthand is expanded to longhands, since some clients drop shorthands.
 */
@Component({
  selector: 'p[ngeText]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.style]': 'textStyle()' },
  template: '<ng-content />',
})
export class EmailText {
  readonly ngeStyle = input<EmailStyle>();

  protected readonly textStyle = computed(() => {
    const user = parseStyle(this.ngeStyle());
    const margin = readBox(user, 'margin');
    const [, rest] = partitionStyle(user, (p) => isBoxProperty(p, 'margin'));
    return toStyleString(
      mergeStyles({ fontSize: '14px', lineHeight: '24px' }, rest, {
        marginTop: margin.top ?? '16px',
        marginRight: margin.right,
        marginBottom: margin.bottom ?? '16px',
        marginLeft: margin.left,
      }),
    );
  });
}

type Length = string | number;

/** `<h1>`…`<h6>` with margin shorthands: `m`, `mx`, `my`, `mt`, `mr`, `mb`, `ml` (numbers are px). */
@Component({
  selector:
    'h1[ngeHeading], h2[ngeHeading], h3[ngeHeading], h4[ngeHeading], h5[ngeHeading], h6[ngeHeading]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.style]': 'headingStyle()',
    // A static input such as mx="8px" is also written as a DOM attribute;
    // these are not HTML attributes, so clear them from the email.
    '[attr.m]': 'null',
    '[attr.mx]': 'null',
    '[attr.my]': 'null',
    '[attr.mt]': 'null',
    '[attr.mr]': 'null',
    '[attr.mb]': 'null',
    '[attr.ml]': 'null',
  },
  template: '<ng-content />',
})
export class EmailHeading {
  readonly ngeStyle = input<EmailStyle>();
  readonly m = input<Length>();
  readonly mx = input<Length>();
  readonly my = input<Length>();
  readonly mt = input<Length>();
  readonly mr = input<Length>();
  readonly mb = input<Length>();
  readonly ml = input<Length>();

  protected readonly headingStyle = computed(() => {
    const sides: Record<'top' | 'right' | 'bottom' | 'left', StyleValue> = {
      top: undefined,
      right: undefined,
      bottom: undefined,
      left: undefined,
    };
    const set = (value: Length | undefined, ...keys: Array<keyof typeof sides>) => {
      if (value !== undefined) for (const key of keys) sides[key] = value;
    };
    set(this.m(), 'top', 'right', 'bottom', 'left');
    set(this.mx(), 'left', 'right');
    set(this.my(), 'top', 'bottom');
    set(this.mt(), 'top');
    set(this.mr(), 'right');
    set(this.mb(), 'bottom');
    set(this.ml(), 'left');
    return toStyleString(
      mergeStyles(
        { marginTop: sides.top, marginRight: sides.right, marginBottom: sides.bottom, marginLeft: sides.left },
        this.ngeStyle(),
      ),
    );
  });
}

/** Link that opens in a new tab, with a visible default color and no underline. */
@Component({
  selector: 'a[ngeLink]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.href]': 'href()', '[attr.target]': 'target()', '[attr.style]': 'linkStyle()' },
  template: '<ng-content />',
})
export class EmailLink {
  readonly href = input.required<string>();
  readonly target = input('_blank');
  readonly ngeStyle = input<EmailStyle>();

  protected readonly linkStyle = computed(() =>
    toStyleString(mergeStyles('color:#067df7;text-decoration-line:none', this.ngeStyle())),
  );
}

/** Image as a block with no border or outline (removes gaps and blue link borders). `alt` defaults to empty. */
@Component({
  selector: 'img[ngeImg]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.alt]': 'alt()', '[attr.style]': 'imgStyle()' },
  template: '',
})
export class EmailImg {
  readonly alt = input('');
  readonly ngeStyle = input<EmailStyle>();

  protected readonly imgStyle = computed(() =>
    toStyleString(
      mergeStyles('display:block;outline:none;border:none;text-decoration:none', this.ngeStyle()),
    ),
  );
}

/** Horizontal rule that looks the same across clients. */
@Component({
  selector: 'hr[ngeHr]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.style]': 'hrStyle()' },
  template: '',
})
export class EmailHr {
  readonly ngeStyle = input<EmailStyle>();

  protected readonly hrStyle = computed(() =>
    toStyleString(
      mergeStyles(
        'width:100%;border:none;border-color:transparent;border-top:1px solid #eaeaea',
        this.ngeStyle(),
      ),
    ),
  );
}
