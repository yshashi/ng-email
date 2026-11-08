import { Component, computed, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** "X invited you to Y": who invited them, which team, their role, and an accept button. */
@Component({
  selector: 'team-invite-email',
  imports: [EMAIL_COMPONENTS],
  template: `
    <html ngeHtml>
      <head ngeHead><title>Join {{ team() }} on {{ product() }}</title></head>
      <body ngeBody [ngeStyle]="s.body">
        <nge-preview [text]="inviter() + ' invited you to join ' + team() + ' on ' + product()" />
        <table ngeContainer [ngeStyle]="s.container">
          <table ngeRow width="auto" align="center">
            <td ngeColumn [ngeStyle]="s.avatar">{{ initials() }}</td>
          </table>
          <h1 ngeHeading [ngeStyle]="s.title">Join {{ team() }} on {{ product() }}</h1>
          <p ngeText [ngeStyle]="s.text">
            <strong>{{ inviter() }}</strong> ({{ inviterEmail() }}) invited you to the <strong>{{ team() }}</strong>
            workspace as {{ role() }}.
          </p>
          <a ngeButton [href]="acceptUrl()" [ngeStyle]="s.button">Accept invitation</a>
          <p ngeText [ngeStyle]="s.small">
            This invitation was sent to {{ inviteeEmail() }} and expires in 7 days. Not expecting it? You can ignore
            this email.
          </p>
        </table>
      </body>
    </html>
  `,
})
export class TeamInviteEmail {
  readonly product = input('Acme');
  readonly team = input('Design Systems');
  readonly inviter = input('Lena Fischer');
  readonly inviterEmail = input('lena@example.com');
  readonly inviteeEmail = input('jordan@example.com');
  readonly role = input('an editor');
  readonly acceptUrl = input('https://example.com/invite/accept?token=c02e');

  protected readonly initials = computed(() =>
    this.inviter()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  protected readonly s = {
    body: { backgroundColor: '#f3f4f6', margin: 0, padding: '32px 12px' },
    container: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px 36px', maxWidth: '520px', textAlign: 'center' },
    avatar: {
      width: '56px',
      height: '56px',
      borderRadius: '28px',
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      textAlign: 'center',
      verticalAlign: 'middle',
      fontFamily: FONT,
      fontSize: '20px',
      fontWeight: 700,
    },
    title: { margin: '20px 0 12px', fontFamily: FONT, fontSize: '24px', lineHeight: '32px', fontWeight: 700, color: '#111827' },
    text: { margin: '0 0 28px', fontFamily: FONT, fontSize: '15px', lineHeight: '24px', color: '#374151' },
    button: {
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '12px 24px',
    },
    small: { margin: '28px 0 0', fontFamily: FONT, fontSize: '13px', lineHeight: '20px', color: '#9ca3af' },
  };
}
