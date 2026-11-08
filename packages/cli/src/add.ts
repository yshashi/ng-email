import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

/** Where `ng-email add` downloads blocks from (the website's static registry). */
export const DEFAULT_REGISTRY = 'https://yshashi.github.io/ng-email/r';

const NAME = /^[a-z0-9][a-z0-9-]*$/;
/** Registry files must be plain file names: no directories, no `..`, TypeScript only. */
const SAFE_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.ts$/;
const FETCH_TIMEOUT_MS = 15_000;

export interface RegistryIndexItem {
  name: string;
  title: string;
  description: string;
  category: string;
  kind: 'block' | 'template';
  className: string;
  selector: string;
}

export interface RegistryItem extends RegistryIndexItem {
  registryVersion: number;
  dependencies: string[];
  files: Array<{ path: string; content: string }>;
  preview?: { html: string; text: string };
}

export interface AddOptions {
  names: string[];
  /** Target directory for the files. Default `src/emails/blocks`. */
  dir?: string;
  /** Registry URL (http/https) or local directory. Default: the website registry, or `NG_EMAIL_REGISTRY`. */
  registry?: string;
  overwrite?: boolean;
  cwd?: string;
}

export interface AddResult {
  added: Array<{ item: RegistryItem; files: string[] }>;
  skipped: Array<{ name: string; reason: string }>;
  /** Dependencies the added items need that the project does not resolve. */
  missingDependencies: string[];
}

export class RegistryError extends Error {
  override readonly name = 'RegistryError';
}

export function resolveRegistry(registry: string | undefined, cwd: string): string {
  const value = registry ?? process.env['NG_EMAIL_REGISTRY'] ?? DEFAULT_REGISTRY;
  return /^https?:\/\//.test(value) ? value.replace(/\/+$/, '') : resolve(cwd, value);
}

async function readRegistryFile(registry: string, file: string): Promise<unknown> {
  if (/^https?:\/\//.test(registry)) {
    const url = `${registry}/${file}`;
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    } catch (error) {
      throw new RegistryError(`Could not reach ${url}: ${(error as Error).message}`);
    }
    if (res.status === 404) return undefined;
    if (!res.ok) throw new RegistryError(`${url} returned HTTP ${res.status}.`);
    try {
      return await res.json();
    } catch {
      throw new RegistryError(`${url} is not valid JSON.`);
    }
  }
  const path = join(registry, file);
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new RegistryError(`${path} is not valid JSON.`);
  }
}

/** Lists everything in a registry. */
export async function listRegistry(registry?: string, cwd = process.cwd()): Promise<RegistryIndexItem[]> {
  const base = resolveRegistry(registry, cwd);
  const index = (await readRegistryFile(base, 'index.json')) as { items?: RegistryIndexItem[] } | undefined;
  if (!index?.items) throw new RegistryError(`No registry index at ${base}/index.json.`);
  return index.items;
}

function validateItem(name: string, data: unknown): RegistryItem {
  const item = data as Partial<RegistryItem>;
  if (item?.name !== name || !Array.isArray(item.files) || item.files.length === 0) {
    throw new RegistryError(`Registry entry "${name}" is malformed.`);
  }
  for (const file of item.files) {
    if (typeof file?.path !== 'string' || !SAFE_FILE.test(file.path) || typeof file.content !== 'string') {
      throw new RegistryError(
        `Registry entry "${name}" has an unsafe or invalid file path ${JSON.stringify(file?.path)}; refusing to write it.`,
      );
    }
  }
  return item as RegistryItem;
}

function resolvesFrom(cwd: string, pkg: string): boolean {
  try {
    createRequire(join(cwd, 'noop.js')).resolve(`${pkg}/package.json`);
    return true;
  } catch {
    return false;
  }
}

/** Downloads blocks/templates from a registry into the project. */
export async function addBlocks(options: AddOptions): Promise<AddResult> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const registry = resolveRegistry(options.registry, cwd);
  const dir = resolve(cwd, options.dir ?? 'src/emails/blocks');
  const result: AddResult = { added: [], skipped: [], missingDependencies: [] };
  const deps = new Set<string>();

  for (const name of options.names) {
    if (!NAME.test(name)) {
      result.skipped.push({ name, reason: 'not a valid block name' });
      continue;
    }
    const data = await readRegistryFile(registry, `${name}.json`);
    if (data === undefined) {
      result.skipped.push({ name, reason: `not found in ${registry} (run "ng-email add --list")` });
      continue;
    }
    const item = validateItem(name, data);

    const targets = item.files.map((f) => join(dir, f.path));
    const existing = targets.filter((t) => existsSync(t));
    if (existing.length > 0 && !options.overwrite) {
      result.skipped.push({ name, reason: `${existing.join(', ')} already exists (use --overwrite)` });
      continue;
    }

    await mkdir(dir, { recursive: true });
    for (const [i, file] of item.files.entries()) await writeFile(targets[i]!, file.content);
    result.added.push({ item, files: targets });
    for (const dep of item.dependencies ?? []) deps.add(dep);
  }

  result.missingDependencies = [...deps].filter((dep) => !resolvesFrom(cwd, dep));
  return result;
}
