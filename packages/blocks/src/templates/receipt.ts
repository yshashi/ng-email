import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface ReceiptLine {
  name: string;
  quantity: number;
  unitPrice: number;
}

/** Order confirmation: items, totals, shipping address and a link to track the order. */
@Component({
  selector: 'receipt-email',
  imports: [EMAIL_COMPONENTS, CurrencyPipe],
  template: `
    <html ngeHtml>
      <head ngeHead><title>Your receipt from {{ store() }}</title></head>
      <body ngeBody [ngeStyle]="s.body">
        <nge-preview [text]="'Order ' + orderNumber() + ' confirmed. Total ' + (total() | currency: currency())" />
        <table ngeContainer [ngeStyle]="s.container">
          <p ngeText [ngeStyle]="s.brand">{{ store() }}</p>
          <h1 ngeHeading [ngeStyle]="s.title">Thanks for your order, {{ name() }}</h1>
          <p ngeText [ngeStyle]="s.muted">Order {{ orderNumber() }} &middot; {{ date() }}</p>

          @for (line of lines(); track line.name) {
            <table ngeRow [ngeStyle]="s.line">
              <td ngeColumn [ngeStyle]="s.item">{{ line.name }} &times; {{ line.quantity }}</td>
              <td ngeColumn [ngeStyle]="s.amount">{{ line.unitPrice * line.quantity | currency: currency() }}</td>
            </table>
          }
          <table ngeRow>
            <td ngeColumn [ngeStyle]="s.label">Subtotal</td>
            <td ngeColumn [ngeStyle]="s.value">{{ subtotal() | currency: currency() }}</td>
          </table>
          <table ngeRow>
            <td ngeColumn [ngeStyle]="s.label">Shipping</td>
            <td ngeColumn [ngeStyle]="s.value">{{ shipping() | currency: currency() }}</td>
          </table>
          <table ngeRow [ngeStyle]="s.totalRow">
            <td ngeColumn [ngeStyle]="s.totalLabel">Total paid</td>
            <td ngeColumn [ngeStyle]="s.totalValue">{{ total() | currency: currency() }}</td>
          </table>

          <table ngeSection [ngeStyle]="s.addressBox">
            <p ngeText [ngeStyle]="s.addressTitle">Shipping to</p>
            @for (part of address(); track part) {
              <p ngeText [ngeStyle]="s.addressLine">{{ part }}</p>
            }
          </table>
          <a ngeButton [href]="trackingUrl()" [ngeStyle]="s.button">Track your order</a>
        </table>
        <p ngeText [ngeStyle]="s.footer">
          Need help? <a ngeLink [href]="supportUrl()" [ngeStyle]="s.footerLink">Contact support</a>
        </p>
      </body>
    </html>
  `,
})
export class ReceiptEmail {
  readonly store = input('Acme Goods');
  readonly name = input('Sam');
  readonly orderNumber = input('#10482');
  readonly date = input('March 4, 2026');
  readonly currency = input('USD');
  readonly lines = input<ReceiptLine[]>([
    { name: 'Field Notebook (A5)', quantity: 2, unitPrice: 14 },
    { name: 'Everyday Pen', quantity: 1, unitPrice: 6.5 },
    { name: 'Canvas Pouch', quantity: 1, unitPrice: 22 },
  ]);
  readonly shipping = input(4.95);
  readonly address = input<string[]>(['Sam Rivera', '221 Elm Street, Apt 4', 'Portland, OR 97204']);
  readonly trackingUrl = input('https://example.com/orders/10482');
  readonly supportUrl = input('https://example.com/help');

  protected readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );
  protected readonly total = computed(() => this.subtotal() + this.shipping());

  protected readonly s = {
    body: { backgroundColor: '#f3f4f6', margin: 0, padding: '32px 12px' },
    container: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '36px' },
    brand: { margin: '0 0 24px', fontFamily: FONT, fontSize: '18px', fontWeight: 700, color: '#111827' },
    title: { margin: '0 0 6px', fontFamily: FONT, fontSize: '24px', lineHeight: '32px', fontWeight: 700, color: '#111827' },
    muted: { margin: '0 0 24px', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', color: '#6b7280' },
    line: { borderBottom: '1px solid #f3f4f6' },
    item: { padding: '10px 0', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', color: '#111827' },
    amount: { padding: '10px 0', textAlign: 'right', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', color: '#111827' },
    label: { padding: '6px 0 0', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', color: '#6b7280' },
    value: { padding: '6px 0 0', textAlign: 'right', fontFamily: FONT, fontSize: '14px', lineHeight: '20px', color: '#374151' },
    totalRow: { borderTop: '1px solid #e5e7eb', marginTop: '10px' },
    totalLabel: { paddingTop: '12px', fontFamily: FONT, fontSize: '16px', fontWeight: 700, color: '#111827' },
    totalValue: { paddingTop: '12px', textAlign: 'right', fontFamily: FONT, fontSize: '16px', fontWeight: 700, color: '#111827' },
    addressBox: { margin: '28px 0 24px', padding: '16px 18px', backgroundColor: '#f9fafb', borderRadius: '10px' },
    addressTitle: { margin: '0 0 6px', fontFamily: FONT, fontSize: '13px', fontWeight: 600, color: '#6b7280' },
    addressLine: { margin: 0, fontFamily: FONT, fontSize: '14px', lineHeight: '21px', color: '#111827' },
    button: {
      backgroundColor: '#111827',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '12px 22px',
    },
    footer: { margin: '20px 0 0', textAlign: 'center', fontFamily: FONT, fontSize: '13px', color: '#6b7280' },
    footerLink: { color: '#4f46e5' },
  };
}
