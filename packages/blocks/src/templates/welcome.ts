import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Sent right after sign-up: greeting, three first steps, one button. */
@Component({
  selector: 'welcome-email',
  imports: [EMAIL_COMPONENTS],
  template: `
    <html ngeHtml>
      <head ngeHead><title>Welcome to {{ product() }}</title></head>
      <body ngeBody [ngeStyle]="s.body">
        <nge-preview [text]="'Welcome, ' + name() + '. Here is how to get set up in five minutes.'" />
        <table ngeContainer [ngeStyle]="s.container">
          <p ngeText [ngeStyle]="s.brand">{{ product() }}</p>
          <h1 ngeHeading [ngeStyle]="s.title">Welcome aboard, {{ name() }}</h1>
          <p ngeText [ngeStyle]="s.text">
            Your workspace <strong>{{ workspace() }}</strong> is ready. Most teams are up and running in about five
            minutes. Here is where to start:
          </p>
          @for (step of steps; track step; let i = $index) {
            <table ngeRow>
              <td ngeColumn [ngeStyle]="s.numberCell"><span [attr.style]="s.number">{{ i + 1 }}</span></td>
              <td ngeColumn [ngeStyle]="s.stepCell">{{ step }}</td>
            </table>
          }
          <a ngeButton [href]="dashboardUrl()" [ngeStyle]="s.button">Open your dashboard</a>
          <p ngeText [ngeStyle]="s.text">
            Questions? Reply to this email. It goes to a real person on our support team.
          </p>
          <p ngeText [ngeStyle]="s.signoff">The {{ product() }} team</p>
        </table>
        <p ngeText [ngeStyle]="s.footer">{{ company() }} &middot; 100 Market Street, San Francisco, CA 94105</p>
      </body>
    </html>
  `,
})
export class WelcomeEmail {
  readonly name = input('Priya');
  readonly product = input('Acme');
  readonly workspace = input('priya-design');
  readonly company = input('Acme Inc.');
  readonly dashboardUrl = input('https://example.com/app');

  protected readonly steps = [
    'Connect a data source, or upload a CSV.',
    'Pick a dashboard template.',
    'Invite a teammate to collaborate.',
  ];

  protected readonly s = {
    body: { backgroundColor: '#f3f4f6', margin: 0, padding: '32px 12px' },
    container: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px 36px' },
    brand: { margin: '0 0 28px', fontFamily: FONT, fontSize: '20px', fontWeight: 700, color: '#4f46e5' },
    title: { margin: '0 0 12px', fontFamily: FONT, fontSize: '26px', lineHeight: '34px', fontWeight: 700, color: '#111827' },
    text: { margin: '0 0 18px', fontFamily: FONT, fontSize: '15px', lineHeight: '24px', color: '#374151' },
    numberCell: { width: '36px', verticalAlign: 'top', paddingBottom: '10px' },
    number:
      'display:inline-block;width:24px;height:24px;line-height:24px;border-radius:12px;text-align:center;' +
      `background-color:#e0e7ff;color:#4f46e5;font-family:${FONT};font-size:12px;font-weight:700`,
    stepCell: {
      verticalAlign: 'top',
      paddingBottom: '10px',
      fontFamily: FONT,
      fontSize: '15px',
      lineHeight: '24px',
      color: '#111827',
    },
    button: {
      margin: '14px 0 26px',
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '12px 22px',
    },
    signoff: { margin: 0, fontFamily: FONT, fontSize: '15px', lineHeight: '24px', fontWeight: 600, color: '#111827' },
    footer: {
      margin: '20px 0 0',
      textAlign: 'center',
      fontFamily: FONT,
      fontSize: '12px',
      lineHeight: '18px',
      color: '#9ca3af',
    },
  };
}
