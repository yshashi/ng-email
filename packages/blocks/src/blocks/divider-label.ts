import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** A horizontal rule with a label in the middle, built from table cells (no flexbox in email). */
@Component({
  selector: 'divider-label',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <table ngeRow>
        <td ngeColumn [ngeStyle]="s.side"><hr ngeHr [ngeStyle]="s.rule" /></td>
        <td ngeColumn [ngeStyle]="s.label">{{ label() }}</td>
        <td ngeColumn [ngeStyle]="s.side"><hr ngeHr [ngeStyle]="s.rule" /></td>
      </table>
    </table>
  `,
})
export class DividerLabel {
  readonly label = input('or');

  protected readonly s = {
    section: { padding: '8px 24px' },
    side: { width: '45%', verticalAlign: 'middle' },
    rule: { margin: 0, borderTop: '1px solid #e5e7eb' },
    label: {
      width: '10%',
      padding: '0 12px',
      textAlign: 'center',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      fontFamily: FONT,
      fontSize: '13px',
      lineHeight: '18px',
      color: '#9ca3af',
    },
  };
}
