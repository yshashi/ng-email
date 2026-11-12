#!/usr/bin/env node
// Turns content/docs/*.md into prerenderable doc pages:
//
//   src/generated/docs/<slug>.json  { slug, title, description, html, toc }
//   src/generated/docs.ts           navigation (sections → pages) and lazy loaders
//   src/generated/public/           served as-is, for AI agents (llmstxt.org):
//     llms.txt                      index of the docs, blocks and templates
//     llms-full.txt                 every docs page in one file
//     docs/<slug>.md                each page as Markdown
//
// content/docs/_nav.json lists the sections and page slugs in order. Each
// page's title is its first "# " heading; its description is the first
// paragraph. Code fences are highlighted with Shiki (light + dark) and get a
// copy button. Links written as /docs/... become relative to <base href>, so
// they work both locally and under GitHub Pages' /ng-email/ path.
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Marked } from 'marked';
import { createHighlighter } from 'shiki';

const web = resolve(import.meta.dirname, '..');
const contentDir = join(web, 'content/docs');
const outDir = join(web, 'src/generated/docs');
const publicDir = join(web, 'src/generated/public');
/** Where the site is published; Markdown for agents uses absolute links. */
const SITE = 'https://yshashi.github.io/ng-email';

const LANGS = { ts: 'typescript', typescript: 'typescript', 'angular-ts': 'angular-ts', html: 'html', bash: 'bash', sh: 'bash', json: 'json', jsonc: 'jsonc', text: 'text' };

const highlighter = await createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: ['typescript', 'angular-ts', 'html', 'bash', 'json', 'jsonc'],
});

const escapeHtml = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const plain = (s) => s.replace(/<[^>]+>/g, '').replace(/`/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim();
const slugify = (s) => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function renderPage(slug, markdown) {
  const toc = [];
  const ids = new Set();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      code({ text, lang }) {
        const language = LANGS[(lang ?? '').trim()] ?? 'text';
        const html =
          language === 'text'
            ? `<pre class="shiki"><code>${escapeHtml(text)}</code></pre>`
            : highlighter.codeToHtml(text, {
                lang: language,
                themes: { light: 'github-light', dark: 'github-dark' },
                defaultColor: false,
              });
        return `<div class="doc-code"><button type="button" class="doc-copy" data-copy>Copy</button>${html}</div>`;
      },
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        let id = slugify(inner) || `section-${ids.size + 1}`;
        while (ids.has(id)) id += '-x';
        ids.add(id);
        if (depth === 2 || depth === 3) toc.push({ id, text: plain(inner), depth });
        // The "#" is a mouse convenience; keyboard and screen-reader users have the
        // "On this page" list, so keep it out of the heading's name and the tab order.
        return `<h${depth} id="${id}">${inner}<a class="doc-anchor" href="docs/${slug}#${id}" aria-hidden="true" tabindex="-1">#</a></h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        if (/^https?:\/\//.test(href)) {
          return `<a href="${escapeHtml(href)}"${titleAttr} target="_blank" rel="noopener">${text}</a>`;
        }
        // Site-absolute links → relative to <base href> (works under /ng-email/).
        const local = href.startsWith('/') ? href.slice(1) : href;
        return `<a href="${escapeHtml(local)}"${titleAttr}>${text}</a>`;
      },
    },
  });

  const tokens = marked.lexer(markdown);
  const h1 = tokens.findIndex((t) => t.type === 'heading' && t.depth === 1);
  if (h1 === -1) throw new Error(`content/docs/${slug}.md needs a "# Title" heading`);
  const title = plain(tokens[h1].text);
  tokens.splice(h1, 1);
  const lead = tokens.find((t) => t.type === 'paragraph');
  const description = lead ? plain(marked.parseInline(lead.text)) : '';

  let html = marked.parser(tokens);
  html = html.replaceAll('<table>', '<div class="doc-table"><table>').replaceAll('</table>', '</table></div>');
  return { page: { slug, title, description, html, toc }, ids };
}

