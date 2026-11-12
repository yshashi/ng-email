import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Icon, type IconName } from './shared/icon';
import { Logo } from './shared/logo';
import { ThemeToggle } from './shared/theme-toggle';

const REPO = 'https://github.com/yshashi/ng-email';

@Component({
  selector: 'site-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Logo, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="#main"
      class="fixed top-3 left-4 z-50 -translate-y-24 rounded-md bg-ink px-3 py-2 text-md text-page focus:translate-y-0"
    >Skip to content</a>

    <!-- Desktop: a fixed rail on the left, like angular.dev. -->
    <nav
      class="fixed inset-y-0 left-0 z-30 hidden w-22 flex-col items-center border-r border-line bg-page py-4 lg:flex"
      aria-label="Main"
    >
      <a routerLink="/" class="mb-6 flex flex-col items-center gap-1.5 rounded-md p-1 text-xs font-medium" aria-label="ng-email home">
        <site-logo [size]="32" />
        <span aria-hidden="true">ng-email</span>
      </a>
      <ul class="flex w-full flex-col">
        @for (link of links; track link.path) {
          <li>
            <a [routerLink]="link.path" routerLinkActive="is-active" class="rail-link">
              <site-icon [name]="link.icon" [size]="20" />
              {{ link.label }}
            </a>
          </li>
        }
      </ul>
      <div class="mt-auto flex w-full flex-col items-center gap-1">
        <a [href]="repo" target="_blank" rel="noopener" class="rail-link">
          <site-icon name="github" [size]="20" />
          GitHub
        </a>
        <site-theme-toggle [stacked]="true" />
      </div>
    </nav>

    <div class="flex min-h-screen flex-col lg:pl-22">
      <!-- Phones and tablets: a top bar. -->
      <header class="sticky top-0 z-30 border-b border-line bg-page lg:hidden">
        <nav class="flex h-14 items-center justify-between gap-3 px-4" aria-label="Main">
          <a routerLink="/" class="flex shrink-0 items-center gap-2 rounded-md font-display text-base font-medium" aria-label="ng-email home">
            <site-logo [size]="26" />
            <span class="hidden min-[400px]:inline" aria-hidden="true">ng-email</span>
          </a>
          <div class="flex items-center gap-0.5">
            @for (link of links; track link.path) {
              <a
                [routerLink]="link.path"
                routerLinkActive="text-accent! font-medium"
                class="flex h-8 items-center rounded-md px-2 text-sm text-ink-2 transition-colors hover:text-ink sm:px-3 sm:text-md"
              >{{ link.label }}</a>
            }
            <site-theme-toggle />
          </div>
        </nav>
      </header>

      <main id="main" class="flex-1">
        <router-outlet />
      </main>

      <footer class="mt-32 border-t border-line">
        <div class="mx-auto flex max-w-page flex-col gap-2 px-4 py-10 text-md text-ink-2 sm:flex-row sm:justify-between sm:px-6 lg:px-10">
          <p>
            ng-email is open source under the MIT license.
            <a [href]="repo" target="_blank" rel="noopener" class="text-link underline underline-offset-3">Source on GitHub</a>
          </p>
          <p class="text-muted">A community project, not affiliated with the Angular team or Google</p>
        </div>
      </footer>
    </div>
  `,
})
export class App {
  protected readonly repo = REPO;
  protected readonly links: Array<{ path: string; label: string; icon: IconName }> = [
    { path: '/components', label: 'Components', icon: 'blocks' },
    { path: '/templates', label: 'Templates', icon: 'mail' },
    { path: '/docs', label: 'Docs', icon: 'docs' },
  ];

  constructor() {
    // Router anchor scrolling ignores CSS scroll-padding: keep headings clear of
    // the top bar on phones (the desktop rail is at the side).
    inject(ViewportScroller).setOffset(() => [0, typeof window !== 'undefined' && window.innerWidth >= 1024 ? 24 : 72]);
  }
}
