import { Component, computed, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** A customer quote with an accent rule, initials avatar, name and company. */
@Component({
  selector: 'testimonial-quote',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <table ngeRow>
        <td ngeColumn [ngeStyle]="s.quoteCell">
          <p ngeText [ngeStyle]="s.quote">&ldquo;{{ quote() }}&rdquo;</p>
          <table ngeRow width="auto" align="left">
            <td ngeColumn [ngeStyle]="s.avatar">{{ initials() }}</td>
            <td ngeColumn [ngeStyle]="s.person">
              <p ngeText [ngeStyle]="s.name">{{ name() }}</p>
              <p ngeText [ngeStyle]="s.company">{{ company() }}</p>
            </td>
          </table>
        </td>
      </table>
    </table>
  `,
})
export class TestimonialQuote {
  readonly quote = input(
    'We replaced three internal tools with Acme in a week. Our Monday reporting meeting is now ten minutes long.',
  );
  readonly name = input('Daniel Okafor');
  readonly company = input('VP Operations, Harbor Logistics');

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  protected readonly s = {
    section: { padding: '28px 24px' },
    quoteCell: { borderLeft: '4px solid #4f46e5', paddingLeft: '20px' },
    quote: { margin: '0 0 18px', fontFamily: FONT, fontSize: '18px', lineHeight: '28px', color: '#111827' },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '20px',
      backgroundColor: '#111827',
      color: '#ffffff',
      textAlign: 'center',
      verticalAlign: 'middle',
      fontFamily: FONT,
      fontSize: '14px',
      fontWeight: 700,
    },
    person: { paddingLeft: '12px', verticalAlign: 'middle' },
    name: { margin: 0, fontFamily: FONT, fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: '#111827' },
    company: { margin: 0, fontFamily: FONT, fontSize: '13px', lineHeight: '18px', color: '#6b7280' },
  };
}
