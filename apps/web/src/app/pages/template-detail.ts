import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { templateEntries } from '../registry';
import type { SiteItem } from '../registry.types';
import { BlockViewer } from '../shared/block-viewer';
import { CopyButton } from '../shared/copy-button';

@Component({
  selector: 'site-template-detail',
  imports: [RouterLink, BlockViewer, CopyButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <a routerLink="/templates" class="back">All templates</a>
      <span class="cat">{{ item().category }}</span>
      <h1>{{ item().title }}</h1>
      <p>{{ item().description }}</p>
      <div class="actions">
        <div class="cmd">
          <code>{{ addCommand() }}</code>
          <site-copy [text]="addCommand()" ariaLabel="Copy install command" />
        </div>
        <span class="hint">Then: <code>renderEmailBoth({{ item().className }}, {{ '{' }} inputs: {{ '{' }} … {{ '}' }} {{ '}' }})</code></span>
      </div>
    </header>

    <site-block-viewer [item]="item()" [showHeader]="false" />

    <nav class="others" aria-label="Other templates">
      @for (t of others(); track t.name) {
        <a [routerLink]="['/templates', t.name]">
          <span>{{ t.category }}</span>
          {{ t.title }}
        </a>
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
      width: min(980px, 100% - 32px);
      margin: 0 auto;
    }
    .page-head {
      padding: 40px 0 28px;
    }
    .back {
      display: inline-block;
      margin-bottom: 18px;
      color: var(--muted);
      text-decoration: none;
      font-size: 13px;
    }
    .back::before {
      content: '← ';
    }
    .cat {
      display: block;
      font: 500 12px/1 var(--font-mono);
      color: var(--xray);
    }
    h1 {
      margin-top: 10px;
      font-size: clamp(34px, 4.6vw, 52px);
      font-variation-settings: 'wdth' 88;
    }
    .page-head p {
      margin-top: 8px;
      color: var(--muted);
      font-size: 17px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 18px;
      margin-top: 20px;
    }
    .hint {
      color: var(--muted);
      font-size: 13.5px;
    }
    .hint code {
      font-size: 12.5px;
      color: var(--ink);
    }
    .others {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 10px;
      margin-top: 28px;
    }
    .others a {
      display: grid;
      gap: 4px;
      padding: 12px 14px;
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius-m);
      text-decoration: none;
      font-weight: 600;
    }
    .others a:hover {
      border-color: var(--ink);
    }
    .others span {
      font: 500 11.5px/1 var(--font-mono);
      color: var(--muted);
    }
  `,
})
export class TemplateDetailPage {
  /** Resolved by the route (templateResolver). */
  readonly item = input.required<SiteItem>();

  protected readonly addCommand = computed(() => `npx ng-email add ${this.item().name}`);
  protected readonly others = computed(() => templateEntries().filter((t) => t.name !== this.item().name));
}
