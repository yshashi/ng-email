import { Component, computed, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * One-click rating: each score is a link, so it works in every client
 * (no forms or scripts in email). `baseUrl` gets `?score=N` appended.
 */
@Component({
  selector: 'feedback-rating',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <p ngeText [ngeStyle]="s.question">{{ question() }}</p>
      <table ngeRow width="auto" align="center">
        @for (score of scores(); track score) {
          <td ngeColumn [ngeStyle]="s.cell">
            <a ngeLink [href]="baseUrl() + '?score=' + score" [ngeStyle]="s.score">{{ score }}</a>
          </td>
        }
      </table>
      <table ngeRow [ngeStyle]="s.legendRow">
        <td ngeColumn [ngeStyle]="s.legendLeft">{{ lowLabel() }}</td>
        <td ngeColumn [ngeStyle]="s.legendRight">{{ highLabel() }}</td>
      </table>
    </table>
  `,
})
export class FeedbackRating {
  readonly question = input('How was your support experience?');
  readonly baseUrl = input('https://example.com/feedback/ticket-2291');
  readonly max = input(5);
  readonly lowLabel = input('Not great');
  readonly highLabel = input('Excellent');

  protected readonly scores = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));

  protected readonly s = {
    section: { padding: '28px 24px', textAlign: 'center' },
    question: { margin: '0 0 16px', fontFamily: FONT, fontSize: '16px', lineHeight: '24px', fontWeight: 600, color: '#111827' },
    cell: { padding: '0 4px' },
    score: {
      display: 'inline-block',
      width: '44px',
      height: '44px',
      lineHeight: '44px',
      borderRadius: '10px',
      border: '1px solid #d1d5db',
      textAlign: 'center',
      fontFamily: FONT,
      fontSize: '16px',
      fontWeight: 600,
      color: '#374151',
      textDecorationLine: 'none',
    },
    legendRow: { maxWidth: '264px', marginTop: '8px' },
    legendLeft: { textAlign: 'left', fontFamily: FONT, fontSize: '12px', lineHeight: '16px', color: '#9ca3af' },
    legendRight: { textAlign: 'right', fontFamily: FONT, fontSize: '12px', lineHeight: '16px', color: '#9ca3af' },
  };
}
