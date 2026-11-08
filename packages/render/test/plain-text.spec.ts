import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { renderEmailBoth, renderEmailText, toPlainText } from '../src/public-api';
import { TestText } from './fixtures';

describe('plain text', () => {
  test('skips images and data-skip-in-text, formats links without brackets', async () => {
    const text = await renderEmailText(TestText);
    assert.doesNotMatch(text, /Preheader/);
    assert.doesNotMatch(text, /Logo|logo\.png/);
    assert.match(text, /Hello Ada/);
    assert.match(text, /Open dashboard https:\/\/example\.com\/a/);
    assert.doesNotMatch(text, /\[https/);
  });

  test('hides the href when it equals the link text', async () => {
    const text = await renderEmailText(TestText);
    assert.equal(text.match(/https:\/\/example\.com\/b/g)?.length, 1);
  });

  test('custom selectors are appended to the defaults, not replacing them', () => {
    const text = toPlainText('<img src="a.png" alt="A"><h2>Title</h2><p>x</p>', {
      selectors: [{ selector: 'h2', options: { uppercase: false } }],
    });
    assert.doesNotMatch(text, /a\.png/);
    assert.match(text, /Title/);
    assert.doesNotMatch(text, /TITLE/);
  });

  test('renderEmailBoth returns matching html and text from one render', async () => {
    const { html, text } = await renderEmailBoth(TestText);
    assert.match(html, /<p>Hello Ada<\/p>/);
    assert.match(text, /Hello Ada/);
  });
});
