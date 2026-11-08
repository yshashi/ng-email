import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  buildFontCss,
  computeHairSpaceFill,
  convertToPx,
  mergeStyles,
  parsePadding,
  parseStyle,
  pxToPt,
  toKebabCase,
  toStyleString,
} from '../src/public-api';

describe('toKebabCase', () => {
  const cases: Array<[string, string]> = [
    ['fontSize', 'font-size'],
    ['msoPaddingAlt', 'mso-padding-alt'],
    ['msoTextRaise', 'mso-text-raise'],
    ['msTransform', '-ms-transform'],
    ['WebkitTextSizeAdjust', '-webkit-text-size-adjust'],
    ['webkitTextSizeAdjust', '-webkit-text-size-adjust'],
    ['MozOsxFontSmoothing', '-moz-osx-font-smoothing'],
    ['background-color', 'background-color'],
    ['color', 'color'],
  ];
  for (const [input, expected] of cases) {
    test(`${input} → ${expected}`, () => assert.equal(toKebabCase(input), expected));
  }
});

describe('parseStyle / toStyleString', () => {
  test('object: camelCase keys, px for numbers, unitless exceptions, 0 bare, empty dropped', () => {
    assert.equal(
      toStyleString({ fontSize: 14, lineHeight: 1.5, opacity: 0, margin: 0, color: null, padding: undefined, border: '' }),
      'font-size:14px;line-height:1.5;opacity:0;margin:0',
    );
  });

  test('string: trims, lowercases properties, keeps values verbatim', () => {
    assert.equal(
      toStyleString(' Color : #FFF ; mso-line-height-rule:exactly;;bad ; '),
      'color:#FFF;mso-line-height-rule:exactly',
    );
  });

  test('empty style serializes to null so [attr.style] removes the attribute', () => {
    assert.equal(toStyleString(undefined), null);
    assert.equal(toStyleString(''), null);
    assert.equal(toStyleString({}), null);
  });

  test('mergeStyles: later wins and moves the property to its new position', () => {
    assert.equal(
      toStyleString(mergeStyles('color:red;font-size:14px', { color: 'blue' })),
      'font-size:14px;color:blue',
    );
  });

  test('a duplicate inside one string keeps the last value', () => {
    assert.deepEqual([...parseStyle('color:red;color:blue')], [['color', 'blue']]);
  });
});

describe('convertToPx', () => {
  const cases: Array<[string | number | undefined, number | undefined]> = [
    ['10px', 10],
    ['2em', 32],
    ['1.5rem', 24],
    ['50%', 300],
    ['15cm', 0],
    ['invalid-format', 0],
    ['12', 0],
    ['', undefined],
    [undefined, undefined],
    [0, 0],
    [18, 18],
  ];
  for (const [input, expected] of cases) {
    test(`${JSON.stringify(input)} → ${expected}`, () => assert.equal(convertToPx(input), expected));
  }
});

describe('parsePadding', () => {
  const pad = (style: Parameters<typeof parseStyle>[0]) => parsePadding(parseStyle(style));

  test('number shorthand applies to all sides', () =>
    assert.deepEqual(pad({ padding: 10 }), { top: 10, right: 10, bottom: 10, left: 10 }));
  test('1 value', () =>
    assert.deepEqual(pad('padding:10px'), { top: 10, right: 10, bottom: 10, left: 10 }));
  test('2 values', () =>
    assert.deepEqual(pad('padding:10px 2em'), { top: 10, right: 32, bottom: 10, left: 32 }));
  test('3 values', () =>
    assert.deepEqual(pad('padding:10px 20px 30px'), { top: 10, right: 20, bottom: 30, left: 20 }));
  test('4 values', () =>
    assert.deepEqual(pad('padding:10px 20px 30px 40px'), { top: 10, right: 20, bottom: 30, left: 40 }));
  test('a later side longhand overrides the shorthand', () =>
    assert.deepEqual(pad({ padding: 10, paddingRight: '1em' }), { top: 10, right: 16, bottom: 10, left: 10 }));
  test('an explicit 0 side wins over the shorthand', () =>
    assert.deepEqual(pad({ padding: '12px 20px', paddingTop: 0 }), { top: 0, right: 20, bottom: 12, left: 20 }));
  test('a shorthand declared after a longhand wins (CSS order)', () =>
    assert.deepEqual(pad('padding-top:0;padding:8px'), { top: 8, right: 8, bottom: 8, left: 8 }));
  test('no padding → all undefined', () =>
    assert.deepEqual(pad({ color: 'red' }), { top: undefined, right: undefined, bottom: undefined, left: undefined }));
});

describe('pxToPt', () => {
  test('10 → 7.5', () => assert.equal(pxToPt(10), 7.5));
  test('20 → 15', () => assert.equal(pxToPt(20), 15));
  test('0 → 0', () => assert.equal(pxToPt(0), 0));
  test('undefined / NaN → undefined', () => {
    assert.equal(pxToPt(undefined), undefined);
    assert.equal(pxToPt(Number.NaN), undefined);
  });
});

describe('computeHairSpaceFill (Outlook button padding)', () => {
  const cases: Array<[number | undefined, number, number]> = [
    // [padding px, font width multiplier, hair spaces]
    [undefined, 0, 0],
    [0, 0, 0],
    [1, 0.5, 1],
    [5, 2.5, 1],
    [10, 5, 1],
    [12, 3, 2],
    [20, 5, 2],
    [48, 4.8, 5],
  ];
  for (const [padding, fontWidth, spaceCount] of cases) {
    test(`${padding}px → ${spaceCount} × ${fontWidth * 100}%`, () => {
      const fill = computeHairSpaceFill(padding);
      assert.deepEqual(fill, { fontWidth, spaceCount });
      // Invariant: total width equals the padding, and the per-space width respects the cap.
      assert.ok(Math.abs(fill.fontWidth * fill.spaceCount * 2 - (padding ?? 0)) < 1e-9);
      assert.ok(fill.fontWidth <= 5);
    });
  }
});

describe('buildFontCss', () => {
  test('@font-face with Outlook fallback and a global family rule', () => {
    assert.equal(
      buildFontCss({
        fontFamily: 'Inter',
        fallbackFontFamily: ['Helvetica', 'sans-serif'],
        webFont: { url: 'https://fonts.example.com/inter.woff2', format: 'woff2' },
        fontStyle: 'normal',
        fontWeight: 400,
      }),
      "@font-face{font-family:'Inter';font-style:normal;font-weight:400;mso-font-alt:'Helvetica';" +
        "src:url('https://fonts.example.com/inter.woff2') format('woff2');}" +
        "*{font-family:'Inter', Helvetica, sans-serif;}",
    );
  });

  test('strips characters that could break out of the CSS string or rule', () => {
    const css = buildFontCss({
      fontFamily: "Evil'}</style><script>",
      fallbackFontFamily: 'Arial',
      webFont: { url: "https://x.test/a'(b).woff", format: 'woff' },
      fontStyle: 'normal',
      fontWeight: 400,
    });
    assert.doesNotMatch(css, /<|>|\}<|Evil'/);
    assert.match(css, /font-family:'Evil\/stylescript'/);
    assert.match(css, /url\('https:\/\/x\.test\/a%28b%29\.woff'\)/);
  });
});
