import {
  Component,
  InjectionToken,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  inject,
  provideZonelessChangeDetection,
} from '@angular/core';
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';

interface RenderRequest {
  component: Type<unknown>;
  inputs: Record<string, unknown>;
}

const RENDER_REQUEST = new InjectionToken<RenderRequest>('RENDER_REQUEST');
const HOST_TAG = 'ng-email-host';

/** Generic AOT-compiled host: creates the requested component and sets inputs. */
@Component({
  selector: HOST_TAG,
  encapsulation: ViewEncapsulation.None,
  template: '<ng-container #outlet />',
})
class EmailHost implements OnInit {
  @ViewChild('outlet', { static: true, read: ViewContainerRef })
  private outlet!: ViewContainerRef;
  private readonly request = inject(RENDER_REQUEST);

  ngOnInit(): void {
    const ref = this.outlet.createComponent(this.request.component);
    for (const [name, value] of Object.entries(this.request.inputs)) {
      ref.setInput(name, value);
    }
  }
}

/**
 * Remove framework artifacts. Keeps Outlook conditional comments
 * (`[if ...]` / `<![endif]`) and drops every other comment.
 */
export function cleanup(html: string): string {
  const open = html.indexOf(`<${HOST_TAG}`);
  const close = html.lastIndexOf(`</${HOST_TAG}>`);
  if (open === -1 || close === -1) {
    throw new Error('renderEmail: host element missing from server output');
  }
  const inner = html.slice(html.indexOf('>', open) + 1, close);

  return inner
    .replace(/<!--([\s\S]*?)-->/g, (match, body: string) =>
      body.startsWith('[if') || body.startsWith('<![endif]') ? match : '',
    )
    .replace(/\s(?:_nghost|_ngcontent)-[\w-]+(?:="[^"]*")?/g, '')
    .replace(/\sng-(?:version|server-context|reflect-[\w-]+)="[^"]*"/g, '')
    .replace(/\sngh="[^"]*"/g, '')
    // Selector attributes (DOM lowercases them: ngEmailButton -> ngemailbutton).
    .replace(/\sngemail[a-z]*(?:="")?/gi, '');
}

/** Raw platform-server output, before cleanup. Exported for the spike report. */
export function renderRaw<T>(
  component: Type<T>,
  inputs: Record<string, unknown> = {},
): Promise<string> {
  const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(
      EmailHost,
      {
        providers: [
          provideZonelessChangeDetection(),
          provideServerRendering(),
          { provide: RENDER_REQUEST, useValue: { component, inputs } },
        ],
      },
      context,
    );

  return renderApplication(bootstrap, {
    document: `<html><head></head><body><${HOST_TAG}></${HOST_TAG}></body></html>`,
    url: 'http://localhost/',
    allowedHosts: ['localhost'],
  });
}

export async function renderEmail<T>(
  component: Type<T>,
  inputs: Record<string, unknown> = {},
): Promise<string> {
  return cleanup(await renderRaw(component, inputs));
}
