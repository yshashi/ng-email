export interface DocTocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}

/** One rendered docs page (generated from content/docs/<slug>.md). */
export interface DocPage {
  slug: string;
  title: string;
  description: string;
  /** Trusted: generated at build time from Markdown in this repository. */
  html: string;
  toc: DocTocEntry[];
}

export interface DocSection {
  title: string;
  pages: Array<{ slug: string; title: string; description: string }>;
}
