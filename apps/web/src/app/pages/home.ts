import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { snippets } from '../../generated/snippets';
import { blockCategories, countOf, templateEntries } from '../registry';
import type { SiteItem } from '../registry.types';
import { Command } from '../shared/command';
import { Icon } from '../shared/icon';
import { ProofSheet } from '../shared/proof-sheet';

const STEPS = [
  {
    name: 'Install',
    text: 'The renderer and the email components. Both need Angular 22.',
    command: 'npm install @ng-email/render @ng-email/components',
  },
  {
    name: 'Write',
    text: 'A standalone component with signal inputs. Start from a block and edit the copy.',
    command: 'npx ng-email add header-centered',
  },
  {
    name: 'Preview',
    text: 'Desktop and mobile widths, the plain-text version and table outlines, with live reload.',
    command: 'npx ng-email preview src/emails/index.ts',
  },
  {
    name: 'Send',
    text: 'Bundle the emails for any Node service, then hand html and text to your provider.',
    command: 'npx ng-email build src/emails/index.ts',
  },
];

const NOTES = [
  {
    title: 'Padding in Outlook',
    text: 'Outlook ignores CSS padding on links, so the <code class="code-inline">&lt;!--[if mso]&gt;</code> blocks add spacing only Outlook reads.',
  },
  {
    title: 'Exact styles',
    text: 'Inline styles are written as you set them, <code class="code-inline">mso-*</code> properties included.',
  },
  {
    title: 'Nothing from Angular',
    text: 'No <code class="code-inline">ng-version</code>, no component tags, and no comments except the ones email clients use.',
  },
];

