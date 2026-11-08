import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Full-width call to action with a plain fallback link underneath. */
@Component({
  selector: 'button-full',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <a ngeButton [href]="url()" [ngeStyle]="s.button">{{ label() }}</a>
      <p ngeText [ngeStyle]="s.hint">
        Button not working? Paste this link into your browser:<br />
        <a ngeLink [href]="url()" [ngeStyle]="s.link">{{ url() }}</a>
      </p>
    </table>
  `,
})
export class ButtonFull {
  readonly label = input('Verify email address');
  readonly url = input('https://example.com/verify?token=4f9a2c');

  protected readonly s = {
    section: { padding: '24px' },
    button: {
      display: 'block',
      textAlign: 'center',
      backgroundColor: '#111827',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '16px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '14px 24px',
    },
    hint: { margin: '16px 0 0', fontFamily: FONT, fontSize: '13px', lineHeight: '20px', color: '#6b7280' },
    link: { color: '#4f46e5', wordBreak: 'break-all' },
  };
}
