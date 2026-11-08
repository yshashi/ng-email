// End-to-end tests for `ng-email build`.
//
// The bundle built for a sample project is copied into an empty temp
// directory outside the repo and imported from plain `node`: no node_modules,
// no Angular CLI, no runtime compiler. That is the regression test for spike
// failure 1.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { pathToFileURL } from 'node:url';

import { INDEX_EXPORTS, RECEIPT, WELCOME, createProject, repo, run as runIn, write } from './helpers.mjs';

let project;
const run = (args) => runIn(args, project);
const temps = [];

/** Copies a bundle into an empty temp dir and renders from it in a fresh `node` process. */
async function renderIsolated(bundle, script) {
  const dir = await mkdtemp(join(tmpdir(), 'ng-email-e2e-'));
  temps.push(dir);
  const target = join(dir, 'emails.mjs');
  await copyFile(bundle, target);
  const code = `const m = await import(${JSON.stringify(pathToFileURL(target).href)});\n${script}`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: dir, encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, dir };
}

before(async () => {
  project = await createProject('build', {
    'src/emails/welcome.email.ts': WELCOME,
    'src/emails/receipt.email.ts': RECEIPT,
    'src/emails/index.ts': INDEX_EXPORTS,
  });
});

after(async () => {
  await Promise.all(temps.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('ng-email build (production)', () => {
  let build;
  before(() => {
    build = run(['build', 'src/emails/index.ts', '-o', 'dist/emails.mjs']);
  });

  test('succeeds and reports the output', () => {
    assert.equal(build.code, 0, build.stderr);
    assert.match(build.stdout, /✔ Built dist\/emails\.mjs \([\d.]+ kB, Angular production mode\)/);
    assert.match(build.stdout, /types: dist\/emails\.d\.mts/);
  });

  test('bundle is fully linked and self-contained', async () => {
    const code = await readFile(join(project, 'dist/emails.mjs'), 'utf8');
    assert.doesNotMatch(code, /ɵɵngDeclare/, 'no partial declarations left');
    assert.doesNotMatch(code, /from ["']@angular\//, 'Angular is bundled, not imported');
    assert.doesNotMatch(code, /from ["']@ng-email\//, '@ng-email is bundled, not imported');
  });

  test('renders from an empty directory with plain node, in production mode', async () => {
    const r = await renderIsolated(
      join(project, 'dist/emails.mjs'),
      `const html = await m.renderEmail(m.WelcomeEmail, { inputs: { name: 'Ada' } });
       const { text } = await m.renderEmailBoth(m.ReceiptEmail, {
         inputs: { lines: [{ name: 'Mug', price: 12.5 }, { name: 'Tea', price: 30 }] },
       });
       console.log(JSON.stringify({ html, text }));`,
    );
    assert.equal(r.code, 0, r.stderr);
    assert.equal(existsSync(join(r.dir, 'node_modules')), false);
    assert.doesNotMatch(r.stdout + r.stderr, /development mode/i);

    const { html, text } = JSON.parse(r.stdout);
    assert.ok(html.startsWith('<!DOCTYPE html PUBLIC'), html.slice(0, 80));
    assert.match(html, /<h1>Welcome, Ada<\/h1>/);
    assert.match(html, /<!--\[if mso\]><i style="mso-font-width:500%;mso-text-raise:18px" hidden>/);
    assert.doesNotMatch(html, /ng-version|<nge-|_ngcontent|<script/);
    assert.match(text, /Mug: \$12\.50/);
    assert.match(text, /Total \$42\.50/);
  });

  test('render errors keep their type and the real class name through the bundle', async () => {
    const r = await renderIsolated(
      join(project, 'dist/emails.mjs'),
      `try { await m.renderEmail(m.WelcomeEmail, { inputs: { nope: 1 } }); }
       catch (e) { console.log(e instanceof m.EmailRenderError, e.code, m.WelcomeEmail.name); }`,
    );
    assert.equal(r.stdout.trim(), 'true UNKNOWN_INPUT WelcomeEmail');
  });

  test('type declarations point at the email sources and the render API', async () => {
    const dts = await readFile(join(project, 'dist/emails.d.mts'), 'utf8');
    assert.match(dts, /export \* from '\.\.\/src\/emails\/index\.js';/);
    assert.match(dts, /export \{ renderEmail, renderEmailText, renderEmailBoth, toPlainText, EmailRenderError, XHTML_TRANSITIONAL_DOCTYPE, defineEmail, defineEmails, describeEmailComponent, isEmailComponent \} from '@ng-email\/render';/);
  });

  test('consumers get type-checked inputs from the declarations', async () => {
    await write(
      join(project, 'consumer.ts'),
      `import { renderEmail, WelcomeEmail } from './dist/emails.mjs';
       void renderEmail(WelcomeEmail, { inputs: { name: 'Ada' } });
       // @ts-expect-error name must be a string
       void renderEmail(WelcomeEmail, { inputs: { name: 42 } });\n`,
    );
    const tsc = spawnSync(
      process.execPath,
      [
        join(repo, 'node_modules/typescript/bin/tsc'),
        '--ignoreConfig',
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--target', 'ES2022',
        '--module', 'ES2022',
        '--moduleResolution', 'bundler',
        '--lib', 'ES2022,DOM',
        'consumer.ts',
      ],
      { cwd: project, encoding: 'utf8' },
    );
    assert.equal(tsc.status, 0, tsc.stdout + tsc.stderr);
  });
});

describe('ng-email build options', () => {
  test('--dev keeps Angular dev mode', async () => {
    const build = run(['build', 'src/emails/index.ts', '-o', 'dist/dev.mjs', '--dev', '--no-dts']);
    assert.equal(build.code, 0, build.stderr);
    assert.match(build.stdout, /Angular development mode/);
    assert.equal(existsSync(join(project, 'dist/dev.d.mts')), false);
    const r = await renderIsolated(
      join(project, 'dist/dev.mjs'),
      "await m.renderEmail(m.WelcomeEmail, { inputs: { name: 'Ada' } });",
    );
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /development mode/i);
  });

  test('--external leaves a dependency as a runtime import', async () => {
    const build = run(['build', 'src/emails/index.ts', '-o', 'dist/ext.mjs', '--external', 'html-to-text', '--no-dts']);
    assert.equal(build.code, 0, build.stderr);
    assert.match(await readFile(join(project, 'dist/ext.mjs'), 'utf8'), /from ["']html-to-text["']/);
  });

  test('Angular packages cannot be made external', () => {
    const build = run(['build', 'src/emails/index.ts', '--external', '@angular/core']);
    assert.equal(build.code, 1);
    assert.match(build.stderr, /"@angular\/core" cannot be external/);
  });

  test('--minify shrinks the bundle', async () => {
    const plain = run(['build', 'src/emails/index.ts', '-o', 'dist/plain.mjs', '--no-dts']);
    const small = run(['build', 'src/emails/index.ts', '-o', 'dist/min.mjs', '--minify', '--no-dts']);
    assert.equal(plain.code, 0, plain.stderr);
    assert.equal(small.code, 0, small.stderr);
    const size = async (f) => (await readFile(join(project, f))).length;
    assert.ok((await size('dist/min.mjs')) < (await size('dist/plain.mjs')) * 0.7);
  });
});

describe('ng-email build errors', () => {
  test('template type errors fail the build with the diagnostic', async () => {
    await write(
      join(project, 'src/broken/broken.email.ts'),
      `import { Component } from '@angular/core';
@Component({ selector: 'broken-email', template: '<p>{{ missing() }}</p>' })
export class BrokenEmail {}
`,
    );
    const build = run(['build', 'src/broken/broken.email.ts', '-o', 'dist/broken.mjs']);
    assert.equal(build.code, 1);
    assert.match(build.stderr, /✖ Angular compilation failed with 1 error/);
    assert.match(build.stderr, /missing/);
    assert.equal(existsSync(join(project, 'dist/broken.mjs')), false);
  });

  test('a missing entry is reported', () => {
    const build = run(['build', 'src/nope.ts']);
    assert.equal(build.code, 1);
    assert.match(build.stderr, /Entry not found: src\/nope\.ts/);
  });

  test('usage errors', () => {
    assert.equal(run(['build']).code, 1);
    assert.match(run(['frobnicate']).stderr, /Unknown command "frobnicate"/);
    assert.match(run(['build', 'a.ts', '--wat']).stderr, /Unknown option '--wat'/);
    assert.equal(run(['--help']).code, 0);
  });
});
