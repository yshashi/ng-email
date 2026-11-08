#!/usr/bin/env node
// Dev aid: writes dist/contact-sheet.html showing every rendered preview, so
// blocks can be eyeballed together before the website exists.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const out = join(resolve(import.meta.dirname, '..'), 'dist');
const { items } = JSON.parse(await readFile(join(out, 'r', 'index.json'), 'utf8'));
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

await mkdir(join(out, 'preview'), { recursive: true });

let cards = '';
for (const meta of items) {
  const item = JSON.parse(await readFile(join(out, 'r', `${meta.name}.json`), 'utf8'));
  // One page per item too, for reviewing a single block at full size.
  await writeFile(join(out, 'preview', `${meta.name}.html`), item.preview.html);
  cards +=
    `<section><h2>${escape(meta.category)} · ${escape(meta.title)} <code>${escape(meta.name)}</code></h2>` +
    // allow-same-origin (no scripts) only so the frame can be measured: this is a local dev page.
    `<iframe sandbox="allow-same-origin" srcdoc="${escape(item.preview.html)}" onload="this.style.height='0';this.style.height=(this.contentDocument?.documentElement?.scrollHeight||400)+'px'"></iframe></section>`;
}

await writeFile(
  join(out, 'contact-sheet.html'),
  `<!doctype html><meta charset="utf-8"><title>ng-email blocks</title>
<style>body{font:14px system-ui;margin:0;padding:16px;background:#e5e7eb}section{margin:0 auto 20px;max-width:680px}
h2{font-size:13px;color:#374151;margin:0 0 6px}code{color:#6b7280}iframe{width:100%;height:320px;border:0;border-radius:8px;background:#f3f4f6}</style>
${cards}`,
);
console.log(`✔ ${join('dist', 'contact-sheet.html')} (${items.length} items)`);
