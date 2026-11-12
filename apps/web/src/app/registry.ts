import { inject } from '@angular/core';
import { type ResolveFn, Router } from '@angular/router';

import { catalog, categories, loaders } from '../generated/catalog';
import type { CatalogEntry, Category, ItemKind, SiteItem } from './registry.types';

export { catalog, categories };

export const blockCategories = (): Category[] => categories.filter((c) => c.kind === 'block');
export const templateEntries = (): CatalogEntry[] => catalog.filter((e) => e.kind === 'template');
export const countOf = (kind: ItemKind): number => catalog.filter((e) => e.kind === kind).length;

export function loadItem(name: string): Promise<SiteItem> {
  const loader = loaders[name];
  if (!loader) throw new Error(`Unknown registry item "${name}"`);
  return loader();
}

/**
 * Resolvers (not component-side loading) so that data is ready before the
 * route renders: prerendered HTML and the hydrating client see the same DOM.
 */
export const categoryResolver: ResolveFn<{ category: Category; items: SiteItem[] }> = async (route) => {
  const category = blockCategories().find((c) => c.slug === route.paramMap.get('category'));
  if (!category) return inject(Router).createUrlTree(['/components']) as never;
  return { category, items: await Promise.all(category.items.map(loadItem)) };
};

export const templateResolver: ResolveFn<SiteItem> = async (route) => {
  const name = route.paramMap.get('name') ?? '';
  if (!templateEntries().some((t) => t.name === name)) {
    return inject(Router).createUrlTree(['/templates']) as never;
  }
  return loadItem(name);
};

export const allTemplatesResolver: ResolveFn<SiteItem[]> = () =>
  Promise.all(templateEntries().map((t) => loadItem(t.name)));

export const homeResolver: ResolveFn<SiteItem> = () => loadItem('welcome');
