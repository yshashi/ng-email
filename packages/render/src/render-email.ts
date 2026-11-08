import {
  type ComponentMirror,
  DOCUMENT,
  ErrorHandler,
  type InputSignalWithTransform,
  type Provider,
  type Type,
  inject,
  provideZonelessChangeDetection,
  reflectComponentType,
} from '@angular/core';
import { type BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import {
  BEFORE_APP_SERIALIZED,
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server';
import type { HtmlToTextOptions } from 'html-to-text';

import { cleanupEmailDom } from './cleanup';
import { EMAIL_HOST_TAG, EmailHost, RENDER_REQUEST } from './email-host';
import { EmailRenderError } from './errors';
import { toPlainText } from './plain-text';

export const XHTML_TRANSITIONAL_DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

/** The signal inputs of `T`, typed by the value each one accepts. */
export type EmailInputs<T> = {
  [K in keyof T as T[K] extends InputSignalWithTransform<any, any> ? K : never]?:
    T[K] extends InputSignalWithTransform<any, infer W> ? W : never;
};

export interface RenderOptions<T> {
  /** Values for the component's inputs, applied with `ComponentRef.setInput`. */
  inputs?: EmailInputs<T>;
  /** Extra providers for this render (i18n, configuration, data services). */
  providers?: Provider[];
  /**
   * Doctype placed before a full document (output starting with `<html`).
   * Defaults to XHTML 1.0 Transitional. `false` omits it. Fragments never get one.
   */
  doctype?: string | false;
}

export interface TextRenderOptions<T> extends RenderOptions<T> {
  htmlToText?: HtmlToTextOptions;
}

const SHELL = `<html><head></head><body><${EMAIL_HOST_TAG}></${EMAIL_HOST_TAG}></body></html>`;
const RENDER_URL = 'http://localhost/';

/** Renders a standalone Angular component to email HTML. */
export async function renderEmail<T>(
  component: Type<T>,
  options: RenderOptions<T> = {},
): Promise<string> {
  const markup = await renderMarkup(component, options);
  return applyDoctype(markup, options.doctype);
}

/** Renders a standalone Angular component to the plain-text alternative. */
export async function renderEmailText<T>(
  component: Type<T>,
  options: TextRenderOptions<T> = {},
): Promise<string> {
  return toPlainText(await renderMarkup(component, options), options.htmlToText);
}

/** One render, both parts. */
export async function renderEmailBoth<T>(
  component: Type<T>,
  options: TextRenderOptions<T> = {},
): Promise<{ html: string; text: string }> {
  const markup = await renderMarkup(component, options);
  return {
    html: applyDoctype(markup, options.doctype),
    text: toPlainText(markup, options.htmlToText),
  };
}

async function renderMarkup<T>(component: Type<T>, options: RenderOptions<T>): Promise<string> {
  const mirror = reflectComponentType(component);
  if (!mirror) {
    throw new EmailRenderError(
      'NOT_A_COMPONENT',
      `${component.name || 'value'} is not an Angular component.`,
    );
  }
  const inputs = resolveInputs(mirror, (options.inputs ?? {}) as Record<string, unknown>);

  // Errors from the component tree are routed to ErrorHandler during SSR and
  // would otherwise be logged while a partial page is returned. Collect them
  // and reject instead.
  const errors: unknown[] = [];
  let markup: string | undefined;

  const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(
      EmailHost,
      {
        providers: [
          ...(options.providers ?? []),
          provideZonelessChangeDetection(),
          provideServerRendering(),
          { provide: RENDER_REQUEST, useValue: { component, inputs } },
          { provide: ErrorHandler, useValue: { handleError: (e: unknown) => errors.push(e) } },
          {
            provide: BEFORE_APP_SERIALIZED,
            multi: true,
            useFactory: () => {
              const doc = inject(DOCUMENT);
              // platform-server swallows exceptions thrown here, so record them.
              return () => {
                try {
                  markup = extractEmailMarkup(doc, mirror.selector);
                } catch (e) {
                  errors.push(e);
                }
              };
            },
          },
        ],
      },
      context,
    );

  await renderApplication(bootstrap, {
    document: SHELL,
    url: RENDER_URL,
    allowedHosts: ['localhost'],
  });

  if (errors.length > 0) {
    throw errors[0];
  }
  if (markup === undefined) {
    throw new EmailRenderError('NO_OUTPUT', 'Angular finished without serializing the email.');
  }
  return markup;
}

function resolveInputs(
  mirror: ComponentMirror<unknown>,
  inputs: Record<string, unknown>,
): Map<string, unknown> {
  const resolved = new Map<string, unknown>();
  for (const [key, value] of Object.entries(inputs)) {
    const input = mirror.inputs.find((i) => i.propName === key || i.templateName === key);
    if (!input) {
      const known = mirror.inputs.map((i) => i.templateName).join(', ') || 'none';
      throw new EmailRenderError(
        'UNKNOWN_INPUT',
        `"${key}" is not an input of ${mirror.type.name}. Known inputs: ${known}.`,
      );
    }
    resolved.set(input.templateName, value);
  }
  return resolved;
}

function extractEmailMarkup(doc: Document, selector: string): string {
  const host = doc.querySelector(EMAIL_HOST_TAG);
  if (!host) {
    throw new EmailRenderError('NO_OUTPUT', `<${EMAIL_HOST_TAG}> is missing from the server document.`);
  }

  if (doc.querySelector('style[ng-app-id], link[ng-app-id]')) {
    throw new EmailRenderError(
      'COMPONENT_STYLES',
      `A component rendered by ${selector} declares \`styles\`/\`styleUrl\`. Angular places those in the ` +
        'page <head>, outside the email, so they would be silently lost. Use inline styles, or a ' +
        '<style> element inside the email <head>.',
    );
  }

  cleanupEmailDom(host);

  if (host.querySelector('script')) {
    throw new EmailRenderError('SCRIPT_IN_OUTPUT', 'The rendered email contains a <script> element.');
  }
  return host.innerHTML;
}

function applyDoctype(markup: string, doctype: string | false | undefined): string {
  const body = markup.replace(/^\s*<!doctype[^>]*>/i, '');
  if (doctype === false || !/^\s*<html[\s>]/i.test(body)) {
    return body;
  }
  return `${doctype ?? XHTML_TRANSITIONAL_DOCTYPE}${body}`;
}
