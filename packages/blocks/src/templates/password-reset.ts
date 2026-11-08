import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Password reset: one button, the expiry, and what to do if the request was not theirs. */
@Component({
  selector: 'password-reset-email',
  imports: [EMAIL_COMPONENTS],
  template: `
    <html ngeHtml>
      <head ngeHead><title>Reset your password</title></head>
      <body ngeBody [ngeStyle]="s.body">
        <nge-preview text="Use this link to reset your password. It expires soon." />
        <table ngeContainer [ngeStyle]="s.container">
          <p ngeText [ngeStyle]="s.brand">{{ product() }}</p>
          <h1 ngeHeading [ngeStyle]="s.title">Reset your password</h1>
          <p ngeText [ngeStyle]="s.text">
            We received a request to reset the password for <strong>{{ email() }}</strong>. Click the button below to
            choose a new one.
          </p>
          <a ngeButton [href]="resetUrl()" [ngeStyle]="s.button">Reset password</a>
          <p ngeText [ngeStyle]="s.note">This link expires in {{ expiresIn() }} and can be used once.</p>
          <hr ngeHr [ngeStyle]="s.rule" />
          <p ngeText [ngeStyle]="s.small">
            Didn't ask for this? You can ignore this email; your password won't change. If you keep getting these,
            <a ngeLink [href]="securityUrl()" [ngeStyle]="s.link">review your account security</a>.
          </p>
        </table>
      </body>
    </html>
  `,
})
export class PasswordResetEmail {
  readonly product = input('Acme');
  readonly email = input('sam@example.com');
  readonly resetUrl = input('https://example.com/reset?token=7d1e9b');
  readonly expiresIn = input('30 minutes');
  readonly securityUrl = input('https://example.com/settings/security');

  protected readonly s = {
    body: { backgroundColor: '#f3f4f6', margin: 0, padding: '32px 12px' },
    container: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px 36px', maxWidth: '520px' },
    brand: { margin: '0 0 28px', fontFamily: FONT, fontSize: '18px', fontWeight: 700, color: '#4f46e5' },
    title: { margin: '0 0 12px', fontFamily: FONT, fontSize: '24px', lineHeight: '32px', fontWeight: 700, color: '#111827' },
    text: { margin: '0 0 24px', fontFamily: FONT, fontSize: '15px', lineHeight: '24px', color: '#374151' },
    button: {
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '12px 22px',
    },
    note: { margin: '16px 0 0', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', color: '#6b7280' },
    rule: { margin: '28px 0 20px', borderTop: '1px solid #e5e7eb' },
    small: { margin: 0, fontFamily: FONT, fontSize: '13px', lineHeight: '20px', color: '#6b7280' },
    link: { color: '#4f46e5' },
  };
}
