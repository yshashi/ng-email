import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'copy'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'github'
  | 'blocks'
  | 'mail'
  | 'docs'
  | 'sun'
  | 'moon'
  | 'monitor';

/** Line icons drawn on Lucide's 24px grid (ISC license), 1.5 stroke. */
@Component({
  selector: 'site-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      [attr.width]="size()"
      [attr.height]="size()"
    >
      @switch (name()) {
        @case ('copy') {
          <svg:rect width="14" height="14" x="8" y="8" rx="2" />
          <svg:path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        }
        @case ('check') {<svg:path d="M20 6 9 17l-5-5" />}
        @case ('chevron-left') {<svg:path d="m15 18-6-6 6-6" />}
        @case ('chevron-right') {<svg:path d="m9 18 6-6-6-6" />}
        @case ('chevron-down') {<svg:path d="m6 9 6 6 6-6" />}
        @case ('blocks') {
          <svg:rect width="7" height="7" x="3" y="3" rx="1" />
          <svg:rect width="7" height="7" x="14" y="3" rx="1" />
          <svg:rect width="7" height="7" x="14" y="14" rx="1" />
          <svg:rect width="7" height="7" x="3" y="14" rx="1" />
        }
        @case ('mail') {
          <svg:rect width="20" height="16" x="2" y="4" rx="2" />
          <svg:path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        }
        @case ('docs') {
          <svg:path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <svg:path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <svg:path d="M10 9H8" />
          <svg:path d="M16 13H8" />
          <svg:path d="M16 17H8" />
        }
        @case ('sun') {
          <svg:circle cx="12" cy="12" r="4" />
          <svg:path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        }
        @case ('moon') {<svg:path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />}
        @case ('monitor') {
          <svg:rect width="20" height="14" x="2" y="3" rx="2" />
          <svg:path d="M8 21h8M12 17v4" />
        }
        @case ('github') {
          <svg:path
            d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
          />
          <svg:path d="M9 18c-4.51 2-5-2-7-2" />
        }
      }
    </svg>
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(16);
}
