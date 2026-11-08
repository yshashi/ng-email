import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface HeaderLink {
  label: string;
  href: string;
}

/** Wordmark centered above a row of navigation links. */
@Component({
  selector: 'header-centered',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <p ngeText [ngeStyle]="s.brand">{{ brand() }}</p>
      <p ngeText [ngeStyle]="s.nav">
        @for (link of links(); track link.href; let last = $last) {
          <a ngeLink [href]="link.href" [ngeStyle]="s.link">{{ link.label }}</a>
          @if (!last) {<span [attr.style]="s.dot">&middot;</span>}
        }
      </p>
    </table>
  `,
})
export class HeaderCentered {
  readonly brand = input('Acme');
  readonly links = input<HeaderLink[]>([
    { label: 'Product', href: 'https://example.com/product' },
    { label: 'Pricing', href: 'https://example.com/pricing' },
    { label: 'Blog', href: 'https://example.com/blog' },
    { label: 'Support', href: 'https://example.com/support' },
  ]);

  protected readonly s = {
    section: { padding: '32px 24px 16px', textAlign: 'center' },
    brand: {
      margin: 0,
      fontFamily: FONT,
      fontSize: '22px',
      lineHeight: '28px',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#111827',
    },
    nav: {
      margin: '12px 0 0',
      fontFamily: FONT,
      fontSize: '14px',
      lineHeight: '20px',
    },
    link: { color: '#4b5563', textDecoration: 'none' },
    dot: 'color:#d1d5db;padding:0 10px',
  };
}
