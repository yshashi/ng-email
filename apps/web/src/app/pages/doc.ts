import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { docPagesInOrder, docSections } from '../docs';
import type { DocPage } from '../docs.types';
import { Icon } from '../shared/icon';
import { PageHeader } from '../shared/page-header';

const EDIT_BASE = 'https://github.com/yshashi/ng-email/edit/main/apps/web/content/docs/';

@Component({
  selector: 'site-doc',
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet, Icon, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The article body is Markdown rendered at build time; its typography lives
  // in styles.css under .doc-body, since component styles can't reach it.
  template: `
    <div class="mx-auto grid max-w-page grid-cols-1 gap-x-10 gap-y-6 px-4 pt-6 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-10 lg:pt-10 xl:grid-cols-[210px_minmax(0,1fr)_200px]">
      <ng-template #pageList>
        @for (section of sections; track section.title; let first = $first) {
          <p class="mb-2 font-display text-md font-medium" [class.mt-6]="!first">{{ section.title }}</p>
          <ul class="border-l border-line">
            @for (p of section.pages; track p.slug) {
              <li>
                <a [routerLink]="['/docs', p.slug]" routerLinkActive="is-active" ariaCurrentWhenActive="page" class="side-link">{{ p.title }}</a>
              </li>
            }
          </ul>
        }
      </ng-template>

      <nav class="lg:sticky lg:top-10 lg:max-h-[calc(100vh-80px)] lg:self-start lg:overflow-auto" aria-label="Documentation">
        <!-- Desktop: always visible. Phones: collapsed behind the page's title. -->
        <div class="hidden lg:block"><ng-container [ngTemplateOutlet]="pageList" /></div>
        <details class="group rounded-lg border border-line bg-card lg:hidden">
          <summary class="flex h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-md [&::-webkit-details-marker]:hidden">
            <span class="truncate"><span class="text-muted">Docs</span> <span class="px-1 text-muted">›</span> {{ page().title }}</span>
            <site-icon name="chevron-down" class="text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div class="border-t border-line p-4"><ng-container [ngTemplateOutlet]="pageList" /></div>
        </details>
      </nav>

      <article class="min-w-0 max-w-[760px]">
        <site-page-header [title]="page().title" [crumbs]="['Docs', sectionTitle()]" />
        <div class="mt-10"><div class="doc-body" [innerHTML]="html()" (click)="onBodyClick($event)"></div></div>

        <footer class="mt-16 border-t border-line pt-6">
          <a class="text-md text-link underline-offset-3 hover:underline" [href]="editUrl()" target="_blank" rel="noopener">Edit this page on GitHub</a>
          <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            @if (prev(); as p) {
              <a [routerLink]="['/docs', p.slug]" class="group flex items-center gap-3 rounded-lg border border-line px-4 py-3 transition-colors hover:border-line-strong">
                <site-icon name="chevron-left" class="text-muted" />
                <span class="min-w-0">
                  <span class="block text-sm text-muted">Previous</span>
                  <span class="block truncate font-display text-base font-medium group-hover:text-accent">{{ p.title }}</span>
                </span>
              </a>
            }
            @if (next(); as n) {
              <a
                [routerLink]="['/docs', n.slug]"
                class="group flex items-center justify-end gap-3 rounded-lg border border-line px-4 py-3 text-right transition-colors hover:border-line-strong sm:col-start-2"
              >
                <span class="min-w-0">
                  <span class="block text-sm text-muted">Next</span>
                  <span class="block truncate font-display text-base font-medium group-hover:text-accent">{{ n.title }}</span>
                </span>
                <site-icon name="chevron-right" class="text-muted" />
              </a>
            }
          </div>
        </footer>
      </article>

      @if (page().toc.length > 1) {
        <nav class="hidden xl:sticky xl:top-10 xl:block xl:max-h-[calc(100vh-80px)] xl:self-start xl:overflow-auto" aria-label="On this page">
          <p class="mb-2 font-display text-lg font-medium">On this page</p>
          <ul class="border-l border-line">
            @for (entry of page().toc; track entry.id) {
              <li>
                <a
                  [routerLink]="['/docs', page().slug]"
                  [fragment]="entry.id"
                  class="side-link text-sm!"
                  [class]="entry.depth === 3 ? 'pl-7!' : ''"
                >{{ entry.text }}</a>
              </li>
            }
          </ul>
        </nav>
      }
    </div>
  `,
})
export class DocPageComponent {
  /** Resolved by the route (docResolver). */
  readonly page = input.required<DocPage>();

  protected readonly sections = docSections;
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);

  // Generated at build time from Markdown in this repository.
  protected readonly html = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.page().html));
  private readonly index = computed(() => docPagesInOrder.findIndex((p) => p.slug === this.page().slug));
  protected readonly prev = computed(() => docPagesInOrder[this.index() - 1]);
  protected readonly next = computed(() => docPagesInOrder[this.index() + 1]);
  protected readonly sectionTitle = computed(
    () => this.sections.find((s) => s.pages.some((p) => p.slug === this.page().slug))?.title ?? 'Docs',
  );
  protected readonly editUrl = computed(() => `${EDIT_BASE}${this.page().slug}.md`);

  /** Copy buttons on code blocks, and in-app navigation for links inside the article. */
  protected onBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const copy = target.closest<HTMLButtonElement>('[data-copy]');
    if (copy) {
      const code = copy.parentElement?.querySelector('pre')?.textContent ?? '';
      navigator.clipboard.writeText(code).then(
        () => (copy.textContent = 'Copied'),
        () => (copy.textContent = 'Copy failed'),
      );
      setTimeout(() => (copy.textContent = 'Copy'), 1600);
      return;
    }

    const link = target.closest('a');
    if (!link || event.defaultPrevented || event.button !== 0 || link.target) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = link.getAttribute('href') ?? '';
    // Only site-relative links (resolved against <base href>); leave external and mailto alone.
    if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return;
    event.preventDefault();
    void this.router.navigateByUrl(href.startsWith('#') ? `/docs/${this.page().slug}${href}` : `/${href}`);
  }
}
