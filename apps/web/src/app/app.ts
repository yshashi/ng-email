import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const REPO = 'https://github.com/yshashi/ng-email';

@Component({
  selector: 'site-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip" href="#main">Skip to content</a>
    <header class="top">
      <nav class="top__inner" aria-label="Main">
        <a routerLink="/" class="brand" aria-label="ng-email home">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect x="2" y="6" width="28" height="20" rx="4" />
            <path d="M5 9.5 16 17l11-7.5" />
            <rect class="brand__xray" x="2.75" y="6.75" width="26.5" height="18.5" rx="3.25" />
          </svg>
          <span>ng-email</span>
        </a>
        <ul class="nav">
          <li><a routerLink="/components" routerLinkActive="is-active">Components</a></li>
          <li><a routerLink="/templates" routerLinkActive="is-active">Templates</a></li>
          <li><a [href]="repo + '#readme'" target="_blank" rel="noopener">Docs</a></li>
          <li>
            <a [href]="repo" target="_blank" rel="noopener" class="nav__gh">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
              <span class="visually-hidden">ng-email on </span><span class="nav__gh-label">GitHub</span>
            </a>
          </li>
        </ul>
      </nav>
    </header>

    <main id="main">
      <router-outlet />
    </main>

    <footer class="foot">
      <div class="foot__inner">
        <p>
          <strong>ng-email</strong> is open source under the MIT license.
          <a [href]="repo" target="_blank" rel="noopener">Source on GitHub</a>.
        </p>
        <p class="foot__muted">
          A community project. Not affiliated with or endorsed by the Angular team or Google.
        </p>
      </div>
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .skip {
      position: absolute;
      left: 16px;
      top: 12px;
      transform: translateY(-200%);
      padding: 8px 12px;
      background: var(--ink);
      color: var(--on-ink);
      border-radius: var(--radius-s);
      z-index: 20;
    }
    .skip:focus {
      transform: none;
    }
    .top {
      position: sticky;
      top: 0;
      z-index: 10;
      background: color-mix(in srgb, var(--paper) 86%, transparent);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--line);
    }
    .top__inner {
      width: var(--page);
      margin: 0 auto;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      font: 650 19px/1 var(--font-display);
      letter-spacing: -0.02em;
      white-space: nowrap;
      flex: none;
    }
    .brand svg {
      width: 28px;
      height: 28px;
    }
    .brand svg rect:first-child {
      fill: var(--ink);
    }
    .brand svg path {
      fill: none;
      stroke: var(--paper);
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .brand__xray {
      fill: none;
      stroke: var(--xray);
      stroke-width: 1.5;
      stroke-dasharray: 2.5 2;
    }
    .nav {
      display: flex;
      align-items: center;
      gap: 4px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .nav a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      border-radius: var(--radius-s);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      color: var(--muted);
    }
    .nav a:hover,
    .nav a.is-active {
      color: var(--ink);
    }
    .nav a.is-active {
      background: var(--sunken);
    }
    .nav__gh svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    main {
      flex: 1;
    }
    .foot {
      border-top: 1px solid var(--line);
      margin-top: 96px;
    }
    .foot__inner {
      width: var(--page);
      margin: 0 auto;
      padding: 28px 0 40px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px 24px;
      font-size: 14px;
    }
    .foot__muted {
      color: var(--muted);
    }
    @media (max-width: 560px) {
      .nav {
        gap: 0;
      }
      .nav a {
        padding: 7px 7px;
      }
      /* Phones: Docs lives in the footer link to GitHub; GitHub shows as its icon. */
      .nav li:nth-child(3),
      .nav__gh-label {
        display: none;
      }
      .nav__gh svg {
        width: 18px;
        height: 18px;
      }
    }
  `,
})
export class App {
  protected readonly repo = REPO;
}
