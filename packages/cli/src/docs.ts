import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { DEFAULT_REGISTRY, RegistryError } from './add.js';

/** The website, where the docs are published as Markdown for agents. */
export const DEFAULT_SITE = DEFAULT_REGISTRY.replace(/\/r$/, '');
const FETCH_TIMEOUT_MS = 15_000;
const PAGE = /^[a-z0-9-]+$/;

/** The site URL, or a local folder holding a built site (for offline use and tests). */
export function resolveSite(site?: string): string {
  const value = site ?? process.env['NG_EMAIL_SITE'] ?? DEFAULT_SITE;
  return /^https?:\/\//.test(value) ? value.replace(/\/+$/, '') : resolve(value);
}

async function fetchText(url: string): Promise<string | undefined> {
  if (!/^https?:\/\//.test(url)) {
    const path = join(url);
    return existsSync(path) ? readFile(path, 'utf8') : undefined;
  }
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (error) {
    throw new RegistryError(`Could not reach ${url}: ${(error as Error).message}`);
  }
  if (res.status === 404) return undefined;
  if (!res.ok) throw new RegistryError(`${url} returned HTTP ${res.status}.`);
  return res.text();
}

/** The docs index (llms.txt): every page with a one-line summary. */
export async function fetchDocsIndex(site?: string): Promise<string> {
  const base = resolveSite(site);
  const text = await fetchText(`${base}/llms.txt`);
  if (text === undefined) throw new RegistryError(`No docs index at ${base}/llms.txt.`);
  return text;
}

/** One docs page as Markdown, by slug (for example "styling"). */
export async function fetchDocsPage(page: string, site?: string): Promise<string | undefined> {
  if (!PAGE.test(page)) return undefined;
  return fetchText(`${resolveSite(site)}/docs/${page}.md`);
}

export interface DocsMatch {
  page: string;
  heading: string;
  excerpt: string;
}

/**
 * Searches all docs (llms-full.txt) and returns the sections that mention
 * every word of the query, best matches first.
 */
export async function searchDocs(query: string, site?: string, limit = 5): Promise<DocsMatch[]> {
  const base = resolveSite(site);
  const full = await fetchText(`${base}/llms-full.txt`);
  if (full === undefined) throw new RegistryError(`No docs at ${base}/llms-full.txt.`);
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return [];

  // llms-full.txt separates pages with "<!-- page: slug -->" markers.
  const matches: Array<DocsMatch & { score: number }> = [];
  for (const chunk of full.split(/^<!-- page: /m).slice(1)) {
    const page = chunk.slice(0, chunk.indexOf(' -->'));
    const body = chunk.slice(chunk.indexOf('\n') + 1);
    for (const section of body.split(/^(?=#{1,3} )/m)) {
      const lower = section.toLowerCase();
      if (!words.every((w) => lower.includes(w))) continue;
      const heading = (/^#{1,3} (.+)$/m.exec(section)?.[1] ?? page).trim();
      const score = words.reduce((n, w) => n + lower.split(w).length - 1, 0) + (words.some((w) => heading.toLowerCase().includes(w)) ? 5 : 0);
      matches.push({ page, heading, excerpt: section.trim().slice(0, 1500), score });
    }
  }
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...match }) => match);
}
