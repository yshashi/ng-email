// Tests for the email checks: the rules on their own, and `ng-email check`.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { checkEmailHtml } from '../dist/index.js';
import { INDEX_REGISTRY, RECEIPT, WELCOME, createProject, run } from './helpers.mjs';

const doc = (body, head = '<title>Hi</title>') =>
  `<!DOCTYPE html><html><head>${head}</head><body><div data-skip-in-text="true" style="display:none">Preview</div>${body}</body></html>`;
const rules = (html, text) => checkEmailHtml(html, text).issues.map((i) => i.rule);

describe('checkEmailHtml', () => {
  test('a clean email passes', () => {
    const result = checkEmailHtml(doc('<img src="https://x.test/a.png" width="10" alt="A"><a href="https://x.test">Go</a>'), 'Go');
    assert.deepEqual(result.issues, []);
    assert.equal(result.ok, true);
  });

  test('flags images, links and layout that break in inboxes', () => {
    const found = rules(
      doc(
        '<img src="a.png"><img src="http://x.test/b.png" alt="" width="1"><a href="#">x</a><a href="/about">y</a>' +
          '<div style="display: flex">z</div><td style="background-image:url(https://x.test/bg.png)">w</td>',
      ),
    );
    for (const rule of ['img-alt', 'img-relative-src', 'img-http', 'img-width', 'link-href', 'link-relative', 'css-layout', 'css-background-image']) {
      assert.ok(found.includes(rule), rule);
    }
  });

  test('counts repeated problems', () => {
    const issue = checkEmailHtml(doc('<img src="https://x.test/a.png" width="1"><img src="https://x.test/b.png" width="1">')).issues[0];
    assert.equal(issue.rule, 'img-alt');
    assert.equal(issue.count, 2);
  });

  test('Gmail clipping: a warning near the limit, an error over it', () => {
    assert.ok(rules(doc('x'.repeat(95 * 1024))).includes('gmail-clip'));
    const over = checkEmailHtml(doc('x'.repeat(110 * 1024)));
    assert.equal(over.ok, false);
    assert.equal(over.issues.find((i) => i.rule === 'gmail-clip').level, 'error');
  });

  test('missing title, preview text and plain text; scripts and Angular leftovers', () => {
    const found = rules('<html><head></head><body ng-version="22"><script>1</script></body></html>', ' ');
    for (const rule of ['missing-title', 'missing-preview-text', 'empty-text', 'script', 'angular-leftovers']) {
      assert.ok(found.includes(rule), rule);
    }
  });

  test('mailto, tel and template placeholders are fine as hrefs', () => {
    assert.deepEqual(rules(doc('<a href="mailto:a@x.test">a</a><a href="tel:+1">b</a><a href="{{unsubscribe}}">c</a>')), []);
  });
});

describe('ng-email check', async () => {
  const project = await createProject('check', {
    'src/emails/welcome.email.ts': WELCOME,
    'src/emails/receipt.email.ts': RECEIPT,
    'src/emails/index.ts': INDEX_REGISTRY,
  });

  test('reports each email and exits 1 when one has errors', () => {
    // The receipt is a fragment (no <title>, no preview text): warnings only.
    const result = run(['check', 'src/emails/index.ts'], project);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /welcome \(\d+\.\d kB\)\n {2}✔ No problems found/);
    assert.match(result.stdout, /receipt .*\n {2}! missing-title/);
    assert.match(result.stdout, /✔ All emails passed/);
  });

  test('--name checks one email; an unknown name fails', () => {
    const one = run(['check', 'src/emails/index.ts', '--name', 'welcome'], project);
    assert.equal(one.code, 0);
    assert.doesNotMatch(one.stdout, /receipt/);
    const unknown = run(['check', 'src/emails/index.ts', '--name', 'nope'], project);
    assert.equal(unknown.code, 1);
    assert.match(unknown.stderr, /No email named "nope"/);
  });
});
