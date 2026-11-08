import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  defineEmail,
  defineEmails,
  describeEmailComponent,
  isEmailComponent,
  renderEmail,
} from '../src/public-api';
import { TestAliased, TestUnicode } from './fixtures';

describe('describeEmailComponent / isEmailComponent', () => {
  test('lists inputs with their aliases', () => {
    assert.deepEqual(describeEmailComponent(TestAliased), {
      name: 'TestAliased',
      selector: 'test-aliased',
      inputs: [{ name: 'value', alias: 'publicName' }],
    });
  });

  test('tells components from other values', () => {
    assert.equal(isEmailComponent(TestUnicode), true);
    assert.equal(isEmailComponent(class Plain {}), false);
    assert.equal(isEmailComponent('TestUnicode'), false);
    assert.equal(isEmailComponent(undefined), false);
  });
});

describe('defineEmails', () => {
  const emails = defineEmails({
    unicode: defineEmail(TestUnicode, { previewInputs: { text: 'Grüße' }, description: 'Unicode text' }),
    aliased: defineEmail(TestAliased),
  });

  test('keeps definitions as given', () => {
    assert.equal(emails.unicode.component, TestUnicode);
    assert.deepEqual(emails.unicode.previewInputs, { text: 'Grüße' });
    assert.equal(emails.unicode.description, 'Unicode text');
    assert.equal(emails.aliased.previewInputs, undefined);
  });

  test('a definition renders with its preview inputs', async () => {
    const { component, previewInputs } = emails.unicode;
    assert.equal(await renderEmail(component, { inputs: previewInputs }), '<p>Grüße</p>');
  });

  test('rejects names that are not URL and file safe', () => {
    for (const bad of ['', 'has space', '../up', 'a/b', '-lead']) {
      assert.throws(() => defineEmails({ [bad]: defineEmail(TestUnicode) }), /not a valid email name/);
    }
  });

  test('rejects an entry without a component', () => {
    assert.throws(() => defineEmails({ x: {} as never }), /has no component/);
  });

  test('previewInputs are type-checked (compile time)', () => {
    const _check = () => {
      // @ts-expect-error a number is not assignable to the string input
      defineEmail(TestUnicode, { previewInputs: { text: 1 } });
      // @ts-expect-error not an input
      defineEmail(TestUnicode, { previewInputs: { nope: 'x' } });
    };
    assert.equal(typeof _check, 'function');
  });
});
