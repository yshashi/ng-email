import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Sign-in code with a magic-link fallback. The code is big, spaced and easy to copy. */
@Component({
  selector: 'login-code-email',
  imports: [EMAIL_COMPONENTS],
  template: `
    <html ngeHtml>
      <head ngeHead><title>Your sign-in code</title></head>
      <body ngeBody [ngeStyle]="s.body">
        <nge-preview [text]="'Your ' + product() + ' sign-in code is ' + code()" />
        <table ngeContainer [ngeStyle]="s.container">
          <p ngeText [ngeStyle]="s.brand">{{ product() }}</p>
          <h1 ngeHeading [ngeStyle]="s.title">Your sign-in code</h1>
          <p ngeText [ngeStyle]="s.text">Enter this code in the window where you started signing in:</p>
          <table ngeSection [ngeStyle]="s.codeBox">
            <p ngeText [ngeStyle]="s.code">{{ code() }}</p>
          </table>
          <p ngeText [ngeStyle]="s.text">
            Or sign in directly with <a ngeLink [href]="magicLinkUrl()" [ngeStyle]="s.link">this link</a>. The code
            and link expire in {{ expiresIn() }}.
          </p>
          <p ngeText [ngeStyle]="s.small">
            Requested from {{ location() }}. If this wasn't you, you can safely ignore this email.
          </p>
        </table>
      </body>
    </html>
  `,
})
export class LoginCodeEmail {
  readonly product = input('Acme');
  readonly code = input('482 913');
  readonly magicLinkUrl = input('https://example.com/login/verify?token=91fa');
  readonly expiresIn = input('10 minutes');
  readonly location = input('Chrome on macOS, Lisbon, Portugal');

  protected readonly s = {
    body: { backgroundColor: '#f3f4f6', margin: 0, padding: '32px 12px' },
    container: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px 36px', maxWidth: '480px' },
    brand: { margin: '0 0 28px', fontFamily: FONT, fontSize: '18px', fontWeight: 700, color: '#4f46e5' },
    title: { margin: '0 0 12px', fontFamily: FONT, fontSize: '24px', lineHeight: '32px', fontWeight: 700, color: '#111827' },
    text: { margin: '0 0 16px', fontFamily: FONT, fontSize: '15px', lineHeight: '24px', color: '#374151' },
    codeBox: { margin: '8px 0 24px', backgroundColor: '#f5f3ff', borderRadius: '10px', textAlign: 'center' },
    code: {
      margin: 0,
      padding: '18px 0',
      fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace",
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 700,
      letterSpacing: '0.18em',
      color: '#4338ca',
    },
    link: { color: '#4f46e5' },
    small: { margin: '8px 0 0', fontFamily: FONT, fontSize: '13px', lineHeight: '20px', color: '#9ca3af' },
  };
}
