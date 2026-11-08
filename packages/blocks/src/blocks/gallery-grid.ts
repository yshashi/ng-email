import { Component, computed, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface GalleryImage {
  src: string;
  alt: string;
  href: string;
}

const BASE = 'https://yshashi.github.io/ng-email/static/';

/** Heading plus a 2×2 grid of linked images. Each image keeps its alt text for image-blocking clients. */
@Component({
  selector: 'gallery-grid',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <h2 ngeHeading [ngeStyle]="s.heading">{{ heading() }}</h2>
      @for (row of rows(); track $index) {
        <table ngeRow>
          @for (image of row; track image.src) {
            <td ngeColumn [ngeStyle]="s.cell">
              <a [attr.href]="image.href" target="_blank">
                <img ngeImg [attr.src]="image.src" width="268" height="268" [alt]="image.alt" [ngeStyle]="s.image" />
              </a>
            </td>
          }
        </table>
      }
    </table>
  `,
})
export class GalleryGrid {
  readonly heading = input('New this season');
  readonly images = input<GalleryImage[]>([
    { src: `${BASE}gallery-1.png`, alt: 'Sage linen throw', href: 'https://example.com/shop/1' },
    { src: `${BASE}gallery-2.png`, alt: 'Harbor blue mug', href: 'https://example.com/shop/2' },
    { src: `${BASE}gallery-3.png`, alt: 'Blush desk lamp', href: 'https://example.com/shop/3' },
    { src: `${BASE}gallery-4.png`, alt: 'Lilac storage box', href: 'https://example.com/shop/4' },
  ]);

  protected readonly rows = computed(() => {
    const list = this.images();
    const rows: GalleryImage[][] = [];
    for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
    return rows;
  });

  protected readonly s = {
    section: { padding: '24px 16px' },
    heading: { margin: '0 8px 12px', fontFamily: FONT, fontSize: '20px', lineHeight: '28px', fontWeight: 700, color: '#111827' },
    cell: { width: '50%', padding: '8px' },
    image: { width: '100%', maxWidth: '268px', height: 'auto', borderRadius: '10px' },
  };
}
