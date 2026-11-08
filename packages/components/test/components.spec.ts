import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { renderEmail } from '@ng-email/render';

import {
  BodyFx,
  ButtonFx,
  ContainerFx,
  HeadingFx,
  HrFx,
  ImgFx,
  LinkFx,
  PreviewFx,
  RowFx,
  SectionFx,
  TextFx,
} from './fixtures';

const MSO_HAIR = '&#8202;';

describe('Button (Outlook padding)', () => {
  test('12px 20px padding: CSS padding for modern clients, hair spaces + text raise for Outlook', async () => {
    const html = await renderEmail(ButtonFx, {
      inputs: {
        style: { backgroundColor: '#5469d4', color: '#ffffff', padding: '12px 20px', borderRadius: '4px' },
      },
    });
    assert.equal(
      html,
      '<a href="https://example.com/confirm" target="_blank" style="' +
        'line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px;' +
        'background-color:#5469d4;color:#ffffff;border-radius:4px;' +
        'padding-top:12px;padding-right:20px;padding-bottom:12px;padding-left:20px">' +
        // 20px = 2 hair spaces at 500%; raise = (12 + 12) px * 3/4 = 18
        `<span><!--[if mso]><i style="mso-font-width:500%;mso-text-raise:18px" hidden>${MSO_HAIR.repeat(2)}</i><![endif]--></span>` +
        '<span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px">Confirm</span>' +
        `<span><!--[if mso]><i style="mso-font-width:500%" hidden>${MSO_HAIR.repeat(2)}&#8203;</i><![endif]--></span>` +
        '</a>',
    );
  });

  test('asymmetric padding uses each side', async () => {
    const html = await renderEmail(ButtonFx, { inputs: { style: 'padding:10px 48px 6px 12px' } });
    assert.match(html, /mso-font-width:300%;mso-text-raise:12px" hidden>(&#8202;){2}<\/i>/); // left 12px
    assert.match(html, /mso-font-width:480%" hidden>(&#8202;){5}&#8203;<\/i>/); // right 48px
    assert.match(html, /mso-text-raise:4.5px">/); // bottom 6px → 4.5pt
  });

  test('no padding: empty MSO fill, no label raise', async () => {
    const html = await renderEmail(ButtonFx);
    assert.match(html, /<i style="mso-font-width:0%;mso-text-raise:0px" hidden><\/i>/);
    assert.match(html, /<span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px">Confirm/);
    assert.doesNotMatch(html, /padding-top/);
  });

  test('em/rem padding is converted to px', async () => {
    const html = await renderEmail(ButtonFx, { inputs: { style: { padding: '1rem 2em' } } });
    assert.match(html, /padding-top:16px;padding-right:32px;padding-bottom:16px;padding-left:32px/);
  });
});

describe('layout tables', () => {
  test('Container: presentation table, max-width, padding moved to the cell', async () => {
    const html = await renderEmail(ContainerFx, {
      inputs: { style: { backgroundColor: '#fff', padding: '20px 0 48px' } },
    });
    assert.equal(
      html,
      '<table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" width="100%" ' +
        'style="max-width:37.5em;background-color:#fff">' +
        '<tbody><tr style="width:100%"><td style="padding:20px 0 48px"><p>inside</p></td></tr></tbody></table>',
    );
  });

  test('Section: no max-width; width/align are overridable; no style → no attribute', async () => {
    const html = await renderEmail(SectionFx);
    assert.equal(
      html,
      // Attributes written in the template (width, align) keep their written order.
      '<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="600" align="left">' +
        '<tbody><tr><td><p>inside</p></td></tr></tbody></table>',
    );
  });

  test('Section: padding longhands go to the cell too', async () => {
    const html = await renderEmail(SectionFx, { inputs: { style: 'padding-left:8px;color:#333;padding-top:4px' } });
    assert.match(html, /role="presentation" width="600" align="left" style="color:#333">/);
    assert.match(html, /<td style="padding-left:8px;padding-top:4px">/);
  });

  test('Row and Column: cells stay inside the row, not re-parented', async () => {
    const html = await renderEmail(RowFx);
    assert.equal(
      html,
      '<table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" width="100%">' +
        '<tbody style="width:100%"><tr style="width:100%">' +
        '<td style="width:50%">left</td><td>right</td>' +
        '</tr></tbody></table>',
    );
  });

  test('Body: only background and zeroed margin on <body>; full style on the inner cell (Yahoo/AOL)', async () => {
    const html = await renderEmail(BodyFx, {
      inputs: { style: { backgroundColor: '#f6f9fc', margin: '10px', fontFamily: 'Arial' } },
    });
    assert.equal(
      html,
      '<body style="background-color:#f6f9fc;margin:0" lang="en" dir="ltr">' +
        '<table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">' +
        '<tbody><tr><td style="background-color:#f6f9fc;margin:10px;font-family:Arial" lang="en" dir="ltr">' +
        '<p>content</p></td></tr></tbody></table></body>',
    );
  });
});

describe('text and media', () => {
  test('Text: defaults', async () => {
    assert.equal(
      await renderEmail(TextFx),
      '<p style="font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">Hello</p>',
    );
  });

  test('Text: margin shorthand is expanded and replaces the default margins', async () => {
    assert.equal(
      await renderEmail(TextFx, { inputs: { style: { margin: 0, fontSize: '12px' } } }),
      '<p style="line-height:24px;font-size:12px;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0">Hello</p>',
    );
  });

  test('Text: one explicit side keeps the other default', async () => {
    assert.match(
      await renderEmail(TextFx, { inputs: { style: 'margin-top:4px' } }),
      /margin-top:4px;margin-bottom:16px"/,
    );
  });

  test('Heading: margin shorthand inputs, user style wins, no input attributes leak', async () => {
    // [mt]="0" mx="8px", then user margin-left:0 overrides mx's left side.
    assert.equal(
      await renderEmail(HeadingFx, { inputs: { style: 'margin-left:0;color:#111' } }),
      '<h2 style="margin-top:0;margin-right:8px;margin-left:0;color:#111">Title</h2>',
    );
  });

  test('Link: new tab, default color, no underline', async () => {
    assert.equal(
      await renderEmail(LinkFx),
      '<a href="https://example.com/help" target="_blank" style="color:#067df7;text-decoration-line:none">Help</a>',
    );
  });

  test('Img: block display, no border, empty alt by default', async () => {
    assert.equal(
      await renderEmail(ImgFx),
      '<img src="https://example.com/logo.png" width="120" height="36" alt="" ' +
        'style="display:block;outline:none;border:none;text-decoration:none">',
    );
  });

  test('Hr', async () => {
    assert.equal(
      await renderEmail(HrFx),
      '<hr style="width:100%;border:none;border-color:transparent;border-top:1px solid #eaeaea">',
    );
  });
});

describe('Preview', () => {
  const HIDDEN = 'display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0';

  test('short text is padded with invisible characters up to 200', async () => {
    const html = await renderEmail(PreviewFx, { inputs: { text: 'Your order shipped' } });
    assert.ok(html.startsWith(`<div data-skip-in-text="true" style="${HIDDEN}">Your order shipped<div>`), html);
    const filler = /<div>([^<]*)<\/div><\/div>$/.exec(html)?.[1] ?? '';
    // 182 repetitions of 5 characters; the NBSP serializes as &nbsp;
    assert.equal(filler.replaceAll('&nbsp;', ' ').length, (200 - 18) * 5);
    assert.doesNotMatch(html, /nge-preview/);
  });

  test('text over 200 characters is truncated and gets no filler', async () => {
    const html = await renderEmail(PreviewFx, { inputs: { text: 'x'.repeat(250) } });
    assert.equal(html, `<div data-skip-in-text="true" style="${HIDDEN}">${'x'.repeat(200)}</div>`);
  });
});
