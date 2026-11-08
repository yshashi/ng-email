import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** A single plan: name, price, what is included, and an upgrade button. */
@Component({
  selector: 'pricing-card',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <table ngeSection [ngeStyle]="s.card">
        <p ngeText [ngeStyle]="s.plan">{{ plan() }}</p>
        <p ngeText [ngeStyle]="s.priceLine">
          <span [attr.style]="s.price">{{ price() }}</span><span [attr.style]="s.period"> {{ period() }}</span>
        </p>
        <p ngeText [ngeStyle]="s.summary">{{ summary() }}</p>
        <hr ngeHr [ngeStyle]="s.rule" />
        @for (item of included(); track item) {
          <p ngeText [ngeStyle]="s.item"><span [attr.style]="s.tick">&#10003;</span>{{ item }}</p>
        }
        <a ngeButton [href]="ctaUrl()" [ngeStyle]="s.button">{{ ctaLabel() }}</a>
      </table>
    </table>
  `,
})
export class PricingCard {
  readonly plan = input('Team');
  readonly price = input('$24');
  readonly period = input('per user / month');
  readonly summary = input('For growing teams that need control and visibility.');
  readonly included = input<string[]>([
    'Unlimited projects and dashboards',
    'Single sign-on (SAML)',
    'Priority support, 4-hour response',
  ]);
  readonly ctaLabel = input('Upgrade to Team');
  readonly ctaUrl = input('https://example.com/billing/upgrade');

  protected readonly s = {
    section: { padding: '24px' },
    card: { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px' },
    plan: { margin: '0 0 4px', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: '#4f46e5' },
    priceLine: { margin: '0 0 8px', fontFamily: FONT, lineHeight: '40px' },
    price: `font-family:${FONT};font-size:36px;font-weight:700;color:#111827`,
    period: `font-family:${FONT};font-size:14px;color:#6b7280`,
    summary: { margin: 0, fontFamily: FONT, fontSize: '14px', lineHeight: '22px', color: '#4b5563' },
    rule: { margin: '20px 0', borderTop: '1px solid #e5e7eb' },
    item: { margin: '0 0 10px', fontFamily: FONT, fontSize: '14px', lineHeight: '22px', color: '#374151' },
    tick: 'color:#4f46e5;font-weight:700;padding-right:10px',
    button: {
      display: 'block',
      textAlign: 'center',
      marginTop: '20px',
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '12px 20px',
    },
  };
}
