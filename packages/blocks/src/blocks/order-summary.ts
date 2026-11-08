import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface OrderLine {
  name: string;
  detail: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Line items with subtotal, shipping, tax and total. Amounts are formatted
 * with Angular's CurrencyPipe. The plain-text part renders it as rows too.
 */
@Component({
  selector: 'order-summary',
  imports: [EMAIL_COMPONENTS, CurrencyPipe],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <p ngeText [ngeStyle]="s.heading">Order {{ orderNumber() }}</p>
      @for (line of lines(); track line.name) {
        <table ngeRow [ngeStyle]="s.line">
          <td ngeColumn [ngeStyle]="s.itemCell">
            <p ngeText [ngeStyle]="s.name">{{ line.name }}</p>
            <p ngeText [ngeStyle]="s.detail">{{ line.detail }} &middot; Qty {{ line.quantity }}</p>
          </td>
          <td ngeColumn [ngeStyle]="s.amountCell">{{ line.unitPrice * line.quantity | currency: currency() }}</td>
        </table>
      }
      <table ngeRow [ngeStyle]="s.totals">
        <td ngeColumn [ngeStyle]="s.totalLabel">Subtotal</td>
        <td ngeColumn [ngeStyle]="s.totalValue">{{ subtotal() | currency: currency() }}</td>
      </table>
      <table ngeRow>
        <td ngeColumn [ngeStyle]="s.totalLabel">Shipping</td>
        <td ngeColumn [ngeStyle]="s.totalValue">{{ shipping() | currency: currency() }}</td>
      </table>
      <table ngeRow>
        <td ngeColumn [ngeStyle]="s.totalLabel">Tax</td>
        <td ngeColumn [ngeStyle]="s.totalValue">{{ tax() | currency: currency() }}</td>
      </table>
      <table ngeRow [ngeStyle]="s.grand">
        <td ngeColumn [ngeStyle]="s.grandLabel">Total</td>
        <td ngeColumn [ngeStyle]="s.grandValue">{{ total() | currency: currency() }}</td>
      </table>
    </table>
  `,
})
export class OrderSummary {
  readonly orderNumber = input('#10482');
  readonly currency = input('USD');
  readonly lines = input<OrderLine[]>([
    { name: 'Field Notebook', detail: 'Dot grid, A5', quantity: 2, unitPrice: 14 },
    { name: 'Everyday Pen', detail: 'Black ink', quantity: 1, unitPrice: 6.5 },
  ]);
  readonly shipping = input(4.95);
  readonly taxRate = input(0.08);

  protected readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );
  protected readonly tax = computed(() => Math.round(this.subtotal() * this.taxRate() * 100) / 100);
  protected readonly total = computed(() => this.subtotal() + this.shipping() + this.tax());

  protected readonly s = {
    section: { padding: '24px' },
    heading: { margin: '0 0 12px', fontFamily: FONT, fontSize: '16px', lineHeight: '24px', fontWeight: 700, color: '#111827' },
    line: { borderBottom: '1px solid #f3f4f6' },
    itemCell: { padding: '10px 0', verticalAlign: 'top' },
    name: { margin: 0, fontFamily: FONT, fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: '#111827' },
    detail: { margin: 0, fontFamily: FONT, fontSize: '13px', lineHeight: '18px', color: '#6b7280' },
    amountCell: {
      padding: '10px 0',
      verticalAlign: 'top',
      textAlign: 'right',
      fontFamily: FONT,
      fontSize: '14px',
      lineHeight: '20px',
      color: '#111827',
    },
    totals: { marginTop: '8px' },
    totalLabel: { padding: '4px 0', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', color: '#6b7280' },
    totalValue: { padding: '4px 0', textAlign: 'right', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', color: '#374151' },
    grand: { borderTop: '1px solid #e5e7eb', marginTop: '6px' },
    grandLabel: { paddingTop: '10px', fontFamily: FONT, fontSize: '15px', lineHeight: '22px', fontWeight: 700, color: '#111827' },
    grandValue: {
      paddingTop: '10px',
      textAlign: 'right',
      fontFamily: FONT,
      fontSize: '15px',
      lineHeight: '22px',
      fontWeight: 700,
      color: '#111827',
    },
  };
}
