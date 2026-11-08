import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { type BuildEmailsOptions, buildEmails } from './build.js';
import { loadCatalog } from './catalog.js';

export interface ExportEmailsOptions extends Pick<BuildEmailsOptions, 'entry' | 'cwd' | 'tsconfig' | 'dev'> {
  /** Directory for `<name>.html` and `<name>.txt`. Default `out`. */
  outdir?: string;
}

export interface ExportEmailsResult {
  outdir: string;
  written: string[];
  failed: Array<{ name: string; error: string }>;
}

/**
 * Builds the entry, then renders every email (with its preview inputs) to
 * static `.html` and `.txt` files, for CI artifacts, diffing or upload.
 */
export async function exportEmails(options: ExportEmailsOptions): Promise<ExportEmailsResult> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const outdir = resolve(cwd, options.outdir ?? 'out');
  const work = await mkdtemp(join(tmpdir(), 'ng-email-export-'));

  try {
    const bundle = join(work, 'emails.mjs');
    await buildEmails({ ...options, cwd, outfile: bundle, dts: false });
    const catalog = await loadCatalog(pathToFileURL(bundle).href);

    await mkdir(outdir, { recursive: true });
    const result: ExportEmailsResult = { outdir, written: [], failed: [] };
    for (const entry of catalog.entries) {
      try {
        const { html, text } = await catalog.render(entry.name);
        const htmlFile = join(outdir, `${entry.name}.html`);
        const textFile = join(outdir, `${entry.name}.txt`);
        await writeFile(htmlFile, html);
        await writeFile(textFile, text);
        result.written.push(htmlFile, textFile);
      } catch (error) {
        result.failed.push({ name: entry.name, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return result;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
