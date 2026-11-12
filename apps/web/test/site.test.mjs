// Checks the GitHub Pages build of the website (run `npm run build:pages -w
// @ng-email/web` first; the root `test:web` script does).
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { describe, test } from 'node:test';

const web = resolve(import.meta.dirname, '..');
const out = join(web, 'dist/browser');
const registry = JSON.parse(await readFile(resolve(web, '../../packages/blocks/dist/r/index.json'), 'utf8'));
const blocks = registry.items.filter((i) => i.kind === 'block');
const templates = registry.items.filter((i) => i.kind === 'template');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const blockCategories = [...new Set(blocks.map((b) => slug(b.category)))];

const page = (route) => readFile(join(out, route, 'index.html'), 'utf8');
// docs/index.html is the /docs redirect page.

describe('prerendered pages', () => {
  const routes = [
    '',
    'components',
    'templates',
    ...blockCategories.map((c) => `components/${c}`),
    ...templates.map((t) => `templates/${t.name}`),
  ];

  test(`all ${routes.length} routes exist as static HTML`, () => {
    for (const route of routes) assert.ok(existsSync(join(out, route, 'index.html')), `missing /${route}`);
  });

  test('pages are built for the /ng-email/ base path', async () => {
    for (const route of ['', 'components/headers', 'templates/welcome']) {
      assert.match(await page(route), /<base href="\/ng-email\/">/);
    }
  });

  test('home has the hero, the live welcome preview and the install command', async () => {
    const html = await page('');
    assert.match(html, /<h1[^>]*>Email templates as Angular components<\/h1>/);
    assert.match(html, /srcdoc="[^"]*Welcome aboard, Priya/);
    assert.match(html, /npm install @ng-email\/render @ng-email\/components/);
    assert.match(html, /<title>ng-email: email templates as Angular components<\/title>/);
  });

  test('every block appears on its category page with preview and add command', async () => {
    for (const block of blocks) {
      const html = await page(`components/${slug(block.category)}`);
      assert.match(html, new RegExp(`id="${block.name}"`), `${block.name} section`);
      assert.ok(html.includes(`npx ng-email add ${block.name}`), `${block.name} add command`);
    }
    assert.equal((await page('components/headers')).match(/<iframe/g)?.length, 2, 'two header previews');
  });

  test('each template page has its preview and a page title', async () => {
    for (const t of templates) {
      const html = await page(`templates/${t.name}`);
      assert.match(html, /<iframe[^>]+srcdoc=/);
      assert.ok(html.includes(`<title>${t.title} template · ng-email</title>`), `${t.name} title`);
    }
  });

  test('previews load images from the site, relative to the base path', async () => {
    const html = await page('components/ecommerce');
    assert.match(html, /src=&quot;static\/product\.png&quot;|src="static\/product\.png"/);
    assert.ok(existsSync(join(out, 'static/product.png')));
  });
});

describe('published registry', () => {
  test('the registry ships with the site, for `ng-email add`', async () => {
    const index = JSON.parse(await readFile(join(out, 'r/index.json'), 'utf8'));
    assert.equal(index.items.length, registry.items.length);
    for (const item of registry.items) assert.ok(existsSync(join(out, 'r', `${item.name}.json`)), item.name);
  });

  test('unknown URLs get 404.html: the client-rendered app, under the base path', async () => {
    const notFound = await readFile(join(out, '404.html'), 'utf8');
    assert.equal(notFound, await readFile(join(out, 'index.csr.html'), 'utf8'));
    assert.match(notFound, /<base href="\/ng-email\/">/);
  });

  test('no absolute local paths leak into the build', async () => {
    const files = (await readdir(out, { recursive: true })).filter((f) => f.endsWith('.html'));
    for (const file of files) {
      const html = await readFile(join(out, file), 'utf8');
      assert.doesNotMatch(html, /\/Users\/|file:\/\//, file);
      // The docs legitimately mention the local preview address; nothing else may.
      if (!file.startsWith('docs')) assert.doesNotMatch(html, /127\.0\.0\.1/, file);
    }
  });
});

describe('docs', async () => {
  const nav = JSON.parse(await readFile(join(web, 'content/docs/_nav.json'), 'utf8'));
  const docSlugs = nav.flatMap((s) => s.pages);

  test(`all ${docSlugs.length} docs pages are prerendered with a title`, async () => {
    for (const s of docSlugs) {
      const html = await page(`docs/${s}`);
      assert.match(html, /<title>[^<]+ · ng-email docs<\/title>/, s);
      assert.match(html, /<div class="doc-body"/, s);
    }
  });

  test('/docs redirects to the introduction under the base path', async () => {
    assert.match(await page('docs'), /<meta http-equiv="refresh" content="0; url=\/ng-email\/docs\/introduction">/);
  });

  test('the header links to the docs', async () => {
    assert.match(await page(''), /href="\/ng-email\/docs"[^>]*>Docs</);
  });

  test('every link inside the docs resolves to a prerendered page and section', async () => {
    let checked = 0;
    for (const s of docSlugs) {
      const html = await page(`docs/${s}`);
      const body = html.slice(html.indexOf('class="doc-body"'));
      for (const [, path, fragment] of body.matchAll(/<a href="((?:docs|components|templates)[a-z0-9/-]*)(?:#([a-z0-9-]+))?"/g)) {
        assert.ok(existsSync(join(out, path, 'index.html')), `/docs/${s} links to missing /${path}`);
        if (fragment) {
          assert.match(await page(path), new RegExp(`id="${fragment}"`), `/docs/${s} links to missing /${path}#${fragment}`);
        }
        checked++;
      }
    }
    assert.ok(checked >= 15, `only ${checked} links checked; did the link format change?`);
  });

  test('code blocks are highlighted and copyable; heading anchors stay out of the heading name', async () => {
    const html = await page('docs/sending');
    assert.match(html, /<div class="doc-code"><button type="button" class="doc-copy" data-copy(="")?>Copy<\/button><pre class="shiki/);
    assert.match(html, /<a class="doc-anchor" href="docs\/sending#nodemailer-smtp" aria-hidden="true" tabindex="-1">#<\/a>/);
  });
});

describe('docs for AI agents', async () => {
  const nav = JSON.parse(await readFile(join(web, 'content/docs/_nav.json'), 'utf8'));
  const docSlugs = nav.flatMap((s) => s.pages);

  test('llms.txt indexes every docs page, block and template with absolute links', async () => {
    const llms = await readFile(join(out, 'llms.txt'), 'utf8');
    assert.match(llms, /^# ng-email\n\n> /);
    for (const s of docSlugs) assert.ok(llms.includes(`(https://yshashi.github.io/ng-email/docs/${s}.md)`), s);
    for (const item of registry.items) assert.ok(llms.includes(`npx ng-email add ${item.name}`), item.name);
  });

  test('each docs page is published as Markdown, with site links made absolute', async () => {
    for (const s of docSlugs) assert.ok(existsSync(join(out, 'docs', `${s}.md`)), s);
    const ai = await readFile(join(out, 'docs/ai-agents.md'), 'utf8');
    assert.match(ai, /\]\(https:\/\/yshashi\.github\.io\/ng-email\/docs\/blocks#add-them-with-the-cli\)/);
    assert.doesNotMatch(ai, /\]\(\/docs\//);
  });

  test('llms-full.txt holds every page, marked for search_docs', async () => {
    const full = await readFile(join(out, 'llms-full.txt'), 'utf8');
    for (const s of docSlugs) assert.ok(full.includes(`<!-- page: ${s} -->`), s);
  });
});
