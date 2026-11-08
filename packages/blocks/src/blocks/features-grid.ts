import { Component, computed, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface GridFeature {
  label: string;
  title: string;
  description: string;
}

/** Two-column grid of features. Rows are built in code so any even/odd count works. */
@Component({
  selector: 'features-grid',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      @for (row of rows(); track $index) {
        <table ngeRow>
          @for (feature of row; track feature.title) {
            <td ngeColumn [ngeStyle]="s.cell">
              <p ngeText [ngeStyle]="s.label">{{ feature.label }}</p>
              <p ngeText [ngeStyle]="s.title">{{ feature.title }}</p>
              <p ngeText [ngeStyle]="s.body">{{ feature.description }}</p>
            </td>
          }
          @if (row.length === 1) {<td ngeColumn [ngeStyle]="s.cell"></td>}
        </table>
      }
    </table>
  `,
})
export class FeaturesGrid {
  readonly features = input<GridFeature[]>([
    { label: '01', title: 'Live dashboards', description: 'Charts refresh the moment new data lands.' },
    { label: '02', title: 'Shared views', description: 'Send a link; teammates see exactly what you see.' },
    { label: '03', title: 'Alerts', description: 'Get an email when a metric crosses a threshold.' },
    { label: '04', title: 'Exports', description: 'Download any table as CSV or schedule it weekly.' },
  ]);

  protected readonly rows = computed(() => {
    const list = this.features();
    const rows: GridFeature[][] = [];
    for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
    return rows;
  });

  protected readonly s = {
    section: { padding: '24px 16px' },
    cell: { width: '50%', verticalAlign: 'top', padding: '8px 8px 16px' },
    label: { margin: '0 0 6px', fontFamily: FONT, fontSize: '12px', lineHeight: '16px', fontWeight: 700, color: '#4f46e5' },
    title: { margin: '0 0 4px', fontFamily: FONT, fontSize: '16px', lineHeight: '24px', fontWeight: 600, color: '#111827' },
    body: { margin: 0, fontFamily: FONT, fontSize: '14px', lineHeight: '22px', color: '#6b7280' },
  };
}
