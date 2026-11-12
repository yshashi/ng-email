import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import type { SiteItem } from '../registry.types';
import { CopyButton } from './copy-button';
import { EmailFrame, type FrameWidth } from './email-frame';

type View = 'preview' | 'source' | 'html' | 'text';

const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'preview', label: 'Preview' },
  { id: 'source', label: 'Angular' },
  { id: 'html', label: 'HTML' },
  { id: 'text', label: 'Plain text' },
];

@Component({
  selector: 'site-block-viewer',
  imports: [CopyButton, EmailFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="viewer" [attr.id]="item().name" [attr.aria-labelledby]="item().name + '-title'">
      @if (showHeader()) {
        <header class="viewer__head">
          <div>
            <h2 class="viewer__title" [id]="item().name + '-title'">{{ item().title }}</h2>
            <p class="viewer__desc">{{ item().description }}</p>
          </div>
          <div class="cmd">
            <code>{{ addCommand() }}</code>
            <site-copy [text]="addCommand()" [ariaLabel]="'Copy install command for ' + item().title" />
          </div>
        </header>
      } @else {
        <span class="visually-hidden" [id]="item().name + '-title'">{{ item().title }}</span>
      }

      <div class="viewer__bar">
        <div class="seg" role="group" aria-label="View">
          @for (v of views; track v.id) {
            <button type="button" [attr.aria-pressed]="view() === v.id" (click)="view.set(v.id)">{{ v.label }}</button>
          }
        </div>
        @if (view() === 'preview') {
          <div class="seg" role="group" aria-label="Preview width">
            <button type="button" [attr.aria-pressed]="width() === 'desktop'" (click)="width.set('desktop')">Desktop</button>
            <button type="button" [attr.aria-pressed]="width() === 'mobile'" (click)="width.set('mobile')">Mobile</button>
          </div>
          <button
            type="button"
            class="xray-toggle"
            [attr.aria-pressed]="xray()"
            (click)="xray.set(!xray())"
            title="Outline the tables and cells this email is built from"
          >X-ray</button>
        }
        <span class="viewer__spacer"></span>
        <span class="viewer__meta">{{ sizeLabel() }} HTML</span>
        @switch (view()) {
          @case ('source') {<site-copy [text]="item().source" label="Copy code" />}
          @case ('html') {<site-copy [text]="item().htmlOriginal" label="Copy HTML" />}
          @case ('text') {<site-copy [text]="item().text" label="Copy text" />}
        }
      </div>

      <div class="viewer__stage" [class.viewer__stage--code]="view() !== 'preview'">
        @switch (view()) {
          @case ('preview') {
            <site-email-frame
              [html]="item().html"
              [xray]="xray()"
              [width]="width()"
              [title]="item().title + ' preview'"
              [minHeight]="item().kind === 'template' ? 560 : 200"
            />
          }
          @case ('source') {
            <div class="code-block" [innerHTML]="sourceHtml()"></div>
            <p class="viewer__file">{{ item().fileName }} · uses <code>&#64;ng-email/components</code></p>
          }
          @case ('html') {
            <div class="code-block" [innerHTML]="htmlHtml()"></div>
            <p class="viewer__file">Formatted for reading. "Copy HTML" copies the exact output.</p>
          }
          @case ('text') {
            <pre class="code-block viewer__text">{{ item().text }}</pre>
          }
        }
      </div>
    </article>
  `,
  styles: `
    .viewer {
      border: 1px solid var(--line);
      border-radius: var(--radius-l);
      background: var(--surface);
      overflow: hidden;
      scroll-margin-top: 80px;
    }
    .viewer__head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px 24px;
      padding: 20px 20px 16px;
    }
    .viewer__title {
      font-size: 20px;
    }
    .viewer__desc {
      margin-top: 4px;
      color: var(--muted);
      font-size: 14.5px;
    }
    .viewer__bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-top: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
      background: var(--paper);
    }
    .viewer__spacer {
      flex: 1;
    }
    .viewer__meta {
      color: var(--muted);
      font: 12px/1 var(--font-mono);
    }
    .viewer__stage {
      padding: 28px 16px;
      background: var(--stage);
    }
    .viewer__stage--code {
      padding: 16px;
      background: var(--paper);
    }
    .viewer__stage--code .code-block {
      max-height: 560px;
    }
    .viewer__file {
      margin-top: 10px;
      color: var(--muted);
      font-size: 12.5px;
    }
    .viewer__text {
      padding: 16px 18px;
      white-space: pre-wrap;
      font-size: 13px;
    }
    @media (max-width: 640px) {
      .viewer__head,
      .viewer__bar {
        padding-left: 14px;
        padding-right: 14px;
      }
      .viewer__meta {
        display: none;
      }
    }
  `,
})
export class BlockViewer {
  readonly item = input.required<SiteItem>();
  readonly showHeader = input(true);

  protected readonly views = VIEWS;
  protected readonly view = signal<View>('preview');
  protected readonly width = signal<FrameWidth>('desktop');
  protected readonly xray = signal(false);

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly addCommand = computed(() => `npx ng-email add ${this.item().name}`);
  protected readonly sizeLabel = computed(() => `${(this.item().htmlBytes / 1024).toFixed(1)} kB`);
  // Shiki output generated at build time from our own sources.
  protected readonly sourceHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.item().sourceHighlighted));
  protected readonly htmlHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.item().htmlHighlighted));
}
