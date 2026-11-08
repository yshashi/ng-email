import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { XHTML_TRANSITIONAL_DOCTYPE, renderEmailBoth } from '@ng-email/render';

import { WelcomeEmail } from './fixtures';

const ARTIFACTS =
  /ng-version|ng-server-context|_nghost|_ngcontent|ng-reflect|\sngh=|<script|<nge-|\snge[a-z]+|<!--(?!\[if|<!\[endif)/i;

describe('full email built from every v1 component', async () => {
  const { html, text } = await renderEmailBoth(WelcomeEmail, {
    inputs: { name: 'Ada', url: 'https://example.com/confirm?t=abc' },
  });

  // NGE_PRINT=1 npm test → dump the rendered email for eyeballing.
  if (process.env['NGE_PRINT']) {
    console.log(`\n${html.replace(/(?:&nbsp;|[ ​-‍﻿])+/g, '[filler]')}\n\n${text}\n`);
  }

  test('no Angular artifacts', () => {
    assert.equal(ARTIFACTS.exec(html), null, html);
  });

  test('one document: doctype, html, head with metas + title + font, body', () => {
    assert.ok(html.startsWith(`${XHTML_TRANSITIONAL_DOCTYPE}<html lang="en" dir="ltr"><head>`), html.slice(0, 200));
    for (const tag of ['<html', '<head>', '<body', '</body>', '</html>']) {
      assert.equal(html.split(tag).length - 1, 1, `${tag} appears exactly once`);
    }
    assert.match(
      html,
      /<head><meta http-equiv="Content-Type" content="text\/html; charset=UTF-8"><meta name="x-apple-disable-message-reformatting"><title>Welcome to Acme<\/title><style>@font-face\{font-family:'Inter';[^<]*<\/style><\/head>/,
    );
  });

  test('preview text is the first thing in the body cell', () => {
    assert.match(html, /<td style="background-color:#f6f9fc;margin:0" lang="en" dir="ltr"><div data-skip-in-text="true" style="display:none;[^"]*">Confirm your email, Ada<div>/);
  });

  test('Outlook button hacks survive the whole pipeline', () => {
    assert.equal(html.match(/<!--\[if mso\]>/g)?.length, 2);
    assert.match(html, /href="https:\/\/example\.com\/confirm\?t=abc"/);
  });

  test('plain text: no preheader, no images, link printed once without brackets', () => {
    assert.doesNotMatch(text, /Confirm your email, Ada/);
    assert.doesNotMatch(text, /logo\.png/);
    assert.match(text, /WELCOME, ADA/);
    assert.match(text, /Confirm email https:\/\/example\.com\/confirm\?t=abc/);
    assert.doesNotMatch(text, /\[http/);
    assert.match(text, /© Acme Inc\./);
  });
});
