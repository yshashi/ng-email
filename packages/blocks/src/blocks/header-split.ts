import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface HeaderLink {
  label: string;
  href: string;
}

/** Wordmark on the left, navigation links on the right, with a bottom rule. */
@Component({
  selector: 'header-split',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <table ngeRow>
        <td ngeColumn [ngeStyle]="s.brandCell">
          <span [attr.style]="s.mark">{{ brand().charAt(0) }}</span>
          <span [attr.style]="s.brand">{{ brand() }}</span>
        </td>
        <td ngeColumn [ngeStyle]="s.navCell">
          @for (link of links(); track link.href) {
            <a ngeLink [href]="link.href" [ngeStyle]="s.link">{{ link.label }}</a>
          }
        </td>
      </table>
    </table>
  `,
})
export class HeaderSplit {
  readonly brand = input('Acme');
  readonly links = input<HeaderLink[]>([
    { label: 'Dashboard', href: 'https://example.com/app' },
    { label: 'Docs', href: 'https://example.com/docs' },
  ]);

  protected readonly s = {
    section: { padding: '24px', borderBottom: '1px solid #e5e7eb' },
    brandCell: { verticalAlign: 'middle' },
    navCell: { verticalAlign: 'middle', textAlign: 'right' },
    // Plain <span>s take a style string (ngeStyle is only on email components).
    mark:
      'display:inline-block;width:28px;height:28px;line-height:28px;border-radius:8px;background-color:#4f46e5;' +
      `color:#ffffff;text-align:center;font-weight:700;font-size:15px;font-family:${FONT};vertical-align:middle`,
    brand: `padding-left:10px;font-family:${FONT};font-size:18px;font-weight:700;color:#111827;vertical-align:middle`,
    link: {
      marginLeft: '20px',
      fontFamily: FONT,
      fontSize: '14px',
      color: '#4b5563',
      textDecoration: 'none',
    },
  };
}