@Component({
  selector: 'site-home',
  imports: [RouterLink, Command, Icon, ProofSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative overflow-hidden">
      <div class="dot-field" aria-hidden="true"></div>
      <div class="relative mx-auto max-w-4xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 lg:pt-36 lg:pb-20">
        <h1 class="text-4xl tracking-[-0.02em] sm:text-5xl sm:tracking-[-0.03em] lg:text-hero">Email templates as Angular components</h1>
        <p class="mx-auto mt-6 max-w-xl text-lg text-ink-2">
          Write emails as standalone components with signal inputs. ng-email renders them to the table-based,
          inline-styled HTML that Gmail, Outlook and Apple Mail expect, with a plain-text version alongside.
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-3">
          <a routerLink="/docs" class="btn btn-primary h-11 px-6">Get started</a>
          <a routerLink="/components" class="btn h-11 px-6">Browse components</a>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-3xl px-4 sm:px-6" aria-label="A rendered email, marked up">
      <site-proof-sheet [html]="welcome().html" />
    </section>

    <section class="mx-auto mt-28 max-w-page px-4 sm:mt-36 sm:px-6 lg:px-10" aria-labelledby="steps-title">
      <div class="mx-auto max-w-2xl text-center">
        <h2 id="steps-title" class="text-3xl tracking-[-0.02em] sm:text-4xl">From component to inbox</h2>
        <p class="mt-4 text-lg text-ink-2">Four commands, in the order you will run them.</p>
      </div>
      <ol class="mt-12 divide-y divide-line rounded-lg border border-line bg-card">
        @for (step of steps; track step.name; let i = $index) {
          <li class="grid grid-cols-1 gap-x-8 gap-y-3 px-5 py-5 sm:px-6 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,460px)] md:items-center">
            <h3 class="flex items-center gap-3 text-lg">
              <span class="flex size-7 items-center justify-center rounded-full border border-line-strong font-sans text-sm text-ink-2 tabular-nums">{{ i + 1 }}</span>
              {{ step.name }}
            </h3>
            <p class="text-md text-ink-2">{{ step.text }}</p>
            <site-command [command]="step.command" [label]="'Copy the ' + step.name.toLowerCase() + ' command'" />
          </li>
        }
      </ol>
    </section>

    <section class="mx-auto mt-28 max-w-page px-4 sm:mt-36 sm:px-6 lg:px-10" aria-labelledby="code-title">
      <div class="mx-auto max-w-2xl text-center">
        <h2 id="code-title" class="text-3xl tracking-[-0.02em] sm:text-4xl">The component, and what it renders</h2>
        <p class="mt-4 text-lg text-ink-2">
          Layout comes from ng-email's components, styles are written inline, inputs are signals. The renderer handles
          the parts email clients are picky about.
        </p>
      </div>
      <div class="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div class="min-w-0 overflow-hidden rounded-lg border border-line">
          <p class="flex h-11 items-center gap-2 border-b border-line bg-card px-4 font-mono text-sm text-ink-2">welcome.email.ts</p>
          <div class="code-block max-h-[480px]" [innerHTML]="code.component"></div>
          <div class="code-block border-t border-line" [innerHTML]="code.render"></div>
        </div>
        <div class="min-w-0">
          <div class="overflow-hidden rounded-lg border border-line">
            <p class="flex h-11 items-center border-b border-line bg-card px-4 text-md text-ink-2">The button, as ng-email writes it</p>
            <div class="code-block max-h-[360px]" [innerHTML]="code.output"></div>
          </div>
          <dl class="mt-6 grid gap-3">
            @for (note of notes; track note.title) {
              <div class="rounded-lg border border-line bg-card px-5 py-4">
                <dt class="font-display text-base font-medium">{{ note.title }}</dt>
                <dd class="mt-1 text-md text-ink-2" [innerHTML]="note.text"></dd>
              </div>
            }
          </dl>
        </div>
      </div>
    </section>

    <section class="mx-auto mt-28 max-w-page px-4 sm:mt-36 sm:px-6 lg:px-10" aria-labelledby="browse-title">
      <div class="mx-auto max-w-2xl text-center">
        <h2 id="browse-title" class="text-3xl tracking-[-0.02em] sm:text-4xl">Start from a block</h2>
        <p class="mt-4 text-lg text-ink-2">
          {{ blockCount }} blocks in {{ categories.length }} categories and {{ templates.length }} complete templates.
          Copy the code or add it with one command. The files are yours to edit.
        </p>
      </div>
      <div class="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-line bg-card">
          <div class="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 class="flex items-center gap-2 text-lg"><site-icon name="blocks" [size]="18" class="text-accent" />Blocks</h3>
            <a routerLink="/components" class="text-md text-link hover:underline">All components</a>
          </div>
          <ul class="grid grid-cols-1 p-2 sm:grid-cols-2">
            @for (category of categories; track category.slug) {
              <li>
                <a
                  [routerLink]="['/components', category.slug]"
                  class="flex h-10 items-center justify-between gap-4 rounded-md px-3 text-md text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                >
                  {{ category.name }}
                  <span class="text-sm text-muted tabular-nums">{{ category.items.length }}</span>
                </a>
              </li>
            }
          </ul>
        </div>
        <div class="self-start rounded-lg border border-line bg-card">
          <div class="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 class="flex items-center gap-2 text-lg"><site-icon name="mail" [size]="18" class="text-accent" />Templates</h3>
            <a routerLink="/templates" class="text-md text-link hover:underline">All templates</a>
          </div>
          <ul class="p-2">
            @for (t of templates; track t.name) {
              <li>
                <a [routerLink]="['/templates', t.name]" class="group flex items-center justify-between gap-4 rounded-md px-3 py-2.5 transition-colors hover:bg-raised">
                  <span class="min-w-0">
                    <span class="block text-md font-medium">{{ t.title }}</span>
                    <span class="block truncate text-sm text-ink-2">{{ t.description }}</span>
                  </span>
                  <site-icon name="chevron-right" class="text-muted" />
                </a>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
})
export class HomePage {
  /** Resolved by the route (homeResolver). */
  readonly welcome = input.required<SiteItem>();

  protected readonly steps = STEPS;
  protected readonly notes = NOTES;
  protected readonly blockCount = countOf('block');
  protected readonly categories = blockCategories();
  protected readonly templates = templateEntries();

  private readonly sanitizer = inject(DomSanitizer);
  // Shiki output generated at build time from our own snippets.
  protected readonly code = {
    component: this.sanitizer.bypassSecurityTrustHtml(snippets.component),
    render: this.sanitizer.bypassSecurityTrustHtml(snippets.render),
    output: this.sanitizer.bypassSecurityTrustHtml(snippets.output),
  };
}
