/**
 * Reads a bundle built by `buildEmails` and exposes its emails by name.
 *
 * Source of truth, in order:
 *  1. an exported `emails` registry (`defineEmails({...})`), or
 *  2. every exported Angular component, named after its export.
 */

type Component = abstract new (...args: never[]) => unknown;

interface Definition {
  component: Component;
  previewInputs?: Record<string, unknown>;
  description?: string;
}

/** The part of a built bundle the catalog relies on (re-exported from @ng-email/render). */
interface EmailBundle {
  emails?: Record<string, Definition>;
  renderEmailBoth(component: Component, options: { inputs?: Record<string, unknown> }): Promise<{ html: string; text: string }>;
  describeEmailComponent(component: Component): {
    name: string;
    selector: string;
    inputs: Array<{ name: string; alias: string }>;
  };
  isEmailComponent(value: unknown): boolean;
  [exportName: string]: unknown;
}

export interface CatalogEntry {
  name: string;
  /** Component class name. */
  component: string;
  selector: string;
  description: string | undefined;
  inputs: string[];
  previewInputs: Record<string, unknown> | undefined;
}

export interface RenderedEmail {
  html: string;
  text: string;
  durationMs: number;
}

export interface Catalog {
  /** `registry` when the bundle exports `emails`, else `exports`. */
  source: 'registry' | 'exports';
  entries: CatalogEntry[];
  has(name: string): boolean;
  /** Renders with `inputs`, or the entry's preview inputs when `inputs` is undefined. */
  render(name: string, inputs?: Record<string, unknown>): Promise<RenderedEmail>;
}

export class UnknownEmailError extends Error {
  override readonly name = 'UnknownEmailError';
}

export async function loadCatalog(bundleUrl: string): Promise<Catalog> {
  const bundle = (await import(bundleUrl)) as EmailBundle;
  for (const fn of ['renderEmailBoth', 'describeEmailComponent', 'isEmailComponent'] as const) {
    if (typeof bundle[fn] !== 'function') {
      throw new Error(`${bundleUrl} is not an ng-email bundle (missing ${fn}). Build it with "ng-email build".`);
    }
  }

  const definitions = new Map<string, Definition>();
  let source: Catalog['source'];
  if (bundle.emails && typeof bundle.emails === 'object') {
    source = 'registry';
    for (const [name, definition] of Object.entries(bundle.emails)) definitions.set(name, definition);
  } else {
    source = 'exports';
    for (const [name, value] of Object.entries(bundle)) {
      if (bundle.isEmailComponent(value)) definitions.set(name, { component: value as Component });
    }
  }

  const entries: CatalogEntry[] = [...definitions].map(([name, definition]) => {
    const info = bundle.describeEmailComponent(definition.component);
    return {
      name,
      component: info.name,
      selector: info.selector,
      description: definition.description,
      inputs: info.inputs.map((i) => i.name),
      previewInputs: definition.previewInputs,
    };
  });

  return {
    source,
    entries,
    has: (name) => definitions.has(name),
    async render(name, inputs) {
      const definition = definitions.get(name);
      if (!definition) throw new UnknownEmailError(`No email named "${name}".`);
      const started = performance.now();
      const { html, text } = await bundle.renderEmailBoth(definition.component, {
        inputs: inputs ?? definition.previewInputs ?? {},
      });
      return { html, text, durationMs: Math.round(performance.now() - started) };
    },
  };
}
