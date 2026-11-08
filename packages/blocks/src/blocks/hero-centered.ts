import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Eyebrow, headline, supporting text and one call to action, all centered. */
@Component({
  selector: 'hero-centered',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <p ngeText [ngeStyle]="s.eyebrow">{{ eyebrow() }}</p>
      <h1 ngeHeading [ngeStyle]="s.title">{{ title() }}</h1>
      <p ngeText [ngeStyle]="s.body">{{ body() }}</p>
      <a ngeButton [href]="ctaUrl()" [ngeStyle]="s.button">{{ ctaLabel() }}</a>
    </table>
  `,
})
export class HeroCentered {
  readonly eyebrow = input('New in Acme');
  readonly title = input('Ship reports your team will actually read');
  readonly body = input('Dashboards now update in real time, and you can share any view with a single link.');
  readonly ctaLabel = input('See what is new');
  readonly ctaUrl = input('https://example.com/changelog');

  protected readonly s = {
    section: { padding: '40px 32px', textAlign: 'center' },
    eyebrow: {
      margin: '0 0 8px',
      fontFamily: FONT,
      fontSize: '13px',
      lineHeight: '20px',
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: '#4f46e5',
    },
    title: {
      margin: '0 0 12px',
      fontFamily: FONT,
      fontSize: '30px',
      lineHeight: '38px',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#111827',
    },
    body: { margin: '0 0 28px', fontFamily: FONT, fontSize: '16px', lineHeight: '26px', color: '#4b5563' },
    button: {
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '12px 22px',
    },
  };
}
