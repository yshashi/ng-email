import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { type BuildEmailsOptions, buildEmails } from './build.js';
import { type CatalogEntry, type RenderedEmail, loadCatalog } from './catalog.js';
import { type CheckResult, checkEmailHtml } from './check.js';

export interface RenderEntryOptions extends Pick<BuildEmailsOptions, 'entry' | 'cwd' | 'tsconfig' | 'dev'> {
  /** Emails to render, by catalog name. Default: all of them. */
  names?: string[];
  /** Inputs for every rendered email. Default: each email's preview inputs. */
  inputs?: Record<string, unknown>;
}

export interface RenderedEntryEmail extends RenderedEmail {
  name: string;
  check: CheckResult;
}

export interface RenderEntryResult {
  entries: CatalogEntry[];
  rendered: RenderedEntryEmail[];
  failed: Array<{ name: string; error: string }>;
}

/**
 * Builds an entry into a throwaway bundle, then renders and checks emails
 * from it. Nothing is written to the project.
 */
export async function renderEntry(options: RenderEntryOptions): Promise<RenderEntryResult> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const work = await mkdtemp(join(tmpdir(), 'ng-email-render-'));
  try {
    const bundle = join(work, 'emails.mjs');
    await buildEmails({ ...options, cwd, outfile: bundle, dts: false });
    const catalog = await loadCatalog(pathToFileURL(bundle).href);

    const names = options.names ?? catalog.entries.map((e) => e.name);
    const result: RenderEntryResult = { entries: catalog.entries, rendered: [], failed: [] };
    for (const name of names) {
      if (!catalog.has(name)) {
        const known = catalog.entries.map((e) => e.name).join(', ') || 'none';
        result.failed.push({ name, error: `No email named "${name}". Emails in this entry: ${known}.` });
        continue;
      }
      try {
        const email = await catalog.render(name, options.inputs);
        result.rendered.push({ name, ...email, check: checkEmailHtml(email.html, email.text) });
      } catch (error) {
        result.failed.push({ name, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return result;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
