export type ItemKind = 'block' | 'template';

/** Lightweight listing data, bundled with the app. */
export interface CatalogEntry {
  name: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  kind: ItemKind;
  className: string;
  selector: string;
  fileName: string;
}

/** Full page data for one item, loaded lazily per page. */
export interface SiteItem extends CatalogEntry {
  source: string;
  /** Shiki output (trusted: generated at build time from our own sources). */
  sourceHighlighted: string;
  /** Rendered email with images pointing at the site's static/ folder. */
  html: string;
  /** Rendered email exactly as `ng-email` produced it (public image URLs). */
  htmlOriginal: string;
  htmlHighlighted: string;
  text: string;
  htmlBytes: number;
}

export interface Category {
  kind: ItemKind;
  name: string;
  slug: string;
  items: string[];
}
