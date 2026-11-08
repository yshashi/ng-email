import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Spike-only Button. Attribute selector on a native <a> so the component host
 * IS the email element (no custom <e-button> tag reaches the final HTML).
 */
@Component({
  selector: 'a[ngEmailButton]',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.href]': 'href()',
    '[attr.target]': 'target()',
    '[attr.style]': 'hostStyle()',
  },
  template:
    '<span [innerHTML]="msoLeft()"></span>' +
    '<span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9pt">{{ label() }}</span>' +
    '<span [innerHTML]="msoRight()"></span>',
})
export class Button {
  private readonly sanitizer = inject(DomSanitizer);

  readonly href = input.required<string>();
  readonly label = input.required<string>();
  readonly target = input('_blank');

  protected readonly hostStyle = computed(
    () =>
      'line-height:100%;text-decoration:none;display:inline-block;max-width:100%;' +
      'mso-padding-alt:0px;padding:12px 20px 12px 20px',
  );

  // Outlook (MSO) padding hack: conditional comments survive only if the
  // renderer is told to trust them; Angular's sanitizer strips comments.
  protected readonly msoLeft = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      '<!--[if mso]><i style="mso-font-width:400%;mso-text-raise:18pt" hidden>&#8202;&#8202;</i><![endif]-->',
    ),
  );
  protected readonly msoRight = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      '<!--[if mso]><i style="mso-font-width:400%" hidden>&#8202;&#8202;&#8203;</i><![endif]-->',
    ),
  );
}
