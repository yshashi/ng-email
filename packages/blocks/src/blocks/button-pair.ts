import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** A primary and a secondary action side by side. Outlook gets the padding via ngeButton's MSO fill. */
@Component({
  selector: 'button-pair',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <a ngeButton [href]="primaryUrl()" [ngeStyle]="s.primary">{{ primaryLabel() }}</a>
      <span [attr.style]="s.gap"></span>
      <a ngeButton [href]="secondaryUrl()" [ngeStyle]="s.secondary">{{ secondaryLabel() }}</a>
    </table>
  `,
})
export class ButtonPair {
  readonly primaryLabel = input('Accept invite');
  readonly primaryUrl = input('https://example.com/invite/accept');
  readonly secondaryLabel = input('Decline');
  readonly secondaryUrl = input('https://example.com/invite/decline');

  protected readonly s = {
    section: { padding: '24px', textAlign: 'center' },
    gap: 'display:inline-block;width:12px',
    primary: {
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '12px 22px',
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#374151',
      border: '1px solid #d1d5db',
      fontFamily: FONT,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '11px 21px',
    },
  };
}
