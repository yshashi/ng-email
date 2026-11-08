import { readFile, stat } from 'node:fs/promises';

import { type PluginItem, transformAsync } from '@babel/core';
import linkerPlugin from '@angular/compiler-cli/linker/babel';
import type { Plugin } from 'esbuild';

/** Marker left by partial compilation (`ɵɵngDeclareComponent`, `ɵɵngDeclareFactory`, …). */
const PARTIAL_MARKER = 'ɵɵngDeclare';

interface CacheEntry {
  mtimeMs: number;
  size: number;
  /** Linked code, or null when the file has no partial declarations. */
  code: string | null;
}

/**
 * Reusable across builds (watch mode): files are re-linked only when their
 * size or mtime changes. Linking Angular itself is most of a build's time.
 */
export type LinkerCache = Map<string, CacheEntry>;

export function createLinkerCache(): LinkerCache {
  return new Map();
}

export interface AngularLinkerPluginOptions {
  cache?: LinkerCache;
}

/**
 * esbuild plugin that runs the Angular Linker over partially compiled
 * libraries: Angular itself, @ng-email/*, and any third-party Angular
 * package. Published Angular packages cannot run in plain Node without this
 * (or without loading @angular/compiler at runtime for JIT).
 *
 * Files without partial declarations are left for esbuild to load as usual.
 */
export function angularLinkerPlugin(options: AngularLinkerPluginOptions = {}): Plugin {
  const cache = options.cache;
  return {
    name: 'ng-email:angular-linker',
    setup(build) {
      build.onLoad({ filter: /\.[cm]?js$/ }, async ({ path }) => {
        const info = cache ? await stat(path) : undefined;
        const cached = info ? cache?.get(path) : undefined;
        if (cached && info && cached.mtimeMs === info.mtimeMs && cached.size === info.size) {
          return cached.code === null ? undefined : { contents: cached.code, loader: 'js' };
        }

        const source = await readFile(path, 'utf8');
        let code: string | null = null;
        if (source.includes(PARTIAL_MARKER)) {
          const result = await transformAsync(source, {
            filename: path,
            babelrc: false,
            configFile: false,
            compact: false,
            sourceMaps: false,
            // compiler-cli pins its own @babel/core typings; the plugin is compatible at runtime.
            plugins: [linkerPlugin as unknown as PluginItem],
          });
          if (!result?.code) {
            return { errors: [{ text: `Angular Linker produced no output for ${path}` }] };
          }
          code = result.code;
        }

        if (cache && info) cache.set(path, { mtimeMs: info.mtimeMs, size: info.size, code });
        return code === null ? undefined : { contents: code, loader: 'js' };
      });
    },
  };
}
