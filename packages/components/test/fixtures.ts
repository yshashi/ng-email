import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { EMAIL_COMPONENTS, type EmailStyle } from '../src/public-api';

/** Each fixture wraps one component so the test can pass `style` and projected content. */
const fixture = {
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
};

@Component({
  ...fixture,
  imports: [EMAIL_COMPONENTS],
  selector: 'fx-button',
  template: '<a ngeButton [href]="href()" [ngeStyle]="style()">{{ label() }}</a>',
})
export class ButtonFx {
  readonly href = input('https://example.com/confirm');
  readonly label = input('Confirm');
  readonly style = input<EmailStyle>();
}

@Component({ ...fixture, imports: [EMAIL_COMPONENTS], selector: 'fx-text', template: '<p ngeText [ngeStyle]="style()">Hello</p>' })
export class TextFx {
  readonly style = input<EmailStyle>();
}

@Component({
  ...fixture,
  imports: [EMAIL_COMPONENTS],
  selector: 'fx-heading',
  template: '<h2 ngeHeading [mt]="0" mx="8px" [ngeStyle]="style()">Title</h2>',
})
export class HeadingFx {
  readonly style = input<EmailStyle>();
}

@Component({
  ...fixture,
  imports: [EMAIL_COMPONENTS],
  selector: 'fx-link',
  template: '<a ngeLink href="https://example.com/help" [ngeStyle]="style()">Help</a>',
})
export class LinkFx {
  readonly style = input<EmailStyle>();
}

@Component({
  ...fixture,
  imports: [EMAIL_COMPONENTS],
  selector: 'fx-img',
  template: '<img ngeImg src="https://example.com/logo.png" width="120" height="36" [alt]="alt()" />',
})
export class ImgFx {
  readonly alt = input('');
}

@Component({ ...fixture, imports: [EMAIL_COMPONENTS], selector: 'fx-hr', template: '<hr ngeHr />' })
export class HrFx {}

@Component({
  ...fixture,
  imports: [EMAIL_COMPONENTS],
  selector: 'fx-container',
  template: '<table ngeContainer [ngeStyle]="style()"><p>inside</p></table>',
})
export class ContainerFx {
  readonly style = input<EmailStyle>();
}

@Component({
  ...fixture,
  imports: [EMAIL_COMPONENTS],
  selector: 'fx-section',
  template: '<table ngeSection width="600" align="left" [ngeStyle]="style()"><p>inside</p></table>',
})
export class SectionFx {
  readonly style = input<EmailStyle>();
}

@Component({
  ...fixture,
  imports: [EMAIL_COMPONENTS],
  selector: 'fx-row',
  template:
    '<table ngeRow><td ngeColumn [ngeStyle]="{ width: \'50%\' }">left</td><td ngeColumn>right</td></table>',
})
export class RowFx {}

@Component({
  ...fixture,
  imports: [EMAIL_COMPONENTS],
  selector: 'fx-body',
  template: '<body ngeBody [ngeStyle]="style()"><p>content</p></body>',
})
export class BodyFx {
  readonly style = input<EmailStyle>();
}

@Component({ ...fixture, imports: [EMAIL_COMPONENTS], selector: 'fx-preview', template: '<nge-preview [text]="text()" />' })
export class PreviewFx {
  readonly text = input('');
}

/** Every v1 component in one realistic email. */
@Component({
  ...fixture,
  imports: [EMAIL_COMPONENTS],
  selector: 'fx-welcome',
  template: `
<html ngeHtml>
  <head ngeHead>
    <title>{{ subject() }}</title>
    <nge-font
      fontFamily="Inter"
      [fallbackFontFamily]="['Helvetica', 'sans-serif']"
      [webFont]="{ url: 'https://fonts.example.com/inter.woff2', format: 'woff2' }"
    />
  </head>
  <body ngeBody [ngeStyle]="{ backgroundColor: '#f6f9fc', margin: 0 }">
    <nge-preview [text]="'Confirm your email, ' + name()" />
    <table ngeContainer [ngeStyle]="{ backgroundColor: '#ffffff', padding: '20px 0 48px' }">
      <img ngeImg src="https://example.com/logo.png" width="120" height="36" alt="Acme" />
      <h1 ngeHeading [mt]="0">Welcome, {{ name() }}</h1>
      <p ngeText>Thanks for signing up. Please confirm your address.</p>
      <table ngeSection [ngeStyle]="{ padding: '24px', textAlign: 'center' }">
        <a
          ngeButton
          [href]="url()"
          [ngeStyle]="{ backgroundColor: '#5469d4', color: '#ffffff', padding: '12px 20px', borderRadius: '4px' }"
        >Confirm email</a>
      </table>
      <hr ngeHr />
      <table ngeRow>
        <td ngeColumn [ngeStyle]="{ width: '50%' }"><a ngeLink href="https://example.com/help">Help</a></td>
        <td ngeColumn [ngeStyle]="{ width: '50%', textAlign: 'right' }">
          <p ngeText [ngeStyle]="{ margin: 0, fontSize: '12px' }">© Acme Inc.</p>
        </td>
      </table>
    </table>
  </body>
</html>`,
})
export class WelcomeEmail {
  readonly subject = input('Welcome to Acme');
  readonly name = input.required<string>();
  readonly url = input.required<string>();
}
