import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Cover image, category, headline, excerpt and a read-more link, e.g. for newsletters. */
@Component({
  selector: 'article-card',
  imports: [EMAIL_COMPONENTS],
  template: `
    <table ngeSection [ngeStyle]="s.section">
      <img ngeImg [attr.src]="imageUrl()" width="552" height="276" [alt]="title()" [ngeStyle]="s.image" />
      <p ngeText [ngeStyle]="s.meta">{{ category() }} &middot; {{ readingTime() }}</p>
      <h2 ngeHeading [ngeStyle]="s.title">{{ title() }}</h2>
      <p ngeText [ngeStyle]="s.excerpt">{{ excerpt() }}</p>
      <a ngeLink [href]="url()" [ngeStyle]="s.link">Read the article &rarr;</a>
    </table>
  `,
})
export class ArticleCard {
  readonly category = input('Engineering');
  readonly readingTime = input('6 min read');
  readonly title = input('How we cut our build times in half');
  readonly excerpt = input(
    'A look at the caching, parallelism and dependency changes that took our CI from 22 minutes to under 11.',
  );
  readonly url = input('https://example.com/blog/faster-builds');
  readonly imageUrl = input('https://yshashi.github.io/ng-email/static/article.png');

  protected readonly s = {
    section: { padding: '24px' },
    image: { width: '100%', maxWidth: '552px', height: 'auto', borderRadius: '10px' },
    meta: { margin: '18px 0 6px', fontFamily: FONT, fontSize: '13px', lineHeight: '18px', fontWeight: 600, color: '#4f46e5' },
    title: { margin: '0 0 8px', fontFamily: FONT, fontSize: '22px', lineHeight: '30px', fontWeight: 700, color: '#111827' },
    excerpt: { margin: '0 0 14px', fontFamily: FONT, fontSize: '15px', lineHeight: '24px', color: '#4b5563' },
    link: { fontFamily: FONT, fontSize: '15px', fontWeight: 600, color: '#4f46e5' },
  };
}
