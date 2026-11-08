import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Button } from './button.component.js';
import { renderEmail, renderRaw } from './render-email.js';

const inputs = { href: 'https://example.com/confirm', label: 'Confirm email' };

test('renderEmail(Button, { href, label }) without a browser', async () => {
  const html = await renderEmail(Button, inputs);
  console.log('\n--- CLEAN ---\n' + html);

  // Required by the brief
  assert.match(html, /<a\b[^>]*href="https:\/\/example\.com\/confirm"/);
  assert.ok(!html.includes('ng-version'), 'ng-version must be removed');
  assert.ok(!/<script\b/i.test(html), 'no <script> tags allowed');

  // Extra observations (not part of the pass/fail bar in the brief)
  assert.ok(html.includes('Confirm email'));
  assert.ok(html.includes('<!--[if mso]>'), 'MSO conditional comment kept');
  assert.ok(!/ngemailbutton|ng-container|ng-server-context/i.test(html), 'Angular artifacts removed');
});

test('raw platform-server output (to document Ivy artifacts)', async () => {
  const raw = await renderRaw(Button, inputs);
  console.log('\n--- RAW ---\n' + raw);
  assert.ok(raw.includes('ng-version'), 'raw output carries ng-version on the root host');
});

// No runtime compiler: nothing here imports @angular/compiler. If any class
// needed JIT, Angular would throw "needs to be compiled using the JIT compiler".
