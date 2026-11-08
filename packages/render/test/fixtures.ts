import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  ViewEncapsulation,
  computed,
  inject,
  input,
  resource,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

const email = { encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush };

/** Same shape as the spike Button: attribute selector + MSO conditional comment. */
@Component({
  ...email,
  selector: 'a[ngeTestButton]',
  host: { '[attr.href]': 'href()', target: '_blank' },
  template: '<span [innerHTML]="mso"></span><span>{{ label() }}</span>',
})
export class TestButton {
  readonly href = input.required<string>();
  readonly label = input.required<string>();
  protected readonly mso = inject(DomSanitizer).bypassSecurityTrustHtml(
    '<!--[if mso]><i style="mso-font-width:400%" hidden>&#8202;</i><![endif]-->',
  );
}

/** Open item 1: <html>/<head>/<body> inside a component template. */
@Component({
  ...email,
  selector: 'test-full-email',
  template: `<html lang="en" dir="ltr">
  <head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>{{ subject() }}</title></head>
  <body style="background-color:#ffffff"><p>Hello {{ name() }}</p></body>
</html>`,
})
export class TestFullEmail {
  readonly subject = input('Welcome');
  readonly name = input('there');
}

/** Open item 2: a table component that projects non-table children into its td. */
@Component({
  ...email,
  selector: 'table[ngeTestContainer]',
  host: { role: 'presentation', border: '0', cellpadding: '0', cellspacing: '0' },
  template: '<tbody><tr><td><ng-content /></td></tr></tbody>',
})
export class TestContainer {}

@Component({
  ...email,
  selector: 'test-projection',
  imports: [TestContainer],
  template: '<table ngeTestContainer><h1>Title</h1><p>Body text</p></table>',
})
export class TestProjection {}

/** A user sub-component with an element selector: its host tag must be unwrapped. */
@Component({ ...email, selector: 'app-footer', template: '<p>Footer {{ year() }}</p>' })
export class AppFooter {
  readonly year = input(2026);
}

/** Control flow, ng-container, projection, nested component: all must leave no markers. */
@Component({
  ...email,
  selector: 'test-control-flow',
  imports: [AppFooter, TestButton],
  template: `
    @if (show()) {<p>shown</p>} @else {<p>hidden</p>}
    <ul>@for (item of items(); track item) {<li>{{ item }}</li>}</ul>
    <ng-container>container text</ng-container>
    @switch (items().length) { @case (0) {<p>none</p>} @default {<p>some</p>} }
    <a ngeTestButton href="https://example.com" label="Go"></a>
    <app-footer [year]="2030" />
  `,
})
export class TestControlFlow {
  readonly show = input(true);
  readonly items = input<string[]>(['a', 'b']);
}

@Component({ ...email, selector: 'test-aliased', template: '<p>{{ value() }}</p>' })
export class TestAliased {
  readonly value = input('', { alias: 'publicName' });
}

@Component({ ...email, selector: 'test-throws', template: '<p>{{ explode() }}</p>' })
export class TestThrows {
  explode(): string {
    throw new Error('boom from template');
  }
}

@Component({
  ...email,
  selector: 'test-styled',
  styles: ['p { color: red; }'],
  template: '<p>styled</p>',
})
export class TestStyled {}

@Component({
  ...email,
  selector: 'test-async',
  template: '<p>{{ order.value() ?? "loading" }}</p>',
})
export class TestAsync {
  protected readonly order = resource({
    loader: () => new Promise<string>((r) => setTimeout(() => r('Order #42 shipped'), 20)),
  });
}

export const GREETING = new InjectionToken<string>('GREETING');

@Component({ ...email, selector: 'test-injected', template: '<p>{{ greeting }}</p>' })
export class TestInjected {
  protected readonly greeting = inject(GREETING);
}

@Component({
  ...email,
  selector: 'test-text',
  template: `
    <div data-skip-in-text="true">Preheader text</div>
    <img src="https://example.com/logo.png" alt="Logo">
    <p>Hello Ada</p>
    <a href="https://example.com/a">Open dashboard</a>
    <a href="https://example.com/b">https://example.com/b</a>
  `,
})
export class TestText {}

@Component({
  ...email,
  selector: 'test-unicode',
  template: '<p>{{ text() }}</p>',
})
export class TestUnicode {
  readonly text = input('');
  protected readonly upper = computed(() => this.text().toUpperCase());
}
