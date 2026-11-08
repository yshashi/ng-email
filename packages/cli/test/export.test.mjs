// End-to-end tests for `ng-email export`.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { INDEX_EXPORTS, INDEX_REGISTRY, RECEIPT, WELCOME, createProject, run } from './helpers.mjs';

describe('ng-email export with a defineEmails registry', async () => {
  const project = await createProject('export-registry', {
    'src/emails/welcome.email.ts': WELCOME,
    'src/emails/receipt.email.ts': RECEIPT,
    'src/emails/index.ts': INDEX_REGISTRY,
  });
  const result = run(['export', 'src/emails/index.ts', '-o', 'out'], project);

  test('writes <name>.html and <name>.txt for every email', async () => {
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /✔ Exported 2 emails to out/);
    assert.deepEqual((await readdir(join(project, 'out'))).sort(), [
      'receipt.html',
      'receipt.txt',
      'welcome.html',
      'welcome.txt',
    ]);
  });

  test('uses the preview inputs', async () => {
    const welcome = await readFile(join(project, 'out/welcome.html'), 'utf8');
    assert.ok(welcome.startsWith('<!DOCTYPE html PUBLIC'));
    assert.match(welcome, /<h1>Welcome, Ada<\/h1>/);
    assert.match(await readFile(join(project, 'out/receipt.txt'), 'utf8'), /Total \$42\.50/);
  });

  test('leaves no bundle behind in the project', () => {
    assert.equal(existsSync(join(project, 'dist')), false);
  });
});

describe('ng-email export without a registry', async () => {
  const project = await createProject('export-exports', {
    'src/emails/welcome.email.ts': WELCOME,
    'src/emails/receipt.email.ts': RECEIPT,
    'src/emails/index.ts': INDEX_EXPORTS,
  });
  const result = run(['export', 'src/emails/index.ts'], project);

  test('falls back to exported components, named after their export', async () => {
    assert.ok(existsSync(join(project, 'out/ReceiptEmail.html')));
    assert.ok(existsSync(join(project, 'out/ReceiptEmail.txt')));
  });

  test('an email that needs inputs fails without preview inputs, and the command exits 1', () => {
    assert.equal(result.code, 1);
    assert.match(result.stderr, /✖ WelcomeEmail: .*(NG0950|required)/i);
    assert.equal(existsSync(join(project, 'out/WelcomeEmail.html')), false);
  });
});

describe('ng-email export errors', () => {
  test('an entry without emails is an error', async () => {
    const project = await createProject('export-empty', { 'src/index.ts': 'export const notAnEmail = 1;\n' });
    const result = run(['export', 'src/index.ts'], project);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /No emails found/);
  });
});
