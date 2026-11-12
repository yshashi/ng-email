import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * The X-ray: outlines every <table> and <td>, i.e. the structure that HTML
 * email is really made of (and that ng-email components generate for you).
 */
const XRAY_STYLE =
  '<style data-xray>' +
  'table{outline:2px dashed #c2367a!important;outline-offset:-2px}' +
  'td{outline:1px dashed rgba(194,54,122,.75)!important;outline-offset:-1px;background-image:linear-gradient(rgba(194,54,122,.035),rgba(194,54,122,.035))}' +
  '</style>';

export type FrameWidth = 'desktop' | 'mobile';

@Component({
  selector: 'site-email-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iframe
      #frame
      [title]="title()"
      [attr.srcdoc]="srcdoc()"
      [style.height.px]="height() ?? minHeight()"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      loading="lazy"
      (load)="measure()"
    ></iframe>
  `,
  styles: `
    :host {
      display: block;
      margin: 0 auto;
      width: 100%;
      transition: max-width 0.25s ease;
    }
    :host([data-width='mobile']) {
      max-width: 375px;
    }
    iframe {
      display: block;
      width: 100%;
      border: 0;
      background: transparent;
      color-scheme: light;
    }
  `,
  host: { '[attr.data-width]': 'width()' },
})
export class EmailFrame {
  readonly html = input.required<string>();
  readonly title = input('Email preview');
  readonly xray = input(false);
  readonly width = input<FrameWidth>('desktop');
  /** Initial height before the frame is measured (also used during prerendering). */
  readonly minHeight = input(240);

  private readonly sanitizer = inject(DomSanitizer);
  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');
  protected readonly height = signal<number | null>(null);

  // Our own generated HTML (no scripts; the sandbox does not allow any either).
  protected readonly srcdoc = computed(() => {
    const html = this.xray() ? this.html().replace('</head>', `${XRAY_STYLE}</head>`) : this.html();
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  constructor() {
    afterNextRender(() => {
      // After hydration the frame may have loaded before (load) was listening.
      if (this.frame().nativeElement.contentDocument?.readyState === 'complete') this.measure();
    });
    effect(() => {
      this.width();
      // Width changes reflow the email: measure again on the next frame.
      if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => this.measure());
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
  }
}
