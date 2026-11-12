import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'site-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <p class="code">404</p>
      <h1>This page doesn't exist</h1>
      <p>The link may be old, or the block was renamed. Try one of these instead:</p>
      <div class="links">
        <a routerLink="/components" class="btn btn--primary">Components</a>
        <a routerLink="/templates" class="btn">Templates</a>
        <a routerLink="/" class="btn">Home</a>
      </div>
    </section>
  `,
  styles: `
    section {
      width: var(--page);
      margin: 0 auto;
      padding: 96px 0;
      max-width: 640px;
    }
    .code {
      font: 500 13px/1 var(--font-mono);
      color: var(--xray);
    }
    h1 {
      margin-top: 12px;
      font-size: clamp(32px, 4.4vw, 48px);
    }
    p {
      margin-top: 12px;
      color: var(--muted);
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
    }
  `,
})
export class NotFoundPage {}
