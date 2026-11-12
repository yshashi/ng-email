import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import type { SiteItem } from '../registry.types';
import { Command } from './command';
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
  imports: [Command, CopyButton, EmailFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="scroll-mt-20" [attr.id]="item().name" [attr.aria-labelledby]="item().name + '-title'">
      @if (showHeader()) {
        <header class="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div class="min-w-0">
            <h2 class="text-2xl tracking-[-0.01em]" [id]="item().name + '-title'">{{ item().title }}</h2>
            <p class="mt-1 text-md text-ink-2">{{ item().description }}</p>
          </div>
          <site-command class="w-full sm:w-auto" [command]="addCommand()" [label]="'Copy the add command for ' + item().title" />
        </header>
      } @else {
        <span class="sr-only" [id]="item().name + '-title'">{{ item().title }}</span>
      }

      <div class="overflow-hidden rounded-lg border border-line bg-card">
        <div class="flex flex-wrap items-center gap-2 border-b border-line px-2 py-2 sm:px-3">
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
              class="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors hover:text-ink"
              [class]="xray() ? 'border-accent bg-raised font-medium text-accent' : 'border-line-strong text-ink-2'"
              [attr.aria-pressed]="xray()"
              (click)="xray.set(!xray())"
              title="Outline the tables and cells this email is built from"
            >
              <span
                class="size-3 rounded-[2px] border border-dashed"
                [class.border-proof]="xray()"
                [class.border-muted]="!xray()"
                aria-hidden="true"
              ></span>
              Show tables
            </button>
          }
          <span class="flex-1"></span>
          <span class="hidden px-1 text-sm text-muted tabular-nums sm:inline">{{ sizeLabel() }} of HTML</span>
          @switch (view()) {
            @case ('source') {<site-copy [text]="item().source" label="Copy code" />}
            @case ('html') {<site-copy [text]="item().htmlOriginal" label="Copy HTML" />}
            @case ('text') {<site-copy [text]="item().text" label="Copy text" />}
          }
        </div>

        @switch (view()) {
          @case ('preview') {
            <div class="bg-raised px-3 py-6 sm:px-8 sm:py-10">
              <site-email-frame
                [html]="item().html"
                [xray]="xray()"
                [width]="width()"
                [title]="item().title + ' preview'"
                [minHeight]="item().kind === 'template' ? 560 : 200"
              />
            </div>
          }
          @case ('source') {
            <div class="code-block max-h-[560px]" [innerHTML]="sourceHtml()"></div>
            <p class="border-t border-line px-4 py-2.5 text-sm text-muted">
              {{ item().fileName }}, uses <code class="code-inline">&#64;ng-email/components</code>
            </p>
          }
          @case ('html') {
            <div class="code-block max-h-[560px]" [innerHTML]="htmlHtml()"></div>
            <p class="border-t border-line px-4 py-2.5 text-sm text-muted">
              Formatted for reading. Copy HTML copies the exact output.
            </p>
          }
          @case ('text') {
            <pre class="max-h-[560px] overflow-auto px-4 py-3.5 font-mono text-sm leading-[22px] whitespace-pre-wrap">{{ item().text }}</pre>
          }
        }
      </div>
    </article>
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
