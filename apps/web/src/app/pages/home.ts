import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { snippets } from '../../generated/snippets';
import { blockCategories, countOf, templateEntries } from '../registry';
import type { SiteItem } from '../registry.types';
import { CopyButton } from '../shared/copy-button';
import { EmailFrame } from '../shared/email-frame';

const INSTALL = 'npm install @ng-email/render @ng-email/components';

@Component({
  selector: 'site-home',
  imports: [RouterLink, CopyButton, EmailFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="hero__copy">
        <h1 class="hero__title">
          Angular components in.<br />
          <span>Inbox-safe HTML out.</span>
        </h1>
        <p class="hero__lede">
          ng-email renders standalone Angular components into the table-based, inline-styled HTML that Gmail,
          Outlook and Apple Mail expect, with a plain-text part and no framework leftovers.
        </p>
        <div class="hero__actions">
          <a routerLink="/components" class="btn btn--primary">Browse {{ blockCount }} components</a>
          <a routerLink="/templates" class="btn">See templates</a>
        </div>
        <div class="cmd hero__install">
          <code>{{ install }}</code>
          <site-copy [text]="install" ariaLabel="Copy install command" />
        </div>
      </div>

      <figure class="hero__demo" [class.hero__demo--plain]="!xray()">
        <figcaption class="hero__demo-bar">
          <span class="hero__file">welcome.email.ts <span aria-hidden="true">→</span> inbox</span>
          <button
            type="button"
            class="xray-toggle"
            [attr.aria-pressed]="xray()"
            (click)="xray.set(!xray())"
            title="Outline the tables and cells this email is built from"
          >X-ray</button>
        </figcaption>
        <div class="hero__stage">
          <div class="hero__frames">
            <site-email-frame [html]="welcome().html" title="Welcome email, as rendered" [minHeight]="560" />
            <div class="hero__xray" aria-hidden="true">
              <site-email-frame [html]="welcome().html" [xray]="true" title="Welcome email with table outlines" [minHeight]="560" />
              <span class="hero__scan"></span>
            </div>
          </div>
        </div>
        <p class="hero__note">
          <span class="hero__key" aria-hidden="true"></span>
          Dashed lines are the tables Outlook needs. ng-email writes them; you write Angular.
        </p>
      </figure>
    </section>

    <section class="pair" aria-labelledby="pair-title">
      <div class="section-head">
        <h2 id="pair-title">Write a component. Ship an email.</h2>
        <p>Inputs are signals, layout is ng-email components, styles are inline. The renderer handles the rest.</p>
      </div>
      <div class="pair__grid">
        <div class="pair__card">
          <p class="pair__label">welcome.email.ts</p>
          <div class="code-block" [innerHTML]="code.component"></div>
          <div class="code-block pair__render" [innerHTML]="code.render"></div>
        </div>
        <div class="pair__card">
          <p class="pair__label">Rendered button, as ng-email outputs it</p>
          <div class="code-block" [innerHTML]="code.output"></div>
          <ul class="pair__notes">
            <li><strong>Padding in Outlook.</strong> Outlook ignores CSS padding on links, so the
              <code>&lt;!--[if mso]&gt;</code> blocks add spacing that only Outlook reads.</li>
            <li><strong>Exact styles.</strong> Inline styles are written verbatim, <code>mso-*</code> properties included.</li>
            <li><strong>Nothing from Angular.</strong> No <code>ng-version</code>, no component tags, no comments
              except the ones email clients use.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="steps" aria-labelledby="steps-title">
      <div class="section-head">
        <h2 id="steps-title">From component to inbox</h2>
      </div>
      <ol class="steps__list">
        <li>
          <h3>Write</h3>
          <p>A standalone component with <code>imports: [EMAIL_COMPONENTS]</code>, or start from a block:</p>
          <code class="steps__cmd">npx ng-email add header-centered</code>
        </li>
        <li>
          <h3>Preview</h3>
          <p>Live reload in the browser at desktop and mobile widths, with the plain-text part and X-ray.</p>
          <code class="steps__cmd">npx ng-email preview src/emails/index.ts</code>
        </li>
        <li>
          <h3>Send</h3>
          <p>Bundle your emails for any Node service, then hand <code>html</code> and <code>text</code> to your
            email provider.</p>
          <code class="steps__cmd">npx ng-email build src/emails/index.ts</code>
        </li>
      </ol>
    </section>

    <section class="browse" aria-labelledby="browse-title">
      <div class="section-head">
        <h2 id="browse-title">Start from a block</h2>
        <p>{{ blockCount }} components in {{ categories.length }} categories, and {{ templates.length }} complete templates.
          Copy the code or add them with one command; the files are yours to edit.</p>
      </div>
      <div class="browse__grid">
        <ul class="browse__cats">
          @for (category of categories; track category.slug) {
            <li>
              <a [routerLink]="['/components', category.slug]">
                <span>{{ category.name }}</span>
                <span class="browse__count">{{ category.items.length }}</span>
              </a>
            </li>
          }
        </ul>
        <ul class="browse__templates">
          @for (t of templates; track t.name) {
            <li>
              <a [routerLink]="['/templates', t.name]">
                <strong>{{ t.title }}</strong>
                <span>{{ t.description }}</span>
              </a>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      width: var(--page);
      margin: 0 auto;
    }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
      gap: 48px;
      align-items: start;
      padding: 56px 0 24px;
    }
    .hero__copy {
      position: sticky;
      top: 100px;
      padding-top: 24px;
    }
    .hero__title {
      font-size: clamp(40px, 5.6vw, 68px);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 0.98;
      font-variation-settings: 'wdth' 85;
    }
    .hero__title span {
      color: var(--muted);
      font-weight: 500;
    }
    .hero__lede {
      margin-top: 22px;
      max-width: 34em;
      font-size: 18px;
      color: var(--ink-soft);
    }
    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 28px;
    }
    .hero__install {
      margin-top: 16px;
    }
    .hero__demo {
      margin: 0;
      border-radius: var(--radius-l);
      border: 1px solid var(--line);
      background: var(--surface);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .hero__demo-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px 10px 16px;
      border-bottom: 1px solid var(--line);
    }
    .hero__file {
      font: 12.5px/1 var(--font-mono);
      color: var(--muted);
    }
    .hero__stage {
      background: var(--stage);
    }
    .hero__frames {
      position: relative;
    }
    /* The signature: the X-rayed copy is wiped in top to bottom, led by a scan line. */
    .hero__xray {
      position: absolute;
      inset: 0;
      clip-path: inset(0 0 0 0);
      animation: xray-wipe 2.4s cubic-bezier(0.6, 0, 0.3, 1) 0.5s both;
      transition: opacity 0.2s;
    }
    .hero__scan {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--xray);
      box-shadow: 0 0 18px 2px var(--xray);
      animation: scan 2.4s cubic-bezier(0.6, 0, 0.3, 1) 0.5s both;
    }
    .hero__demo--plain .hero__xray {
      opacity: 0;
    }
    @keyframes xray-wipe {
      from {
        clip-path: inset(0 0 100% 0);
      }
      to {
        clip-path: inset(0 0 0 0);
      }
    }
    @keyframes scan {
      from {
        top: 0;
        opacity: 1;
      }
      92% {
        opacity: 1;
      }
      to {
        top: 100%;
        opacity: 0;
      }
    }
    .hero__note {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-top: 1px solid var(--line);
      font-size: 13.5px;
      color: var(--muted);
    }
    .hero__key {
      flex: none;
      width: 22px;
      height: 14px;
      border: 1.5px dashed var(--xray);
      border-radius: 2px;
    }
    .section-head {
      max-width: 46em;
      margin-bottom: 28px;
    }
    .section-head h2 {
      font-size: clamp(28px, 3.4vw, 40px);
      font-variation-settings: 'wdth' 90;
    }
    .section-head p {
      margin-top: 10px;
      color: var(--muted);
      font-size: 17px;
    }
    .pair,
    .steps,
    .browse {
      padding-top: 96px;
    }
    .pair__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
    .pair__card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
    }
    .pair__label {
      font: 500 12.5px/1 var(--font-mono);
      color: var(--muted);
    }
    .pair__render {
      border-style: dashed;
    }
    .pair__notes {
      margin: 8px 0 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 10px;
      font-size: 14.5px;
      color: var(--ink-soft);
    }
    .pair__notes code,
    .steps code {
      font-size: 0.88em;
      background: var(--sunken);
      padding: 1px 5px;
      border-radius: 4px;
    }
    .steps__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
      counter-reset: step;
    }
    .steps__list li {
      counter-increment: step;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 22px;
      border-radius: var(--radius-l);
      border: 1px solid var(--line);
      background: var(--surface);
    }
    .steps__list h3 {
      font-size: 22px;
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .steps__list h3::before {
      content: counter(step);
      font: 500 13px/1 var(--font-mono);
      color: var(--xray);
    }
    .steps__list p {
      color: var(--ink-soft);
      font-size: 15px;
      flex: 1;
    }
    .steps .steps__cmd {
      display: block;
      padding: 8px 10px;
      font-size: 12.5px;
      overflow-x: auto;
      white-space: nowrap;
    }
    .browse__grid {
      display: grid;
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      gap: 20px;
      align-items: start;
    }
    .browse__cats {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .browse__cats a {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border-radius: var(--radius-m);
      border: 1px solid var(--line);
      background: var(--surface);
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
    }
    .browse__cats a:hover,
    .browse__templates a:hover {
      border-color: var(--ink);
    }
    .browse__count {
      font: 12px/1 var(--font-mono);
      color: var(--muted);
    }
    .browse__templates {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .browse__templates a {
      display: grid;
      gap: 2px;
      padding: 12px 14px;
      border-radius: var(--radius-m);
      border: 1px dashed var(--line-strong);
      text-decoration: none;
    }
    .browse__templates span {
      color: var(--muted);
      font-size: 14px;
    }
    @media (max-width: 960px) {
      .hero,
      .pair__grid,
      .browse__grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .hero__copy {
        position: static;
        padding-top: 0;
      }
      .steps__list {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    @media (max-width: 560px) {
      .browse__cats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class HomePage {
  /** Resolved by the route (homeResolver). */
  readonly welcome = input.required<SiteItem>();

  protected readonly install = INSTALL;
  protected readonly xray = signal(true);
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
