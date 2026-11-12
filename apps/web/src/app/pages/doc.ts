import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { docPagesInOrder, docSections } from '../docs';
import type { DocPage } from '../docs.types';

const EDIT_BASE = 'https://github.com/yshashi/ng-email/edit/main/apps/web/content/docs/';

@Component({
  selector: 'site-doc',
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The article is Markdown rendered to HTML at build time; scoped styles
  // can't reach injected HTML, so this component's styles are global but
  // namespaced under .docs.
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="docs">
      <ng-template #pageList>
        @for (section of sections; track section.title) {
          <p class="docs__section">{{ section.title }}</p>
          <ul>
            @for (p of section.pages; track p.slug) {
              <li>
                <a [routerLink]="['/docs', p.slug]" routerLinkActive="is-active" ariaCurrentWhenActive="page">{{ p.title }}</a>
              </li>
            }
          </ul>
        }
      </ng-template>
      <nav class="docs__side" aria-label="Documentation">
        <!-- Desktop: always visible. Phones: collapsed behind "Docs menu". -->
        <div class="docs__list"><ng-container [ngTemplateOutlet]="pageList" /></div>
        <details class="docs__menu">
          <summary>Docs menu <span>· {{ page().title }}</span></summary>
          <ng-container [ngTemplateOutlet]="pageList" />
        </details>
      </nav>

      <article class="docs__article">
        <h1>{{ page().title }}</h1>
        <div class="doc-body" [innerHTML]="html()" (click)="onBodyClick($event)"></div>

        <footer class="docs__foot">
          <a class="docs__edit" [href]="editUrl()" target="_blank" rel="noopener">Edit this page on GitHub</a>
          <div class="docs__pager">
            @if (prev(); as p) {
              <a [routerLink]="['/docs', p.slug]" class="docs__pager-link">
                <span>Previous</span>{{ p.title }}
              </a>
            }
            @if (next(); as n) {
              <a [routerLink]="['/docs', n.slug]" class="docs__pager-link docs__pager-link--next">
                <span>Next</span>{{ n.title }}
              </a>
            }
          </div>
        </footer>
      </article>

      @if (page().toc.length > 1) {
        <nav class="docs__toc" aria-label="On this page">
          <p>On this page</p>
          <ul>
            @for (entry of page().toc; track entry.id) {
              <li [class.is-sub]="entry.depth === 3">
                <a [routerLink]="['/docs', page().slug]" [fragment]="entry.id">{{ entry.text }}</a>
              </li>
            }
          </ul>
        </nav>
      }
    </div>
  `,
  styles: `
    .docs {
      width: var(--page);
      margin: 0 auto;
      display: grid;
      grid-template-columns: 210px minmax(0, 1fr) 190px;
      gap: 48px;
      padding-top: 40px;
    }
    .docs__side,
    .docs__toc {
      position: sticky;
      top: 84px;
      align-self: start;
      max-height: calc(100vh - 100px);
      overflow: auto;
      font-size: 14.5px;
    }
    .docs__menu {
      display: none;
    }
    .docs__section {
      margin: 18px 0 6px;
      font: 600 12px/1 var(--font-body);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .docs__section:first-of-type {
      margin-top: 0;
    }
    .docs__side ul,
    .docs__toc ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 1px;
    }
    .docs__side li a {
      display: block;
      padding: 5px 10px;
      border-radius: var(--radius-s);
      color: var(--muted);
      text-decoration: none;
    }
    .docs__side li a:hover {
      color: var(--ink);
    }
    .docs__side li a.is-active {
      background: var(--surface);
      color: var(--ink);
      font-weight: 600;
      box-shadow: inset 2px 0 0 var(--xray);
    }
    .docs__toc p {
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
    }
    .docs__toc a {
      display: block;
      padding: 3px 0;
      color: var(--muted);
      text-decoration: none;
      font-size: 13.5px;
      line-height: 1.4;
    }
    .docs__toc a:hover {
      color: var(--ink);
    }
    .docs__toc .is-sub a {
      padding-left: 12px;
    }
    .docs__article {
      min-width: 0;
      max-width: 760px;
    }
    .docs__article > h1 {
      font-size: clamp(34px, 4.4vw, 48px);
      font-variation-settings: 'wdth' 88;
      margin-bottom: 18px;
    }
    .docs__foot {
      margin-top: 56px;
      padding-top: 20px;
      border-top: 1px solid var(--line);
    }
    .docs__edit {
      color: var(--muted);
      font-size: 13.5px;
    }
    .docs__pager {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 20px;
    }
    .docs__pager-link {
      display: grid;
      gap: 2px;
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: var(--radius-m);
      background: var(--surface);
      text-decoration: none;
      font-weight: 600;
    }
    .docs__pager-link:hover {
      border-color: var(--ink);
    }
    .docs__pager-link span {
      font: 500 12px/1.4 var(--font-body);
      color: var(--muted);
    }
    .docs__pager-link--next {
      grid-column: 2;
      text-align: right;
    }

    /* ---- article typography ---------------------------------------------- */
    .doc-body {
      font-size: 16.5px;
      line-height: 1.7;
      color: var(--ink-soft);
    }
    .doc-body > * + * {
      margin-top: 16px;
    }
    .doc-body > p:first-child {
      font-size: 19px;
      color: var(--ink);
    }
    .doc-body h2,
    .doc-body h3 {
      position: relative;
      color: var(--ink);
      scroll-margin-top: 84px;
    }
    .doc-body h2 {
      margin-top: 44px;
      padding-top: 20px;
      border-top: 1px solid var(--line);
      font-size: 27px;
    }
    .doc-body h3 {
      margin-top: 30px;
      font-size: 20px;
    }
    .doc-anchor {
      margin-left: 8px;
      color: var(--line-strong);
      text-decoration: none;
      font-weight: 400;
      opacity: 0;
    }
    .doc-body h2:hover .doc-anchor,
    .doc-body h3:hover .doc-anchor {
      opacity: 1;
    }
    .doc-body a:not(.doc-anchor) {
      color: var(--ink);
      text-decoration-color: var(--xray);
      text-underline-offset: 3px;
    }
    .doc-body ul,
    .doc-body ol {
      padding-left: 22px;
    }
    .doc-body li + li {
      margin-top: 6px;
    }
    .doc-body :not(pre) > code {
      font-size: 0.86em;
      background: var(--sunken);
      border: 1px solid var(--line);
      padding: 1px 5px;
      border-radius: 4px;
      color: var(--ink);
    }
    .doc-body blockquote {
      margin-left: 0;
      margin-right: 0;
      padding: 12px 16px;
      border-left: 3px solid var(--xray);
      background: var(--xray-soft);
      border-radius: 0 var(--radius-s) var(--radius-s) 0;
      color: var(--ink);
    }
    .doc-body blockquote p {
      margin: 0;
    }
    .doc-code {
      position: relative;
      border: 1px solid var(--line);
      border-radius: var(--radius-m);
      background: var(--surface);
    }
    .doc-code pre {
      margin: 0;
      padding: 14px 16px;
      overflow-x: auto;
      font-size: 13.5px;
      line-height: 1.65;
      background: transparent !important;
    }
    .doc-copy {
      position: absolute;
      top: 8px;
      right: 8px;
      height: 26px;
      padding: 0 9px;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: var(--sunken);
      color: var(--ink);
      font: 500 12px/1 var(--font-body);
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .doc-code:hover .doc-copy,
    .doc-copy:focus-visible {
      opacity: 1;
    }
    .doc-table {
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: var(--radius-m);
    }
    .doc-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14.5px;
    }
    .doc-table th,
    .doc-table td {
      padding: 9px 12px;
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid var(--line);
    }
    .doc-table th {
      background: var(--sunken);
      font-weight: 600;
      color: var(--ink);
    }
    .doc-table tr:last-child td {
      border-bottom: 0;
    }

    @media (max-width: 1100px) {
      .docs {
        grid-template-columns: 200px minmax(0, 1fr);
      }
      .docs__toc {
        display: none;
      }
    }
    @media (max-width: 820px) {
      .docs {
        grid-template-columns: minmax(0, 1fr);
        gap: 20px;
        padding-top: 20px;
      }
      .docs__side {
        position: static;
        max-height: none;
      }
      .docs__list {
        display: none;
      }
      .docs__menu {
        display: block;
        border: 1px solid var(--line);
        border-radius: var(--radius-m);
        background: var(--surface);
        padding: 10px 14px;
      }
      .docs__menu > summary {
        cursor: pointer;
        font-weight: 600;
      }
      .docs__menu > summary span {
        font-weight: 400;
        color: var(--muted);
      }
      .docs__menu[open] > summary {
        margin-bottom: 10px;
      }
      .doc-copy {
        opacity: 1;
      }
    }
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
