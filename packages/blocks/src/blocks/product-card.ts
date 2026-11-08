import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Product image beside name, short description, price and a buy button. Replace the image URL with yours. */
@Component({
  selector: 'product-card',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <table ngeRow>
        <td ngeColumn [ngeStyle]="s.imageCell">
          <img ngeImg [attr.src]="imageUrl()" width="260" height="195" [alt]="name()" [ngeStyle]="s.image" />
        </td>
        <td ngeColumn [ngeStyle]="s.textCell">
          <p ngeText [ngeStyle]="s.tag">{{ tag() }}</p>
          <p ngeText [ngeStyle]="s.name">{{ name() }}</p>
          <p ngeText [ngeStyle]="s.description">{{ description() }}</p>
          <p ngeText [ngeStyle]="s.price">{{ price() }}</p>
          <a ngeButton [href]="url()" [ngeStyle]="s.button">Shop now</a>
        </td>
      </table>
    </table>
  `,
})
export class ProductCard {
  readonly tag = input('Back in stock');
  readonly name = input('Ceramic Pour-Over Set');
  readonly description = input('Hand-glazed dripper and carafe. Makes two cups in four minutes.');
  readonly price = input('$48');
  readonly url = input('https://example.com/shop/pour-over');
  readonly imageUrl = input('https://yshashi.github.io/ng-email/static/product.png');

  protected readonly s = {
    section: { padding: '24px' },
    imageCell: { width: '50%', verticalAlign: 'middle', paddingRight: '20px' },
    image: { width: '100%', maxWidth: '260px', height: 'auto', borderRadius: '10px' },
    textCell: { width: '50%', verticalAlign: 'middle' },
    tag: { margin: '0 0 6px', fontFamily: FONT, fontSize: '12px', lineHeight: '16px', fontWeight: 700, color: '#059669' },
    name: { margin: '0 0 6px', fontFamily: FONT, fontSize: '18px', lineHeight: '24px', fontWeight: 700, color: '#111827' },
    description: { margin: '0 0 12px', fontFamily: FONT, fontSize: '14px', lineHeight: '21px', color: '#6b7280' },
    price: { margin: '0 0 16px', fontFamily: FONT, fontSize: '20px', lineHeight: '26px', fontWeight: 700, color: '#111827' },
    button: {
      backgroundColor: '#111827',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '14px',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '10px 18px',
    },
  };
}
