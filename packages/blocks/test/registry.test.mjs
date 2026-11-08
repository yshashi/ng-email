// Checks the generated registry (run `npm run build -w @ng-email/blocks` first;
// the root `test` script does). These are the guarantees `ng-email add` and
// the website rely on.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { describe, test } from 'node:test';

const root = resolve(import.meta.dirname, '..');
const registryDir = join(root, 'dist/r');
const PUBLIC_ASSET_BASE = 'https://yshashi.github.io/ng-email/static/';
const ALLOWED_IMPORTS = new Set(['@angular/core', '@angular/common', '@ng-email/components']);
const ARTIFACTS =
  /ng-version|ng-server-context|_nghost|_ngcontent|ng-reflect|<nge-|\snge[a-z]+=|<script|<!--(?!\[if|<!\[endif)/i;

const index = JSON.parse(await readFile(join(registryDir, 'index.json'), 'utf8'));
const items = await Promise.all(
  index.items.map(async (meta) => JSON.parse(await readFile(join(registryDir, `${meta.name}.json`), 'utf8'))),
);

describe('registry index', () => {
  test('has the expected blocks and templates', () => {
    assert.equal(index.registryVersion, 1);
    assert.equal(items.filter((i) => i.kind === 'block').length, 21);
    assert.equal(items.filter((i) => i.kind === 'template').length, 5);
  });

  test('names are unique and URL/file safe', () => {
    const names = index.items.map((i) => i.name);
    assert.equal(new Set(names).size, names.length);
    for (const name of names) assert.match(name, /^[a-z0-9][a-z0-9-]*$/);
  });

  test('every entry has a title, description, category, class name and selector', () => {
    for (const item of index.items) {
      for (const key of ['title', 'description', 'category', 'className', 'selector']) {
        assert.ok(item[key], `${item.name} is missing ${key}`);
      }
      assert.match(item.selector, /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/, `${item.name} selector must contain a hyphen`);
    }
  });
});

describe('registry items', () => {
  for (const item of items) {
    describe(item.name, () => {
      test('ships its exact source file under a safe file name', async () => {
        assert.equal(item.files.length, 1);
        assert.match(item.files[0].path, /^[a-z0-9-]+\.ts$/);
        assert.equal(item.files[0].content, await readFile(join(root, 'src', item.file), 'utf8'));
      });

      test('is self-contained: imports only Angular and @ng-email/components', () => {
        const imports = [...item.files[0].content.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
        for (const specifier of imports) {
          assert.ok(ALLOWED_IMPORTS.has(specifier), `${item.name} imports ${specifier}; copied files must stand alone`);
        }
        assert.match(item.files[0].content, new RegExp(`export class ${item.className}\\b`));
        assert.match(item.files[0].content, new RegExp(`selector: '${item.selector}'`));
      });

      test('preview is a clean, complete document', () => {
        assert.ok(item.preview.html.startsWith('<!DOCTYPE html PUBLIC'), 'starts with the XHTML doctype');
        assert.equal(item.preview.html.match(/<html/g)?.length, 1);
        assert.equal(ARTIFACTS.exec(item.preview.html), null);
        assert.ok(item.preview.text.trim().length > 0, 'has plain text');
      });

      test('every referenced image exists in assets/', () => {
        const urls = [...item.files[0].content.matchAll(/https:\/\/yshashi\.github\.io\/ng-email\/static\/([\w.-]+)/g)];
        for (const [, file] of urls) assert.ok(existsSync(join(root, 'assets', file)), `missing assets/${file}`);
        assert.ok(!item.files[0].content.includes('127.0.0.1'), 'no local asset URLs in shipped source');
      });
    });
  }

  test('previews point at the public asset URL unless rebased', () => {
    const withImages = items.filter((i) => i.files[0].content.includes(PUBLIC_ASSET_BASE));
    assert.ok(withImages.length >= 3);
  });
});
