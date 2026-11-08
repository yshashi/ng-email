import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { cleanupEmailHtml, isOutlookConditionalComment } from '../src/public-api';

describe('isOutlookConditionalComment', () => {
  for (const data of ['[if mso]><i>x</i><![endif]', '[if !mso]><!', '<![endif]', '[if gte mso 9]>']) {
    test(`keeps <!--${data}-->`, () => assert.equal(isOutlookConditionalComment(data), true));
  }
  for (const data of ['container', 'ng-container', '', 'bindings={"ng-reflect-ng-if": "true"}', ' [if mso]']) {
    test(`drops <!--${data}-->`, () => assert.equal(isOutlookConditionalComment(data), false));
  }
});

describe('cleanupEmailHtml (string fallback)', () => {
  test('removes Angular comments, keeps Outlook conditionals', () => {
    assert.equal(
      cleanupEmailHtml('<p>a</p><!--container--><!----><!--[if mso]><b>o</b><![endif]--><!--[if !mso]><!--><i>n</i><!--<![endif]-->'),
      '<p>a</p><!--[if mso]><b>o</b><![endif]--><!--[if !mso]><!--><i>n</i><!--<![endif]-->',
    );
  });

  test('removes framework and ng-email selector attributes, keeps the rest', () => {
    assert.equal(
      cleanupEmailHtml(
        '<a ngebutton="" href="/x" _ngcontent-ng-c123="" ng-reflect-href="/x" ngh="0" style="color:red">Go</a>',
      ),
      '<a href="/x" style="color:red">Go</a>',
    );
  });

  test('unwraps hyphenated (component host) elements', () => {
    assert.equal(
      cleanupEmailHtml('<div><app-footer _nghost-ng-c1="" class="x"><p>f</p></app-footer></div>'),
      '<div><p>f</p></div>',
    );
  });

  test('does not touch attribute values that merely mention a marker', () => {
    assert.equal(cleanupEmailHtml('<p title="ng-version">t</p>'), '<p title="ng-version">t</p>');
  });
});
