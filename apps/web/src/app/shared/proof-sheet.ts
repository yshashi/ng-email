import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

import { EmailFrame } from './email-frame';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Marks {
  container: Box;
  rows: Box;
  button: Box;
}

const NOTES = [
  {
    title: 'A 600px container table',
    text: 'Centred with align and max-width, so it keeps its width in Outlook and shrinks on phones.',
  },
  {
    title: 'Rows are nested tables',
    text: 'Email clients lay out tables reliably. Flexbox and grid are dropped by Gmail and Outlook.',
  },
  {
    title: 'A button Outlook can pad',
    text: 'Outlook ignores padding on links, so conditional comments add spacing only Outlook reads.',
  },
];

/**
 * The home page's proof: the real rendered welcome email with proofreader's
 * marks. Every mark is measured from the email's own document, so it lands on
 * the table or button it names, at any width.
 */
@Component({
  selector: 'site-proof-sheet',
  imports: [EmailFrame],
  host: { class: 'block min-w-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="overflow-hidden rounded-lg border border-line bg-card shadow-[0_24px_48px_-24px_rgb(0_0_0/0.18)]">
      <figcaption class="flex h-12 items-center justify-between gap-4 border-b border-line pr-2 pl-4">
        <span class="truncate text-md text-ink">
          Welcome email <span class="hidden text-muted sm:inline">rendered by ng-email</span>
        </span>
        <button
          type="button"
          class="inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm font-medium whitespace-nowrap text-ink-2 transition-colors hover:bg-raised hover:text-ink"
          [attr.aria-pressed]="showMarks()"
          (click)="showMarks.set(!showMarks())"
        >
          <span
            class="flex h-4 w-7 items-center rounded-full p-0.5 transition-colors"
            [class.bg-proof]="showMarks()"
            [class.bg-line-strong]="!showMarks()"
            aria-hidden="true"
          >
            <span
              class="size-3 rounded-full bg-card transition-transform"
              [class.translate-x-3]="showMarks()"
            ></span>
          </span>
          Proof marks
        </button>
      </figcaption>

      <div class="bg-raised px-3 py-6 sm:px-6">
        <div class="relative">
          <site-email-frame
            [html]="html()"
            title="Welcome email, as rendered by ng-email"
            [minHeight]="640"
            [eager]="true"
            (measured)="measure($event)"
          />
          @if (marks(); as m) {
            <!-- The marks sit on the email's own light paper, so they keep the light-theme pink in dark mode. -->
            <div
              class="pointer-events-none absolute inset-0 animate-settle transition-opacity [--on-proof:#ffffff] [--proof:oklch(59.91%_0.239_8.14)]"
              [class.opacity-0]="!showMarks()"
              aria-hidden="true"
            >
              <!-- 1: the container's width, as a dimension line above it -->
              <div class="absolute h-3" [style.top.px]="m.container.top - 20" [style.left.px]="m.container.left" [style.width.px]="m.container.width">
                <span class="absolute inset-x-0 top-1/2 h-px bg-proof"></span>
                <span class="absolute top-0 left-0 h-3 w-px bg-proof"></span>
                <span class="absolute top-0 right-0 h-3 w-px bg-proof"></span>
                <span class="absolute top-1/2 left-1/2 flex -translate-1/2 items-center gap-1.5 bg-[#f3f4f6] px-2 text-xs font-medium text-proof">
                  <span class="flex size-4 items-center justify-center rounded-full bg-proof text-[10px] text-on-proof">1</span>
                  max 600px
                </span>
              </div>
              <span
                class="absolute rounded-xl border border-proof"
                [style.top.px]="m.container.top"
                [style.left.px]="m.container.left"
                [style.width.px]="m.container.width"
                [style.height.px]="m.container.height"
              ></span>

              <!-- 2: the step rows -->
              <span
                class="absolute rounded-sm border border-dashed border-proof"
                [style.top.px]="m.rows.top - 4"
                [style.left.px]="m.rows.left - 6"
                [style.width.px]="m.rows.width + 12"
                [style.height.px]="m.rows.height"
              >
                <span class="absolute -top-2.5 -right-2.5 flex size-5 items-center justify-center rounded-full bg-proof text-xs font-medium text-on-proof">2</span>
              </span>

              <!-- 3: the button -->
              <span
                class="absolute rounded-lg border border-proof"
                [style.top.px]="m.button.top - 4"
                [style.left.px]="m.button.left - 4"
                [style.width.px]="m.button.width + 8"
                [style.height.px]="m.button.height + 8"
              >
                <span class="absolute top-1/2 -right-7 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-proof text-xs font-medium text-on-proof">3</span>
              </span>
            </div>
          }
        </div>
      </div>

      <ol class="divide-y divide-line border-t border-line">
        @for (note of notes; track note.title; let i = $index) {
          <li class="flex gap-3 px-4 py-3">
            <span
              class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors"
              [class.bg-proof]="showMarks()"
              [class.text-on-proof]="showMarks()"
              [class.bg-raised]="!showMarks()"
              [class.text-ink-2]="!showMarks()"
            >{{ i + 1 }}</span>
            <p class="text-md text-ink-2"><span class="font-medium text-ink">{{ note.title }}.</span> {{ note.text }}</p>
          </li>
        }
      </ol>
    </figure>
  `,
})
export class ProofSheet {
  readonly html = input.required<string>();

  protected readonly notes = NOTES;
  protected readonly showMarks = signal(true);
  protected readonly marks = signal<Marks | null>(null);

  protected measure(doc: Document): void {
    const container = doc.querySelector<HTMLElement>('table[style*="max-width"]');
    const firstRow = container?.querySelector<HTMLElement>('td[style*="width:36px"]')?.closest('table');
    const button = container?.querySelector<HTMLElement>('a[style*="background-color"]');
    if (!container || !firstRow || !button) return;

    // The step rows are sibling tables: measure from the first to the last.
    let lastRow: Element = firstRow;
    while (lastRow.nextElementSibling?.matches('table') && lastRow.nextElementSibling.querySelector('td[style*="width:36px"]')) {
      lastRow = lastRow.nextElementSibling;
    }
    const rowsTop = firstRow.getBoundingClientRect();
    const rowsBottom = lastRow.getBoundingClientRect();

    this.marks.set({
      container: box(container.getBoundingClientRect()),
      rows: { top: rowsTop.top, left: rowsTop.left, width: rowsTop.width, height: rowsBottom.bottom - rowsTop.top },
      button: box(button.getBoundingClientRect()),
    });
  }
}

// The frame is as tall as its document, so it never scrolls: rects from inside
// it are already offsets from the frame's top left corner.
function box(rect: DOMRect): Box {
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}
