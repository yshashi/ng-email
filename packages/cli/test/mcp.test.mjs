// End-to-end tests for `ng-email mcp`: a real MCP client talks to the server
// over stdio, against the generated block registry and a docs fixture.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { INDEX_REGISTRY, RECEIPT, WELCOME, cli, createProject, repo, write } from './helpers.mjs';

const registry = join(repo, 'packages/blocks/dist/r');

/** An email with problems the checks must catch. */
const BROKEN = `import { Component } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

@Component({
  selector: 'broken-email',
  imports: [EMAIL_COMPONENTS],
  template: \`
    <html ngeHtml>
      <head ngeHead></head>
      <body ngeBody>
        <table ngeContainer>
          <img src="logo.png" />
          <p ngeText [ngeStyle]="{ display: 'flex' }">Hi</p>
          <a ngeLink href="#">Read more</a>
        </table>
      </body>
    </html>\`,
})
export class BrokenEmail {}
`;

const text = (result) => result.content.map((c) => c.text).join('\n');

describe('ng-email mcp', async () => {
  const project = await createProject('mcp', {
    'src/emails/welcome.email.ts': WELCOME,
    'src/emails/receipt.email.ts': RECEIPT,
    'src/emails/index.ts': INDEX_REGISTRY,
    'src/broken/broken.email.ts': BROKEN,
    'src/broken/index.ts': "export { BrokenEmail } from './broken.email';\n",
  });
  const site = join(project, 'site');
  await write(join(site, 'llms.txt'), '# ng-email\n\n- [Styling](https://example.com/docs/styling.md): Inline styles.\n');
  await write(join(site, 'docs/styling.md'), '# Styling\n\nUse ngeStyle for every style.\n');
  await write(
    join(site, 'llms-full.txt'),
    '# docs\n\n<!-- page: styling -->\n# Styling\n\n## Outlook notes\n\nOutlook ignores border-radius on buttons.\n\n<!-- page: sending -->\n# Sending\n\nUse Resend or SES.\n',
  );

  let client;
  before(async () => {
    assert.ok(existsSync(join(registry, 'index.json')), 'build packages/blocks first');
    client = new Client({ name: 'ng-email-test', version: '0.0.0' });
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: [cli, 'mcp'],
        cwd: project,
        env: { ...process.env, NG_EMAIL_REGISTRY: registry, NG_EMAIL_SITE: site },
        stderr: 'pipe',
      }),
    );
  });
  after(() => client?.close());

  test('offers every tool, with instructions for the agent', async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), [
      'add_blocks',
      'check_email',
      'get_block',
      'get_docs',
      'list_blocks',
      'list_emails',
      'render_email',
      'search_docs',
    ]);
    assert.equal(tools.find((t) => t.name === 'get_block').annotations.readOnlyHint, true);
    assert.equal(tools.find((t) => t.name === 'add_blocks').annotations.readOnlyHint, false);
    assert.match(client.getInstructions(), /ngeStyle/);
  });

  test('list_blocks filters by kind and words', async () => {
    const all = JSON.parse(text(await client.callTool({ name: 'list_blocks', arguments: {} })));
    assert.ok(all.length >= 20);
    const receipts = JSON.parse(text(await client.callTool({ name: 'list_blocks', arguments: { kind: 'template', query: 'receipt' } })));
    assert.deepEqual(receipts.map((i) => i.name), ['receipt']);
  });

  test('get_block returns the source and how to use it, without writing files', async () => {
    const result = await client.callTool({ name: 'get_block', arguments: { name: 'button-pair' } });
    assert.match(text(result), /export class ButtonPair/);
    assert.match(text(result), /<button-pair \/>/);
    assert.equal(existsSync(join(project, 'src/emails/blocks')), false);
    const missing = await client.callTool({ name: 'get_block', arguments: { name: 'no-such-block' } });
    assert.equal(missing.isError, true);
  });

  test('add_blocks writes the files into the project', async () => {
    const result = await client.callTool({ name: 'add_blocks', arguments: { names: ['footer-simple'] } });
    assert.equal(result.isError, undefined, text(result));
    assert.match(text(result), /Added footer-simple: src\/emails\/blocks\/footer-simple\.ts/);
    assert.match(await readFile(join(project, 'src/emails/blocks/footer-simple.ts'), 'utf8'), /export class/);
    const again = await client.callTool({ name: 'add_blocks', arguments: { names: ['footer-simple'] } });
    assert.equal(again.isError, true, 'never overwrites without overwrite: true');
  });

  test('list_emails compiles the entry and lists its emails', async () => {
    const entries = JSON.parse(text(await client.callTool({ name: 'list_emails', arguments: { entry: 'src/emails/index.ts' } })));
    assert.deepEqual(entries.map((e) => e.name), ['welcome', 'receipt']);
    assert.deepEqual(entries[0].previewInputs, { name: 'Ada' });
  });

  test('render_email renders with preview inputs or given inputs, and checks the result', async () => {
    const preview = text(await client.callTool({ name: 'render_email', arguments: { entry: 'src/emails/index.ts', name: 'welcome' } }));
    assert.match(preview, /WELCOME, ADA/, 'the plain text uppercases headings');
    assert.match(preview, /No problems found/);
    assert.doesNotMatch(preview, /<!DOCTYPE/, 'text only by default');

    const custom = text(
      await client.callTool({
        name: 'render_email',
        arguments: { entry: 'src/emails/index.ts', name: 'welcome', inputs: { name: 'Grace' }, output: 'html' },
      }),
    );
    assert.match(custom, /<h1>Welcome, Grace<\/h1>/);
  });

  test('check_email reports inbox problems as a tool error', async () => {
    const result = await client.callTool({ name: 'check_email', arguments: { entry: 'src/broken/index.ts' } });
    assert.equal(result.isError, true);
    const report = text(result);
    for (const rule of ['img-alt', 'img-relative-src', 'link-href', 'css-layout', 'missing-title', 'missing-preview-text']) {
      assert.match(report, new RegExp(rule), rule);
    }
  });

  test('compile errors come back as tool errors, not crashes', async () => {
    await write(join(project, 'src/bad/index.ts'), "export const x: number = 'not a number';\n");
    const result = await client.callTool({ name: 'render_email', arguments: { entry: 'src/bad/index.ts' } });
    assert.equal(result.isError, true);
    assert.match(text(result), /not assignable|TS2322/);
    // The server is still alive.
    assert.ok((await client.listTools()).tools.length > 0);
  });

  test('get_docs and search_docs read the published docs', async () => {
    assert.match(text(await client.callTool({ name: 'get_docs', arguments: {} })), /\[Styling\]/);
    assert.match(text(await client.callTool({ name: 'get_docs', arguments: { page: 'styling' } })), /Use ngeStyle/);
    assert.equal((await client.callTool({ name: 'get_docs', arguments: { page: '../etc/passwd' } })).isError, true);
    const found = text(await client.callTool({ name: 'search_docs', arguments: { query: 'outlook border-radius' } }));
    assert.match(found, /## Outlook notes \(page: styling\)/);
  });
});
