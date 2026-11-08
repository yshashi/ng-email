import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  EmailRenderError,
  XHTML_TRANSITIONAL_DOCTYPE,
  renderEmail,
} from '../src/public-api';
import {
  GREETING,
  TestAliased,
  TestAsync,
  TestButton,
  TestControlFlow,
  TestFullEmail,
  TestInjected,
  TestProjection,
  TestStyled,
  TestThrows,
  TestUnicode,
} from './fixtures';

/** Anything Angular-specific that must never reach an inbox. */
const ARTIFACTS =
  /ng-version|ng-server-context|_nghost|_ngcontent|ng-reflect|\sngh=|ngskiphydration|<script|<nge-|\snge[a-z]+|<!--(?!\[if|<!\[endif)/i;

function assertClean(html: string): void {
  const match = ARTIFACTS.exec(html);
  assert.equal(match, null, `framework artifact ${JSON.stringify(match?.[0])} in:\n${html}`);
}

describe('renderEmail: fragments', () => {
  test('renders an attribute-selector component as its native element', async () => {
    const html = await renderEmail(TestButton, {
      inputs: { href: 'https://example.com/confirm', label: 'Confirm email' },
    });
    assert.equal(
      html,
      // Static host attributes come first, bound ones after.
      '<a target="_blank" href="https://example.com/confirm">' +
        '<span><!--[if mso]><i style="mso-font-width:400%" hidden>&#8202;</i><![endif]--></span>' +
        '<span>Confirm email</span></a>',
    );
    assertClean(html);
  });

  test('a fragment gets no doctype', async () => {
    const html = await renderEmail(TestButton, { inputs: { href: 'x', label: 'y' } });
    assert.ok(html.startsWith('<a '));
  });

  test('control flow, ng-container and nested components leave no markers', async () => {
    const html = await renderEmail(TestControlFlow, { inputs: { items: ['one', 'two', 'three'] } });
    assertClean(html);
    assert.match(html, /<p>shown<\/p>/);
    assert.doesNotMatch(html, /hidden<\/p>/);
    assert.match(html, /<ul><li>one<\/li><li>two<\/li><li>three<\/li><\/ul>/);
    assert.match(html, /container text/);
    assert.match(html, /<p>some<\/p>/);
    assert.match(html, /<!--\[if mso\]>/, 'MSO comment from the nested button survives');
  });

  test('user components with element selectors are unwrapped', async () => {
    const html = await renderEmail(TestControlFlow);
    assert.doesNotMatch(html, /app-footer/);
    assert.match(html, /<p>Footer 2030<\/p>/);
  });
});

describe('renderEmail: open items from the design', () => {
  test('<html>/<head>/<body> in a component template produce one valid document', async () => {
    const html = await renderEmail(TestFullEmail, { inputs: { subject: 'Hi', name: 'Ada' } });
    assertClean(html);
    assert.ok(html.startsWith(`${XHTML_TRANSITIONAL_DOCTYPE}<html lang="en" dir="ltr">`), html);
    assert.equal(html.match(/<html/g)?.length, 1);
    assert.equal(html.match(/<head>/g)?.length, 1);
    assert.equal(html.match(/<body/g)?.length, 1);
    assert.match(html, /<head><meta http-equiv="Content-Type" content="text\/html; charset=UTF-8"><title>Hi<\/title><\/head>/);
    // Domino normalizes *static* style attributes. Pinned on purpose: the
    // components package must bind [attr.style] strings to control the format.
    assert.match(html, /<body style="background-color: #ffffff;"><p>Hello Ada<\/p><\/body><\/html>$/);
  });

  test('non-table children projected into a table component stay inside its td', async () => {
    const html = await renderEmail(TestProjection);
    assertClean(html);
    assert.equal(
      html,
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0">' +
        '<tbody><tr><td><h1>Title</h1><p>Body text</p></td></tr></tbody></table>',
    );
  });
});

describe('renderEmail: inputs and providers', () => {
  test('accepts an input by its alias or its property name', async () => {
    assert.equal(await renderEmail(TestAliased, { inputs: { value: 'by prop' } }), '<p>by prop</p>');
    const byAlias = { publicName: 'by alias' } as unknown as { value: string };
    assert.equal(await renderEmail(TestAliased, { inputs: byAlias }), '<p>by alias</p>');
  });

  test('inputs are type-checked against the signal inputs (compile time)', () => {
    // Never called; `npm run typecheck` fails if an @ts-expect-error stops erroring.
    const _check = () => {
      // @ts-expect-error a number is not assignable to a string input
      void renderEmail(TestUnicode, { inputs: { text: 1 } });
      // @ts-expect-error `upper` is not an input
      void renderEmail(TestUnicode, { inputs: { upper: 'x' } });
    };
    assert.equal(typeof _check, 'function');
  });

  test('rejects an unknown input before rendering', async () => {
    await assert.rejects(
      renderEmail(TestAliased, { inputs: { nope: 1 } as never }),
      (e: unknown) => e instanceof EmailRenderError && e.code === 'UNKNOWN_INPUT',
    );
  });

  test('rejects when a required input is missing', async () => {
    // Dev mode has the full message; prod mode only the code NG0950.
    await assert.rejects(renderEmail(TestButton, { inputs: { href: 'x' } }), /NG0950|required/i);
  });

  test('uses providers passed for the render', async () => {
    const html = await renderEmail(TestInjected, {
      providers: [{ provide: GREETING, useValue: 'Hello from DI' }],
    });
    assert.equal(html, '<p>Hello from DI</p>');
  });

  test('rejects a class that is not a component', async () => {
    class NotAComponent {}
    await assert.rejects(
      renderEmail(NotAComponent),
      (e: unknown) => e instanceof EmailRenderError && e.code === 'NOT_A_COMPONENT',
    );
  });
});

describe('renderEmail: pipeline behavior', () => {
  test('an error thrown while rendering rejects, with no partial output', async () => {
    await assert.rejects(renderEmail(TestThrows), /boom from template/);
  });

  test('component styles are an error, not silently dropped', async () => {
    await assert.rejects(
      renderEmail(TestStyled),
      (e: unknown) => e instanceof EmailRenderError && e.code === 'COMPONENT_STYLES',
    );
  });

  test('waits for async resources before serializing', async () => {
    assert.equal(await renderEmail(TestAsync), '<p>Order #42 shipped</p>');
  });

  test('multi-byte characters survive', async () => {
    const text = 'Grüße 👋 你好 — ok';
    assert.equal(await renderEmail(TestUnicode, { inputs: { text } }), `<p>${text}</p>`);
  });

  test('concurrent renders are isolated', async () => {
    const names = Array.from({ length: 50 }, (_, i) => `user-${i}`);
    const results = await Promise.all(
      names.map((name) => renderEmail(TestFullEmail, { inputs: { name } })),
    );
    results.forEach((html, i) => assert.match(html, new RegExp(`Hello ${names[i]}<`)));
  });

  test('doctype can be replaced or omitted', async () => {
    const custom = await renderEmail(TestFullEmail, { doctype: '<!DOCTYPE html>' });
    assert.ok(custom.startsWith('<!DOCTYPE html><html'));
    const none = await renderEmail(TestFullEmail, { doctype: false });
    assert.ok(none.startsWith('<html'));
  });
});
