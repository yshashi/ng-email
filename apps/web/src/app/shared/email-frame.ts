import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * "Show tables": outlines every <table> and <td>, the structure HTML email is
 * really made of (and that ng-email components write for you). Drawn in the
 * same pink as every other mark on a preview.
 */
const TABLES_STYLE =
  '<style data-xray>' +
  'table{outline:1px dashed oklch(59.91% 0.239 8.14)!important;outline-offset:-1px}' +
  'td{outline:1px dotted oklch(59.91% 0.239 8.14 / 0.55)!important;outline-offset:-1px}' +
  '</style>';

export type FrameWidth = 'desktop' | 'mobile';

@Component({
  selector: 'site-email-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iframe
      #frame
      class="block w-full border-0 bg-transparent [color-scheme:light]"
      [title]="title()"
      [attr.srcdoc]="srcdoc()"
      [style.height.px]="height() ?? minHeight()"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      [attr.loading]="eager() ? null : 'lazy'"
      (load)="measure()"
    ></iframe>
  `,
  host: {
    class: 'mx-auto block w-full transition-[max-width] duration-300',
    '[style.max-width]': "width() === 'mobile' ? '375px' : '100%'",
  },
})
export class EmailFrame {
  readonly html = input.required<string>();
  readonly title = input('Email preview');
  readonly xray = input(false);
  readonly width = input<FrameWidth>('desktop');
  /** Initial height before the frame is measured (also used during prerendering). */
  readonly minHeight = input(240);
  /** Load right away instead of when scrolled near (the hero). */
  readonly eager = input(false);
  /** The email's document, each time the frame has loaded or been re-measured. */
  readonly measured = output<Document>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');
  protected readonly height = signal<number | null>(null);

  // Our own generated HTML (no scripts; the sandbox does not allow any either).
  protected readonly srcdoc = computed(() => {
    const html = this.xray() ? this.html().replace('</head>', `${TABLES_STYLE}</head>`) : this.html();
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      // After hydration the frame may have loaded before (load) was listening.
      if (this.frame().nativeElement.contentDocument?.readyState === 'complete') this.measure();
      // Emails reflow with the width they get: measure again when it changes.
      let lastWidth = 0;
      const observer = new ResizeObserver(([entry]) => {
        const width = Math.round(entry.contentRect.width);
        if (width !== lastWidth) {
          lastWidth = width;
          this.measure();
        }
      });
      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
    effect(() => {
      this.width();
      // The mobile/desktop switch animates max-width: measure once it has settled.
      if (typeof window !== 'undefined') setTimeout(() => this.measure(), 320);
    });
  }

  protected measure(): void {
    const iframe = this.frame().nativeElement;
    const doc = iframe.contentDocument;
    // Before the srcdoc document loads, the frame holds an empty about:blank:
    // measuring that would collapse the preview.
    if (!doc?.documentElement || doc.URL !== 'about:srcdoc' || doc.readyState !== 'complete') return;
    // Collapse first: scrollHeight never reports less than the current frame height.
    iframe.style.height = '0px';
    const height = Math.max(doc.documentElement.scrollHeight, 80);
    // Write it back directly: if the signal value is unchanged, Angular won't re-apply the binding.
    iframe.style.height = `${height}px`;
    this.height.set(height);
    this.measured.emit(doc);
  }
}
