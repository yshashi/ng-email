import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface Step {
  title: string;
  description: string;
}

/** Numbered steps (onboarding, setup instructions). Numbers are table cells, not <ol>, so they align everywhere. */
@Component({
  selector: 'list-steps',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <h2 ngeHeading [ngeStyle]="s.heading">{{ heading() }}</h2>
      @for (step of steps(); track step.title; let i = $index) {
        <table ngeRow>
          <td ngeColumn [ngeStyle]="s.numberCell"><span [attr.style]="s.number">{{ i + 1 }}</span></td>
          <td ngeColumn [ngeStyle]="s.textCell">
            <p ngeText [ngeStyle]="s.title">{{ step.title }}</p>
            <p ngeText [ngeStyle]="s.body">{{ step.description }}</p>
          </td>
        </table>
      }
    </table>
  `,
})
export class ListSteps {
  readonly heading = input('Get started in three steps');
  readonly steps = input<Step[]>([
    { title: 'Connect your data', description: 'Link a database or upload a CSV. It takes about two minutes.' },
    { title: 'Build your first dashboard', description: 'Pick a template or start from a blank canvas.' },
    { title: 'Invite your team', description: 'Share a link or add teammates by email.' },
  ]);

  protected readonly s = {
    section: { padding: '28px 24px' },
    heading: { margin: '0 0 18px', fontFamily: FONT, fontSize: '20px', lineHeight: '28px', fontWeight: 700, color: '#111827' },
    numberCell: { width: '40px', verticalAlign: 'top' },
    number:
      'display:inline-block;width:28px;height:28px;line-height:28px;border-radius:14px;text-align:center;' +
      `background-color:#4f46e5;color:#ffffff;font-family:${FONT};font-size:13px;font-weight:700`,
    textCell: { verticalAlign: 'top', paddingBottom: '16px' },
    title: { margin: '2px 0 2px', fontFamily: FONT, fontSize: '15px', lineHeight: '22px', fontWeight: 600, color: '#111827' },
    body: { margin: 0, fontFamily: FONT, fontSize: '14px', lineHeight: '22px', color: '#6b7280' },
  };
}
