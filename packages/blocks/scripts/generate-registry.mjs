#!/usr/bin/env node
// Renders every block and template into the JSON registry that the website
// and `ng-email add` consume:
//
//   dist/r/index.json      catalog: name, title, description, category, kind
//   dist/r/<name>.json     source file(s) + rendered preview HTML and text
//   dist/static/*          images referenced by blocks
//
// Uses the same pipeline users get: buildEmails (AOT + linker) → loadCatalog.
// Usage: node scripts/generate-registry.mjs [--asset-base <url>]
//   --asset-base rewrites the public image URL in *preview* HTML only (for
//   local previews before the site is deployed). Source files are untouched.
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

import { buildEmails, loadCatalog } from '@ng-email/cli';

export const PUBLIC_ASSET_BASE = 'https://yshashi.github.io/ng-email/static/';
const REGISTRY_VERSION = 1;

const { values } = parseArgs({ options: { 'asset-base': { type: 'string' } } });
const root = resolve(import.meta.dirname, '..');
const out = join(root, 'dist');
const work = await mkdtemp(join(tmpdir(), 'ng-email-blocks-'));

/** Fragments (blocks) are previewed inside a 600px email container, like they are used. */
function previewDocument(fragment) {
  return (
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
    '<html lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"></head>' +
    '<body style="margin:0;padding:24px 12px;background-color:#f3f4f6">' +
    '<table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" ' +
    'style="max-width:600px;background-color:#ffffff;border-radius:8px"><tbody><tr><td>' +
    fragment +
    '</td></tr></tbody></table></body></html>'
  );
}

try {
  const bundle = join(work, 'blocks.mjs');
  await buildEmails({
    entry: join(root, 'src/registry.ts'),
    tsconfig: join(root, 'tsconfig.json'),
    outfile: bundle,
    cwd: root,
    dts: false,
  });
  const { catalog } = await import(pathToFileURL(bundle).href);
  const rendered = await loadCatalog(pathToFileURL(bundle).href);

  await rm(out, { recursive: true, force: true });
  await mkdir(join(out, 'r'), { recursive: true });

  const index = [];
  for (const meta of catalog) {
    const { html, text } = await rendered.render(meta.name);
    let preview = meta.kind === 'block' ? previewDocument(html) : html;
    if (values['asset-base']) preview = preview.replaceAll(PUBLIC_ASSET_BASE, values['asset-base']);

    const source = await readFile(join(root, 'src', meta.file), 'utf8');
    const item = {
      registryVersion: REGISTRY_VERSION,
      ...meta,
      dependencies: ['@ng-email/components'],
      files: [{ path: basename(meta.file), content: source }],
      preview: { html: preview, text },
    };
    await writeFile(join(out, 'r', `${meta.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
    index.push(meta);
  }
  await writeFile(
    join(out, 'r', 'index.json'),
    `${JSON.stringify({ registryVersion: REGISTRY_VERSION, items: index }, null, 2)}\n`,
  );
  if (existsSync(join(root, 'assets'))) await cp(join(root, 'assets'), join(out, 'static'), { recursive: true });

  const blocks = index.filter((i) => i.kind === 'block').length;
  console.log(`✔ Registry: ${blocks} blocks, ${index.length - blocks} templates → ${join('dist', 'r')}`);
} finally {
  await rm(work, { recursive: true, force: true });
}
