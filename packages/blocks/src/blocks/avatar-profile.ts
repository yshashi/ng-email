import { Component, computed, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Initials avatar with name and role. Uses no image, so it shows even when
 * images are blocked (Outlook draws it as a square: no border-radius there).
 */
@Component({
  selector: 'avatar-profile',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <table ngeRow width="auto" align="left">
        <td ngeColumn [ngeStyle]="avatarStyle()">{{ initials() }}</td>
        <td ngeColumn [ngeStyle]="s.details">
          <p ngeText [ngeStyle]="s.name">{{ name() }}</p>
          <p ngeText [ngeStyle]="s.role">{{ role() }}</p>
        </td>
      </table>
    </table>
  `,
})
export class AvatarProfile {
  readonly name = input('Maya Chen');
  readonly role = input('Head of Customer Success, Acme');
  readonly color = input('#4f46e5');

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  protected readonly avatarStyle = computed(() => ({
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    backgroundColor: this.color(),
    color: '#ffffff',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontFamily: FONT,
    fontSize: '17px',
    fontWeight: 700,
  }));

  protected readonly s = {
    section: { padding: '20px 24px' },
    details: { paddingLeft: '14px', verticalAlign: 'middle' },
    name: { margin: 0, fontFamily: FONT, fontSize: '15px', lineHeight: '22px', fontWeight: 600, color: '#111827' },
    role: { margin: 0, fontFamily: FONT, fontSize: '13px', lineHeight: '20px', color: '#6b7280' },
  };
}
