import { inject } from '@angular/core';
import { type ResolveFn, Router } from '@angular/router';

import { docLoaders, docSections } from '../generated/docs';
import type { DocPage } from './docs.types';

export { docSections };

/** Every page in reading order (for previous/next links). */
export const docPagesInOrder = docSections.flatMap((s) => s.pages);

export const docTitle = (slug: string | null): string =>
  docPagesInOrder.find((p) => p.slug === slug)?.title ?? 'Docs';

export const docResolver: ResolveFn<DocPage> = (route) => {
  const slug = route.paramMap.get('slug') ?? '';
  const load = docLoaders[slug];
  if (!load) return inject(Router).createUrlTree(['/docs', docPagesInOrder[0]!.slug]) as never;
  return load();
};
