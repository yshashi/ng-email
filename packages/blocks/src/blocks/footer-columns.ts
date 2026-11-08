import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface FooterLink {
  label: string;
  href: string;
}

/** Brand and tagline on the left, two link columns on the right, legal line below. */
@Component({
  selector: 'footer-columns',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <table ngeRow>
        <td ngeColumn [ngeStyle]="s.brandCol">
          <p ngeText [ngeStyle]="s.brand">{{ brand() }}</p>
          <p ngeText [ngeStyle]="s.muted">{{ tagline() }}</p>
        </td>
        <td ngeColumn [ngeStyle]="s.linkCol">
          @for (link of product(); track link.href) {
            <p ngeText [ngeStyle]="s.item"><a ngeLink [href]="link.href" [ngeStyle]="s.link">{{ link.label }}</a></p>
          }
        </td>
        <td ngeColumn [ngeStyle]="s.linkCol">
          @for (link of company(); track link.href) {
            <p ngeText [ngeStyle]="s.item"><a ngeLink [href]="link.href" [ngeStyle]="s.link">{{ link.label }}</a></p>
          }
        </td>
      </table>
      <p ngeText [ngeStyle]="s.legal">&copy; {{ year() }} {{ brand() }} Inc. All rights reserved.</p>
    </table>
  `,
})
export class FooterColumns {
  readonly brand = input('Acme');
  readonly tagline = input('Tools for teams who ship.');
  readonly year = input(new Date().getFullYear());
  readonly product = input<FooterLink[]>([
    { label: 'Features', href: 'https://example.com/features' },
    { label: 'Pricing', href: 'https://example.com/pricing' },
    { label: 'Changelog', href: 'https://example.com/changelog' },
  ]);
  readonly company = input<FooterLink[]>([
    { label: 'About', href: 'https://example.com/about' },
    { label: 'Careers', href: 'https://example.com/careers' },
    { label: 'Privacy', href: 'https://example.com/privacy' },
  ]);

  protected readonly s = {
    section: { padding: '32px 24px', backgroundColor: '#f9fafb' },
    brandCol: { width: '50%', verticalAlign: 'top', paddingRight: '16px' },
    linkCol: { width: '25%', verticalAlign: 'top' },
    brand: {
      margin: '0 0 4px',
      fontFamily: FONT,
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 700,
      color: '#111827',
    },
    muted: {
      margin: 0,
      fontFamily: FONT,
      fontSize: '13px',
      lineHeight: '20px',
      color: '#6b7280',
    },
    item: {
      margin: '0 0 8px',
      fontFamily: FONT,
      fontSize: '13px',
      lineHeight: '20px',
    },
    link: { color: '#374151', textDecoration: 'none' },
    legal: {
      margin: '24px 0 0',
      fontFamily: FONT,
      fontSize: '12px',
      lineHeight: '18px',
      color: '#9ca3af',
    },
  };
}
