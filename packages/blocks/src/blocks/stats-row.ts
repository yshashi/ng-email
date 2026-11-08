import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface Stat {
  value: string;
  label: string;
  change?: string;
}

/** Three key numbers side by side, e.g. a weekly summary. */
@Component({
  selector: 'stats-row',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <p ngeText [ngeStyle]="s.caption">{{ caption() }}</p>
      <table ngeRow>
        @for (stat of stats(); track stat.label) {
          <td ngeColumn [ngeStyle]="s.cell">
            <p ngeText [ngeStyle]="s.value">{{ stat.value }}</p>
            <p ngeText [ngeStyle]="s.label">{{ stat.label }}</p>
            @if (stat.change) {<p ngeText [ngeStyle]="s.change">{{ stat.change }}</p>}
          </td>
        }
      </table>
    </table>
  `,
})
export class StatsRow {
  readonly caption = input('Your week at a glance');
  readonly stats = input<Stat[]>([
    { value: '1,284', label: 'Visitors', change: '+12% vs last week' },
    { value: '342', label: 'Sign-ups', change: '+8%' },
    { value: '$9.4k', label: 'Revenue', change: '+21%' },
  ]);

  protected readonly s = {
    section: { padding: '24px' },
    caption: { margin: '0 0 12px', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: '#374151' },
    cell: {
      width: '33%',
      padding: '16px',
      verticalAlign: 'top',
      backgroundColor: '#f9fafb',
      border: '4px solid #ffffff',
      borderRadius: '10px',
    },
    value: { margin: 0, fontFamily: FONT, fontSize: '26px', lineHeight: '32px', fontWeight: 700, color: '#111827' },
    label: { margin: '2px 0 0', fontFamily: FONT, fontSize: '13px', lineHeight: '18px', color: '#6b7280' },
    change: { margin: '6px 0 0', fontFamily: FONT, fontSize: '12px', lineHeight: '16px', fontWeight: 600, color: '#059669' },
  };
}