const nav = JSON.parse(await readFile(join(contentDir, '_nav.json'), 'utf8'));
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const sections = [];
const slugs = [];
const rendered = new Map();
const markdownPages = new Map();
for (const section of nav) {
  const pages = [];
  for (const slug of section.pages) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid doc slug "${slug}"`);
    const markdown = await readFile(join(contentDir, `${slug}.md`), 'utf8');
    const { page, ids } = renderPage(slug, markdown);
    markdownPages.set(slug, markdown);
    rendered.set(slug, { page, ids });
    await writeFile(join(outDir, `${slug}.json`), JSON.stringify(page));
    pages.push({ slug, title: page.title, description: page.description });
    slugs.push(slug);
  }
  sections.push({ title: section.title, pages });
}

// Every internal docs link must point at a page, and a section, that exists.
const SITE_PAGES = new Set(['', 'components', 'templates']);
for (const [slug, { page }] of rendered) {
  for (const [, path, fragment] of page.html.matchAll(/href="([a-z0-9/-]*)(?:#([a-z0-9-]+))?"/g)) {
    const docMatch = /^docs\/([a-z0-9-]+)$/.exec(path);
    if (docMatch) {
      const target = rendered.get(docMatch[1]);
      if (!target) throw new Error(`content/docs/${slug}.md links to missing page /${path}`);
      if (fragment && !target.ids.has(fragment)) {
        throw new Error(`content/docs/${slug}.md links to missing section /${path}#${fragment}`);
      }
    } else if (!SITE_PAGES.has(path) && !path.startsWith('components/') && !path.startsWith('templates/')) {
      throw new Error(`content/docs/${slug}.md has an unknown site link "/${path}"`);
    }
  }
}

const loaders = slugs
  .map((s) => `  '${s}': () => import('./docs/${s}.json').then((m) => m.default as DocPage),`)
  .join('\n');
await writeFile(
  join(web, 'src/generated/docs.ts'),
  `// Generated by scripts/sync-docs.mjs. Do not edit.
import type { DocPage, DocSection } from '../app/docs.types';

export const docSections: DocSection[] = ${JSON.stringify(sections, null, 2)};

export const docLoaders: Record<string, () => Promise<DocPage>> = {
${loaders}
};
`,
);

// ---- Markdown for AI agents -------------------------------------------------
// Site-absolute links become full URLs: an agent reads these files out of context.
const forAgents = (markdown) =>
  markdown.replace(/\]\((\/[^)\s]*)\)/g, (_, path) => `](${SITE}${path})`);

await rm(publicDir, { recursive: true, force: true });
await mkdir(join(publicDir, 'docs'), { recursive: true });
for (const [slug, markdown] of markdownPages) await writeFile(join(publicDir, 'docs', `${slug}.md`), forAgents(markdown));

await writeFile(
  join(publicDir, 'llms-full.txt'),
  `# ng-email documentation\n\nEvery page of ${SITE}/docs, in reading order.\n\n` +
    slugs.map((slug) => `<!-- page: ${slug} -->\n${forAgents(markdownPages.get(slug)).trim()}\n`).join('\n'),
);

const registryIndex = join(web, '../../packages/blocks/dist/r/index.json');
const items = existsSync(registryIndex) ? JSON.parse(await readFile(registryIndex, 'utf8')).items : [];
const itemLine = (i) => `- [${i.title}](${SITE}/r/${i.name}.json): ${i.description} Add with \`npx ng-email add ${i.name}\`.`;
const llms = `# ng-email

> Build HTML emails as standalone Angular components. ng-email renders them to the table-based, inline-styled HTML that Gmail, Outlook and Apple Mail expect, with a plain-text version alongside.

Packages: \`@ng-email/render\` (renderEmail, renderEmailBoth, defineEmails), \`@ng-email/components\` (EMAIL_COMPONENTS: ngeHtml, ngeHead, ngeBody, nge-preview, ngeContainer, ngeSection, ngeRow, ngeColumn, ngeText, ngeHeading, ngeLink, ngeButton, ngeImg, ngeHr, nge-font) and \`@ng-email/cli\` (ng-email build, preview, export, check, add, mcp). Requires Angular 22.

Rules that matter: lay out with tables (table ngeContainer, table ngeRow + td ngeColumn), never flexbox or grid; put styles in [ngeStyle], never in component styles; make per-recipient values signal inputs; use absolute https URLs and alt text on images.

AI agents: run the MCP server with \`npx -y @ng-email/cli mcp\`, or install the agent skill with \`npx skills add yshashi/ng-email\`. See ${SITE}/docs/ai-agents.md.

${sections.map((section) => `## ${section.title}\n\n${section.pages.map((p) => `- [${p.title}](${SITE}/docs/${p.slug}.md): ${p.description}`).join('\n')}`).join('\n\n')}
${items.length ? `
## Templates

${items.filter((i) => i.kind === 'template').map(itemLine).join('\n')}

## Blocks

${items.filter((i) => i.kind === 'block').map(itemLine).join('\n')}
` : ''}
## Optional

- [All docs in one file](${SITE}/llms-full.txt)
- [Registry index](${SITE}/r/index.json): every block and template as JSON
`;
await writeFile(join(publicDir, 'llms.txt'), llms);

console.log(`✔ Docs: ${slugs.length} pages in ${sections.length} sections, plus llms.txt and Markdown copies`);
