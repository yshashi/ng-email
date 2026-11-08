import { type Type, reflectComponentType } from '@angular/core';

import { EmailRenderError } from './errors';
import type { EmailInputs } from './render-email';

export interface EmailComponentInfo {
  /** Class name. */
  readonly name: string;
  readonly selector: string;
  /** `name` is the property, `alias` the public name (the same unless aliased). */
  readonly inputs: ReadonlyArray<{ readonly name: string; readonly alias: string }>;
}

/** Selector and inputs of an email component (used by the preview's input editor). */
export function describeEmailComponent(component: Type<unknown>): EmailComponentInfo {
  const mirror = reflectComponentType(component);
  if (!mirror) {
    throw new EmailRenderError('NOT_A_COMPONENT', `${component.name || 'value'} is not an Angular component.`);
  }
  return {
    name: component.name,
    selector: mirror.selector,
    inputs: mirror.inputs.map((i) => ({ name: i.propName, alias: i.templateName })),
  };
}

/** True for a class compiled as an Angular component. */
export function isEmailComponent(value: unknown): value is Type<unknown> {
  return typeof value === 'function' && reflectComponentType(value as Type<unknown>) !== null;
}

/** One email in a registry: the component plus what the preview and export use. */
export interface EmailDefinition<T = any> {
  readonly component: Type<T>;
  /** Inputs used by `ng-email preview` and `ng-email export`. */
  readonly previewInputs?: EmailInputs<T>;
  /** Shown in the preview list. */
  readonly description?: string;
}

export type EmailRegistry = Readonly<Record<string, EmailDefinition>>;

/** Registry keys appear in URLs and file names. */
const EMAIL_NAME = /^[a-z0-9][a-z0-9_-]*$/i;

/** Defines one email, with `previewInputs` type-checked against the component's inputs. */
export function defineEmail<T>(
  component: Type<T>,
  options: Omit<EmailDefinition<T>, 'component'> = {},
): EmailDefinition<T> {
  return { component, ...options };
}

/**
 * Typed list of your emails. Export it from the entry you pass to
 * `ng-email build | preview | export`:
 *
 * ```ts
 * export const emails = defineEmails({
 *   welcome: defineEmail(WelcomeEmail, { previewInputs: { name: 'Ada' } }),
 * });
 * ```
 *
 * Your service can use it too: `renderEmail(emails.welcome.component, …)`.
 */
export function defineEmails<const R extends EmailRegistry>(registry: R): R {
  for (const [name, definition] of Object.entries(registry)) {
    if (!EMAIL_NAME.test(name)) {
      throw new Error(
        `defineEmails: "${name}" is not a valid email name. Use letters, digits, "-" and "_" (it becomes a URL and a file name).`,
      );
    }
    if (typeof definition?.component !== 'function') {
      throw new Error(`defineEmails: "${name}" has no component. Use defineEmail(MyEmail, …).`);
    }
  }
  return registry;
}
