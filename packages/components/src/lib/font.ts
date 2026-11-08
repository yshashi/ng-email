import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewEncapsulation,
  inject,
  input,
} from '@angular/core';

export type FallbackFont =
  | 'Arial'
  | 'Helvetica'
  | 'Verdana'
  | 'Georgia'
  | 'Times New Roman'
  | 'serif'
  | 'sans-serif'
  | 'monospace'
  | 'cursive'
  | 'fantasy';

export type FontFormat = 'woff' | 'woff2' | 'truetype' | 'opentype' | 'embedded-opentype' | 'svg';

export interface WebFont {
  url: string;
  format: FontFormat;
}

/** Removes characters that could end a CSS string or block. */
function cssSafe(value: string): string {
  return value.replace(/['"\\<>{};\n\r]/g, '');
}

/** Builds the `@font-face` and global font-family rules. Exported for tests. */
export function buildFontCss(options: {
  fontFamily: string;
  fallbackFontFamily: FallbackFont | readonly FallbackFont[];
  webFont?: WebFont;
  fontStyle: string;
  fontWeight: string | number;
}): string {
  const family = cssSafe(options.fontFamily);
  const fallbacks = (
    Array.isArray(options.fallbackFontFamily) ? options.fallbackFontFamily : [options.fallbackFontFamily]
  ) as readonly FallbackFont[];
  const src = options.webFont
    ? `src:url('${cssSafe(options.webFont.url).replace(/\(/g, '%28').replace(/\)/g, '%29')}') format('${options.webFont.format}');`
    : '';
  return (
    `@font-face{font-family:'${family}';font-style:${cssSafe(options.fontStyle)};` +
    `font-weight:${cssSafe(String(options.fontWeight))};mso-font-alt:'${fallbacks[0] ?? 'Arial'}';${src}}` +
    `*{font-family:'${family}', ${fallbacks.join(', ')};}`
  );
}

/**
 * Web font with an Outlook fallback (`mso-font-alt`). Place it inside `<head ngeHead>`.
 *
 * Angular strips `<style>` from templates, so the element is created with
 * Renderer2. The `<nge-font>` host is unwrapped by the renderer, leaving the `<style>`.
 */
@Component({
  selector: 'nge-font',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class EmailFont implements OnInit {
  readonly fontFamily = input.required<string>();
  readonly fallbackFontFamily = input.required<FallbackFont | readonly FallbackFont[]>();
  readonly webFont = input<WebFont>();
  readonly fontStyle = input<'normal' | 'italic' | 'oblique'>('normal');
  readonly fontWeight = input<string | number>(400);

  private readonly renderer = inject(Renderer2);
  private readonly host = inject<ElementRef<Element>>(ElementRef);

  ngOnInit(): void {
    const style = this.renderer.createElement('style') as Element;
    const css = buildFontCss({
      fontFamily: this.fontFamily(),
      fallbackFontFamily: this.fallbackFontFamily(),
      webFont: this.webFont(),
      fontStyle: this.fontStyle(),
      fontWeight: this.fontWeight(),
    });
    this.renderer.appendChild(style, this.renderer.createText(css));
    this.renderer.appendChild(this.host.nativeElement, style);
  }
}
