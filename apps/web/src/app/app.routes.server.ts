import { RenderMode, type ServerRoute } from '@angular/ssr';

import { categories } from '../generated/catalog';
import { docSections } from '../generated/docs';

/** Every page is prerendered to static HTML at build time (GitHub Pages has no server). */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'components', renderMode: RenderMode.Prerender },
  { path: 'templates', renderMode: RenderMode.Prerender },
  {
    path: 'components/:category',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      categories.filter((c) => c.kind === 'block').map((c) => ({ category: c.slug })),
  },
  {
    path: 'templates/:name',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      categories.filter((c) => c.kind === 'template').flatMap((c) => c.items.map((name) => ({ name }))),
  },
  { path: 'docs', renderMode: RenderMode.Prerender },
  {
    path: 'docs/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => docSections.flatMap((s) => s.pages.map((p) => ({ slug: p.slug }))),
  },
  // Unknown URLs: client-rendered fallback (served as 404.html on GitHub Pages).
  { path: '**', renderMode: RenderMode.Client },
];
