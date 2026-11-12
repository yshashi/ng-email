import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { templateEntries } from '../registry';
import type { SiteItem } from '../registry.types';
import { BlockViewer } from '../shared/block-viewer';
import { Command } from '../shared/command';
import { Icon } from '../shared/icon';
import { PageHeader } from '../shared/page-header';

@Component({
  selector: 'site-template-detail',
  imports: [RouterLink, BlockViewer, Command, Icon, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <a routerLink="/templates" class="mb-4 inline-flex h-8 items-center gap-2 font-display text-md font-medium transition-colors hover:text-accent">
        <site-icon name="chevron-left" />
        Templates
      </a>
      <site-page-header [title]="item().title" [crumbs]="['Templates', item().category]">
        {{ item().description }}
        <div actions class="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
          <site-command class="md:max-w-md" [command]="addCommand()" label="Copy the add command" />
          <p class="text-md text-ink-2">
            Then render it with
            <code class="code-inline">renderEmailBoth({{ item().className }}, {{ '{' }} inputs {{ '}' }})</code>
          </p>
        </div>
      </site-page-header>

      <div class="mt-8"><site-block-viewer [item]="item()" [showHeader]="false" /></div>

      <section class="mt-16" aria-labelledby="more-title">
        <h2 id="more-title" class="text-2xl tracking-[-0.01em]">More templates</h2>
        <ul class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          @for (t of others(); track t.name) {
            <li>
              <a
                [routerLink]="['/templates', t.name]"
                class="group flex h-full items-center justify-between gap-4 rounded-lg border border-line bg-card px-5 py-4 transition-colors hover:border-line-strong"
              >
                <span class="min-w-0">
                  <span class="block font-display text-base font-medium group-hover:text-accent">{{ t.title }}</span>
                  <span class="block truncate text-md text-ink-2">{{ t.description }}</span>
                </span>
                <site-icon name="chevron-right" class="text-muted" />
              </a>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class TemplateDetailPage {
  /** Resolved by the route (templateResolver). */
  readonly item = input.required<SiteItem>();

  protected readonly addCommand = computed(() => `npx ng-email add ${this.item().name}`);
  protected readonly others = computed(() => templateEntries().filter((t) => t.name !== this.item().name));
}
