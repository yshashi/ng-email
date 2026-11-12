import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { SiteItem } from '../registry.types';
import { EmailFrame } from '../shared/email-frame';
import { PageHeader } from '../shared/page-header';

@Component({
  selector: 'site-templates-index',
  imports: [RouterLink, EmailFrame, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-page px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <site-page-header title="Templates" [banner]="true">
        Complete emails for the messages every product sends. Each is one Angular component with typed inputs. Add one,
        then change the copy and colors to match your brand.
      </site-page-header>

      <!-- Each thumbnail is the real rendered email, scaled down. -->
      <ul class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        @for (t of templates(); track t.name) {
          <li>
            <a
              class="group block overflow-hidden rounded-lg border border-line bg-card transition-colors hover:border-line-strong"
              [routerLink]="['/templates', t.name]"
            >
              <div class="pointer-events-none h-72 overflow-hidden border-b border-line bg-[#f3f4f6]" aria-hidden="true">
                <div class="w-[200%] origin-top-left scale-50">
                  <site-email-frame [html]="t.html" [title]="t.title + ' thumbnail'" [minHeight]="640" />
                </div>
              </div>
              <div class="px-5 py-4">
                <p class="text-sm text-muted">{{ t.category }}</p>
                <h2 class="mt-1 text-lg group-hover:text-accent">{{ t.title }}</h2>
                <p class="mt-1 text-md text-ink-2">{{ t.description }}</p>
              </div>
            </a>
          </li>
        }
      </ul>
    </div>
  `,
})
export class TemplatesIndexPage {
  /** Resolved by the route (allTemplatesResolver). */
  readonly templates = input.required<SiteItem[]>();
}
