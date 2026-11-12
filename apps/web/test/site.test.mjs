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
    assert.match(html, /Angular components in\./);
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

  test('unknown URLs have a client-rendered fallback', () => {
    assert.ok(existsSync(join(out, 'index.csr.html')));
  });

  test('no absolute local paths leak into the build', async () => {
    const files = (await readdir(out, { recursive: true })).filter((f) => f.endsWith('.html'));
    for (const file of files) {
      const html = await readFile(join(out, file), 'utf8');
      assert.doesNotMatch(html, /127\.0\.0\.1|\/Users\/|file:\/\//, file);
    }
  });
});
