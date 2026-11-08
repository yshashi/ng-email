import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface Feature {
  title: string;
  description: string;
}

/** Heading plus a checklist of features, each with a short description. */
@Component({
  selector: 'features-checklist',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <h2 ngeHeading [ngeStyle]="s.heading">{{ heading() }}</h2>
      @for (feature of features(); track feature.title) {
        <table ngeRow [ngeStyle]="s.row">
          <td ngeColumn [ngeStyle]="s.iconCell"><span [attr.style]="s.check">&#10003;</span></td>
          <td ngeColumn [ngeStyle]="s.textCell">
            <p ngeText [ngeStyle]="s.title">{{ feature.title }}</p>
            <p ngeText [ngeStyle]="s.body">{{ feature.description }}</p>
          </td>
        </table>
      }
    </table>
  `,
})
export class FeaturesChecklist {
  readonly heading = input('Everything in the Team plan');
  readonly features = input<Feature[]>([
    { title: 'Unlimited projects', description: 'Create as many workspaces as your team needs.' },
    { title: 'Single sign-on', description: 'Connect Okta, Google Workspace or any SAML provider.' },
    { title: 'Audit log', description: 'See who changed what, with 12 months of history.' },
  ]);

  protected readonly s = {
    section: { padding: '28px 24px' },
    heading: { margin: '0 0 16px', fontFamily: FONT, fontSize: '20px', lineHeight: '28px', fontWeight: 700, color: '#111827' },
    row: { marginBottom: '12px' },
    iconCell: { width: '32px', verticalAlign: 'top' },
    check:
      'display:inline-block;width:22px;height:22px;line-height:22px;border-radius:11px;text-align:center;' +
      `background-color:#e0e7ff;color:#4f46e5;font-family:${FONT};font-size:12px;font-weight:700`,
    textCell: { verticalAlign: 'top', paddingBottom: '12px' },
    title: { margin: 0, fontFamily: FONT, fontSize: '15px', lineHeight: '22px', fontWeight: 600, color: '#111827' },
    body: { margin: 0, fontFamily: FONT, fontSize: '14px', lineHeight: '22px', color: '#6b7280' },
  };
}
