import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface GroupMember {
  initials: string;
  color: string;
}

/** A row of initials avatars with a "+N more" count, e.g. for activity digests. */
@Component({
  selector: 'avatar-group',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <p ngeText [ngeStyle]="s.caption">{{ caption() }}</p>
      <table ngeRow width="auto" align="left">
        @for (member of members(); track member.initials) {
          <td ngeColumn [ngeStyle]="s.cell">
            <span [attr.style]="circle(member.color)">{{ member.initials }}</span>
          </td>
        }
        @if (more() > 0) {
          <td ngeColumn [ngeStyle]="s.cell"><span [attr.style]="moreStyle">+{{ more() }}</span></td>
        }
      </table>
    </table>
  `,
})
export class AvatarGroup {
  readonly caption = input('5 teammates commented on Q3 roadmap');
  readonly members = input<GroupMember[]>([
    { initials: 'MC', color: '#4f46e5' },
    { initials: 'JR', color: '#0891b2' },
    { initials: 'AO', color: '#db2777' },
    { initials: 'TK', color: '#ea580c' },
  ]);
  readonly more = input(1);

  protected circle(color: string): string {
    return (
      'display:inline-block;width:36px;height:36px;line-height:36px;border-radius:18px;text-align:center;' +
      `border:2px solid #ffffff;background-color:${color};color:#ffffff;font-family:${FONT};font-size:13px;font-weight:700`
    );
  }

  protected readonly moreStyle =
    'display:inline-block;width:36px;height:36px;line-height:36px;border-radius:18px;text-align:center;' +
    `border:2px solid #ffffff;background-color:#e5e7eb;color:#374151;font-family:${FONT};font-size:12px;font-weight:600`;

  protected readonly s = {
    section: { padding: '20px 24px' },
    caption: { margin: '0 0 12px', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', color: '#374151' },
    cell: { paddingRight: '4px' },
  };
}
