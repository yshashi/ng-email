import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/** ng-email's mark: an envelope on the brand gradient. Our own mark, not Angular's. */
@Component({
  selector: 'site-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 32 32" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
      <defs>
        <linearGradient [attr.id]="id" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="oklch(63.32% 0.24 31.68)" />
          <stop offset="0.5" stop-color="oklch(69.02% 0.277 332.77)" />
          <stop offset="1" stop-color="oklch(53.18% 0.28 296.97)" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="28" height="20" rx="5" [attr.fill]="'url(#' + id + ')'" />
      <path d="m7 11.5 9 6.5 9-6.5" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class Logo {
  readonly size = input(28);
  protected readonly id = `ng-email-logo-${nextId++}`;
}
