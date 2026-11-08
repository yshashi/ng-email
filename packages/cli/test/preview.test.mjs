// End-to-end tests for `ng-email preview`: the real CLI process, real HTTP,
// real file watching and rebuilds.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import { INDEX_REGISTRY, RECEIPT, WELCOME, cli, createProject, write } from './helpers.mjs';

let project;
let child;
let base;
let output = '';

/** Polls /api/state until `predicate` holds. */
async function waitForState(predicate, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await (await fetch(new URL('/api/state', base))).json();
    if (predicate(last)) return last;
    await sleep(100);
  }
  throw new Error(`state never matched; last: ${JSON.stringify(last)}\n--- cli output ---\n${output}`);
}

function render(name, body) {
  return fetch(new URL(`/api/render/${name}`, base), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

before(async () => {
  project = await createProject('preview', {
    'src/emails/welcome.email.ts': WELCOME,
    'src/emails/receipt.email.ts': RECEIPT,
    'src/emails/index.ts': INDEX_REGISTRY,
  });
  child = spawn(process.execPath, [cli, 'preview', 'src/emails/index.ts', '--port', '0'], { cwd: project });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (d) => (output += d));
  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`preview did not start:\n${output}`)), 60_000);
    child.stdout.on('data', (d) => {
      output += d;
      const match = /ready at (http:\/\/\S+)/.exec(output);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    child.once('exit', (code) => reject(new Error(`preview exited with ${code}:\n${output}`)));
  });
});

after(() => {
  if (child && child.exitCode === null) child.kill('SIGKILL');
});

describe('ng-email preview', () => {
  test('listens on localhost and logs the first build', () => {
    assert.match(base, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    assert.match(output, /✔ Built 2 emails in \d+ ms/);
  });

  test('serves the UI', async () => {
    const res = await fetch(base);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(await res.text(), /<title>ng-email preview<\/title>/);
  });

  test('state lists the registry with inputs and preview inputs', async () => {
    const state = await waitForState((s) => s.status === 'ready');
    assert.equal(state.source, 'registry');
    assert.equal(state.version, 1);
    assert.deepEqual(
      state.entries.map((e) => [e.name, e.component, e.inputs]),
      [
        ['welcome', 'WelcomeEmail', ['name']],
        ['receipt', 'ReceiptEmail', ['lines']],
      ],
    );
    assert.equal(state.entries[0].description, 'Sent after sign-up');
    assert.deepEqual(state.entries[0].previewInputs, { name: 'Ada' });
  });

  test('the event stream sends the current state first', async () => {
    const controller = new AbortController();
    const res = await fetch(new URL('/api/events', base), { signal: controller.signal });
    assert.match(res.headers.get('content-type'), /text\/event-stream/);
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let text = '';
    while (!text.includes('\n\n')) text += (await reader.read()).value;
    controller.abort();
    assert.match(text, /^event: state\ndata: \{"status":"ready"/);
  });

  test('renders with preview inputs, or with inputs from the request', async () => {
    const defaults = await (await render('welcome', {})).json();
    assert.match(defaults.html, /<h1>Welcome, Ada<\/h1>/);
    assert.match(defaults.text, /WELCOME, ADA/);
    assert.equal(typeof defaults.durationMs, 'number');

    const custom = await (await render('welcome', { inputs: { name: 'Grace' } })).json();
    assert.match(custom.html, /<h1>Welcome, Grace<\/h1>/);
  });

  test('/preview/<name> returns the email as a page', async () => {
    const res = await fetch(new URL('/preview/receipt', base));
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(await res.text(), /Total \$42\.50/);
  });

  test('request errors', async () => {
    assert.equal((await render('nope', {})).status, 404);
    assert.equal((await fetch(new URL('/preview/nope', base))).status, 404);
    assert.equal((await render('welcome', '{not json')).status, 400);
    assert.equal((await render('welcome', { inputs: [1] })).status, 400);
    const bad = await render('welcome', { inputs: { nope: 1 } });
    assert.equal(bad.status, 422);
    assert.match((await bad.json()).error, /UNKNOWN_INPUT/);
    assert.equal((await fetch(new URL('/api/unknown', base))).status, 404);
  });

  test('rebuilds when a source file changes', async () => {
    const file = join(project, 'src/emails/welcome.email.ts');
    await write(file, (await readFile(file, 'utf8')).replace('Welcome, {{', 'Hello again, {{'));
    await waitForState((s) => s.status === 'ready' && s.version === 2);
    const body = await (await render('welcome', {})).json();
    assert.match(body.html, /<h1>Hello again, Ada<\/h1>/);
  });

  test('a broken build reports the error and keeps serving the last good build', async () => {
    const file = join(project, 'src/emails/welcome.email.ts');
    const good = await readFile(file, 'utf8');
    await write(file, good.replace('{{ name() }}</h1>', '{{ missing() }}</h1>'));
    const state = await waitForState((s) => s.status === 'error');
    assert.match(state.error, /Angular compilation failed/);
    assert.match(state.error, /missing/);
    assert.doesNotMatch(state.error, /\u001b\[/, 'no terminal colors in the UI error');
    assert.equal(state.version, 2);

    const stillGood = await render('welcome', {});
    assert.equal(stillGood.status, 200);
    assert.match((await stillGood.json()).html, /Hello again, Ada/);
    assert.match(output, /✖ Build failed/);

    await write(file, good);
    const fixed = await waitForState((s) => s.status === 'ready' && s.version === 3);
    assert.equal(fixed.error, null);
  });

  test('stops cleanly on SIGTERM', async () => {
    const exited = new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })));
    child.kill('SIGTERM');
    const { code } = await exited;
    assert.equal(code, 0);
  });
});

describe('ng-email preview when the first build fails', () => {
  test('starts anyway, says there is nothing to show yet, and recovers on save', async () => {
    const broken = WELCOME.replace('{{ name() }}</h1>', '{{ nmae() }}</h1>');
    const dir = await createProject('preview-broken', {
      'src/emails/welcome.email.ts': broken,
      'src/emails/receipt.email.ts': RECEIPT,
      'src/emails/index.ts': INDEX_REGISTRY,
    });
    const proc = spawn(process.execPath, [cli, 'preview', 'src/emails/index.ts', '--port', '0'], { cwd: dir });
    let log = '';
    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (d) => (log += d));
    try {
      const url = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`preview did not start:\n${log}`)), 60_000);
        proc.stdout.on('data', (d) => {
          log += d;
          const match = /ready at (http:\/\/\S+)/.exec(log);
          if (match) {
            clearTimeout(timer);
            resolve(match[1]);
          }
        });
      });
      assert.match(log, /✖ Build failed in \d+ ms\. Nothing to preview yet/);
      assert.doesNotMatch(log, /last good build/);

      const state = await (await fetch(new URL('/api/state', url))).json();
      assert.equal(state.status, 'error');
      assert.equal(state.version, 0);
      const res = await fetch(new URL('/api/render/welcome', url), { method: 'POST', body: '{}' });
      assert.equal(res.status, 503);
      assert.match((await res.json()).error, /nmae/);

      await write(join(dir, 'src/emails/welcome.email.ts'), WELCOME);
      const deadline = Date.now() + 30_000;
      let recovered;
      while (Date.now() < deadline) {
        recovered = await (await fetch(new URL('/api/state', url))).json();
        if (recovered.status === 'ready') break;
        await sleep(100);
      }
      assert.equal(recovered.status, 'ready', log);
      assert.equal(recovered.version, 1);
    } finally {
      proc.kill('SIGKILL');
    }
  });
});
