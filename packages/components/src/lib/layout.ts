import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { isBoxProperty } from './box';
import { type EmailStyle, mergeStyles, parseStyle, partitionStyle, toStyleString } from './style';

export type TextDirection = 'ltr' | 'rtl' | 'auto';

const FULL_WIDTH = 'width:100%';

/** `<html>` root with `lang` and `dir` defaults. */
@Component({
  selector: 'html[ngeHtml]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.lang]': 'lang()', '[attr.dir]': 'dir()' },
  template: '<ng-content />',
})
export class EmailHtml {
  readonly lang = input('en');
  readonly dir = input<TextDirection>('ltr');
}

/**
 * `<head>` with the two metas every email needs: an explicit charset, and
 * `x-apple-disable-message-reformatting` so Apple Mail does not rescale text.
 * Put `<title>`, `<nge-font>` and any `<style>` inside it.
 */
@Component({
  selector: 'head[ngeHead]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />' +
    '<meta name="x-apple-disable-message-reformatting" />' +
    '<ng-content />',
})
export class EmailHead {}

/**
 * `<body>`. Yahoo and AOL turn `<body>` into a `<div>` and drop its styles,
 * so the full style goes on an inner full-width table cell. The body itself
 * keeps only the background, plus zeroed margin/padding when you set any.
 */
@Component({
  selector: 'body[ngeBody]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.style]': 'bodyStyle()', '[attr.lang]': 'lang()', '[attr.dir]': 'dir()' },
  template:
    '<table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">' +
    '<tbody><tr><td [attr.style]="cellStyle()" [attr.lang]="lang()" [attr.dir]="dir()">' +
    '<ng-content /></td></tr></tbody></table>',
})
export class EmailBody {
  readonly ngeStyle = input<EmailStyle>();
  readonly lang = input('en');
  readonly dir = input<TextDirection>('ltr');

  private readonly style = computed(() => parseStyle(this.ngeStyle()));

  protected readonly bodyStyle = computed(() => {
    const body = new Map<string, string>();
    for (const [property, value] of this.style()) {
      if (property === 'background' || property === 'background-color') {
        body.set(property, value);
      } else if (isBoxProperty(property, 'margin') || isBoxProperty(property, 'padding')) {
        body.set(property, '0');
      }
    }
    return toStyleString(body);
  });

  protected readonly cellStyle = computed(() => toStyleString(this.style()));
}

/** Shared by Container and Section: padding goes on the cell, the rest on the table. */
@Directive()
abstract class PaddedTable {
  readonly ngeStyle = input<EmailStyle>();
  readonly width = input('100%');
  readonly align = input<'left' | 'center' | 'right'>('center');

  protected abstract readonly tableDefaults: EmailStyle | undefined;

  private readonly parts = computed(() =>
    // Outlook ignores padding on <table>; it is reliable on <td>.
    partitionStyle(parseStyle(this.ngeStyle()), (p) => isBoxProperty(p, 'padding')),
  );

  protected readonly tableStyle = computed(() =>
    toStyleString(mergeStyles(this.tableDefaults, this.parts()[1])),
  );
  protected readonly cellStyle = computed(() => toStyleString(this.parts()[0]));
}

const TABLE_HOST = {
  '[attr.align]': 'align()',
  '[attr.width]': 'width()',
  border: '0',
  cellpadding: '0',
  cellspacing: '0',
  role: 'presentation',
  '[attr.style]': 'tableStyle()',
};

/** Centered, max 600px (37.5em) wide presentation table. Children land in its single cell. */
@Component({
  selector: 'table[ngeContainer]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: TABLE_HOST,
  template:
    '<tbody><tr [attr.style]="rowStyle"><td [attr.style]="cellStyle()"><ng-content /></td></tr></tbody>',
})
export class EmailContainer extends PaddedTable {
  protected override readonly tableDefaults = 'max-width:37.5em';
  protected readonly rowStyle = FULL_WIDTH;
}

/** Full-width presentation table with one cell. */
@Component({
  selector: 'table[ngeSection]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: TABLE_HOST,
  template: '<tbody><tr><td [attr.style]="cellStyle()"><ng-content /></td></tr></tbody>',
})
export class EmailSection extends PaddedTable {
  protected override readonly tableDefaults = undefined;
}

/** Presentation table with one row; project `<td ngeColumn>` cells into it. */
@Component({
  selector: 'table[ngeRow]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.align]': 'align()',
    '[attr.width]': 'width()',
    border: '0',
    cellpadding: '0',
    cellspacing: '0',
    role: 'presentation',
    '[attr.style]': 'rowTableStyle()',
  },
  template:
    '<tbody [attr.style]="fullWidth"><tr [attr.style]="fullWidth"><ng-content /></tr></tbody>',
})
export class EmailRow {
  readonly ngeStyle = input<EmailStyle>();
  readonly width = input('100%');
  readonly align = input<'left' | 'center' | 'right'>('center');

  protected readonly fullWidth = FULL_WIDTH;
  protected readonly rowTableStyle = computed(() => toStyleString(this.ngeStyle()));
}

/** A cell inside `<table ngeRow>`. */
@Component({
  selector: 'td[ngeColumn]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.style]': 'columnStyle()' },
  template: '<ng-content />',
})
export class EmailColumn {
  readonly ngeStyle = input<EmailStyle>();
  protected readonly columnStyle = computed(() => toStyleString(this.ngeStyle()));
}
