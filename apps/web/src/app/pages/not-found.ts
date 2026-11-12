import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeader } from '../shared/page-header';

@Component({
  selector: 'site-not-found',
  imports: [RouterLink, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-3xl px-4 pt-16 sm:px-6 sm:pt-24">
      <site-page-header title="There is nothing at this address" [crumbs]="['Page not found']">
        The link may be old, or the block was renamed. These pages list everything on the site.
        <div actions class="mt-8 flex flex-wrap gap-3">
          <a routerLink="/components" class="btn btn-primary">Components</a>
          <a routerLink="/templates" class="btn">Templates</a>
          <a routerLink="/docs" class="btn">Docs</a>
        </div>
      </site-page-header>
    </section>
  `,
})
export class NotFoundPage {}
