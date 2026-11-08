// End-to-end tests for `ng-email add`, against the real generated registry
// (packages/blocks/dist/r) served from a folder and over HTTP.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { cli, createProject, repo, run, runAsync, write } from './helpers.mjs';

const registry = join(repo, 'packages/blocks/dist/r');
const temps = [];
let server;
let baseUrl;

before(async () => {
  if (!existsSync(join(registry, 'index.json'))) {
    throw new Error('packages/blocks/dist/r is missing: run "npm run build" first.');
  }
  server = createServer(async (req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://x').pathname.split('/').pop());
    const file = join(registry, name);
    if (!/^[\w.-]+\.json$/.test(name) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end(await readFile(file));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/r`;
});

after(async () => {
  server?.close();
  await Promise.all(temps.map((d) => rm(d, { recursive: true, force: true })));
});

async function emptyDir() {
  const dir = await mkdtemp(join(tmpdir(), 'ng-email-add-'));
  temps.push(dir);
  return dir;
}

describe('ng-email add', () => {
  test('--list prints blocks and templates', () => {
    const r = run(['add', '--list', '--registry', registry], repo);
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /Blocks\n {2}header-centered\s+Headers\s+Header with centered menu/);
    assert.match(r.stdout, /Templates\n {2}welcome\s+Onboarding/);
  });

  test('added blocks compile and render inside a user email', async () => {
    const project = await createProject('add', {});
    const added = run(['add', 'header-centered', 'footer-simple', 'welcome', '--registry', registry], project);
    assert.equal(added.code, 0, added.stderr);
    assert.match(added.stdout, /✔ Added header-centered → src\/emails\/blocks\/header-centered\.ts/);
    assert.match(added.stdout, /import \{ HeaderCentered \} from '\.\/src\/emails\/blocks\/header-centered';/);
    assert.match(added.stdout, /<header-centered \/>/);
    assert.doesNotMatch(added.stderr, /Install what the added files import/, 'deps resolve in this project');

    await write(
      join(project, 'src/emails/newsletter.email.ts'),
      `import { Component } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';
import { FooterSimple } from './blocks/footer-simple';
import { HeaderCentered } from './blocks/header-centered';

@Component({
  selector: 'newsletter-email',
  imports: [EMAIL_COMPONENTS, HeaderCentered, FooterSimple],
  template: \`
    <html ngeHtml><head ngeHead></head><body ngeBody>
      <table ngeContainer>
        <header-centered [brand]="'Lumen'" />
        <p ngeText>This month in Lumen.</p>
        <footer-simple />
      </table>
    </body></html>\`,
})
export class NewsletterEmail {}
`,
    );
    await write(
      join(project, 'src/emails/index.ts'),
      "export { NewsletterEmail } from './newsletter.email';\nexport { WelcomeEmail } from './blocks/welcome';\n",
    );
    const build = run(['build', 'src/emails/index.ts', '-o', 'dist/emails.mjs', '--no-dts'], project);
    assert.equal(build.code, 0, build.stderr);

    const render = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const m = await import('./dist/emails.mjs');
         console.log(await m.renderEmail(m.NewsletterEmail));
         console.log(await m.renderEmail(m.WelcomeEmail, { inputs: { name: 'Ada' } }));`,
      ],
      { cwd: project, encoding: 'utf8' },
    );
    assert.equal(render.status, 0, render.stderr);
    assert.match(render.stdout, />Lumen<\/p>/, 'block input was applied');
    assert.match(render.stdout, /Unsubscribe/, 'footer block rendered');
    assert.match(render.stdout, /Welcome aboard, Ada/, 'template rendered');
    assert.doesNotMatch(render.stdout, /<header-centered|<footer-simple|ng-version/);
  });

  test('does not overwrite existing files unless asked', async () => {
    const dir = await emptyDir();
    assert.equal(run(['add', 'divider-label', '--registry', registry, '-d', 'blocks'], dir).code, 0);
    const file = join(dir, 'blocks/divider-label.ts');
    await writeFile(file, '// my edits\n');

    const again = run(['add', 'divider-label', '--registry', registry, '-d', 'blocks'], dir);
    assert.equal(again.code, 1);
    assert.match(again.stderr, /already exists \(use --overwrite\)/);
    assert.equal(await readFile(file, 'utf8'), '// my edits\n');

    assert.equal(run(['add', 'divider-label', '--registry', registry, '-d', 'blocks', '--overwrite'], dir).code, 0);
    assert.match(await readFile(file, 'utf8'), /export class DividerLabel/);
  });

  test('warns when the project does not have the dependencies', async () => {
    const dir = await emptyDir();
    const r = run(['add', 'stats-row', '--registry', registry], dir);
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stderr, /! Install what the added files import: npm install @ng-email\/components/);
  });

  test('works over HTTP, including --list and unknown names', async () => {
    const dir = await emptyDir();
    // runAsync: this test process is also the HTTP server, so it must not block.
    const list = await runAsync(['add', '--list', '--registry', baseUrl], dir);
    assert.equal(list.code, 0, list.stderr);
    assert.match(list.stdout, /pricing-card/);

    const r = await runAsync(['add', 'pricing-card', 'does-not-exist', '--registry', baseUrl], dir);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /✔ Added pricing-card/);
    assert.match(r.stderr, /✖ does-not-exist: not found in http:\/\/127\.0\.0\.1:\d+\/r/);
    assert.ok(existsSync(join(dir, 'src/emails/blocks/pricing-card.ts')));
  });

  test('NG_EMAIL_REGISTRY sets the default registry', async () => {
    const dir = await emptyDir();
    const r = spawnSync(process.execPath, [cli, 'add', 'avatar-group'], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, NG_EMAIL_REGISTRY: registry },
    });
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(dir, 'src/emails/blocks/avatar-group.ts')));
  });

  test('refuses registry entries that would write outside the target folder', async () => {
    const dir = await emptyDir();
    const evil = join(dir, 'evil-registry');
    await mkdir(evil);
    await writeFile(
      join(evil, 'innocent.json'),
      JSON.stringify({ name: 'innocent', files: [{ path: '../../escaped.ts', content: 'boom' }], dependencies: [] }),
    );
    const r = run(['add', 'innocent', '--registry', evil], dir);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /unsafe or invalid file path "\.\.\/\.\.\/escaped\.ts"; refusing to write it/);
    assert.equal(existsSync(join(dir, '..', 'escaped.ts')), false);
    assert.equal(existsSync(join(dir, 'src')), false);
  });

  test('rejects names that are not registry names', async () => {
    const dir = await emptyDir();
    const r = run(['add', '../etc/passwd', '--registry', registry], dir);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /not a valid block name/);
  });

  test('needs at least one name', async () => {
    const r = run(['add', '--registry', registry], await emptyDir());
    assert.equal(r.code, 1);
    assert.match(r.stderr, /name at least one block/);
  });
});
