import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Company name, postal address and an unsubscribe link: what most providers require in bulk email. */
@Component({
  selector: 'footer-simple',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <hr ngeHr [ngeStyle]="s.rule" />
      <p ngeText [ngeStyle]="s.text">{{ company() }} &middot; {{ address() }}</p>
      <p ngeText [ngeStyle]="s.text">
        You received this email because you signed up for {{ company() }}.
        <a ngeLink [href]="unsubscribeUrl()" [ngeStyle]="s.link">Unsubscribe</a>
      </p>
    </table>
  `,
})
export class FooterSimple {
  readonly company = input('Acme Inc.');
  readonly address = input('100 Market Street, San Francisco, CA 94105');
  readonly unsubscribeUrl = input('https://example.com/unsubscribe');

  protected readonly s = {
    section: { padding: '8px 24px 32px', textAlign: 'center' },
    rule: { margin: '0 0 20px', borderTop: '1px solid #e5e7eb' },
    text: {
      margin: '0 0 6px',
      fontFamily: FONT,
      fontSize: '12px',
      lineHeight: '18px',
      color: '#6b7280',
    },
    link: { color: '#6b7280', textDecoration: 'underline' },
  };
}
