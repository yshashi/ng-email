import { readFile } from 'node:fs/promises';

import { type PluginItem, transformAsync } from '@babel/core';
import linkerPlugin from '@angular/compiler-cli/linker/babel';
import type { Plugin } from 'esbuild';

/** Marker left by partial compilation (`ɵɵngDeclareComponent`, `ɵɵngDeclareFactory`, …). */
const PARTIAL_MARKER = 'ɵɵngDeclare';

/**
 * esbuild plugin that runs the Angular Linker over partially compiled
 * libraries: Angular itself, @ng-email/*, and any third-party Angular
 * package. Published Angular packages cannot run in plain Node without this
 * (or without loading @angular/compiler at runtime for JIT).
 *
 * Files without partial declarations are left for esbuild to load as usual.
 */
export function angularLinkerPlugin(): Plugin {
  return {
    name: 'ng-email:angular-linker',
    setup(build) {
      build.onLoad({ filter: /\.[cm]?js$/ }, async ({ path }) => {
        const source = await readFile(path, 'utf8');
        if (!source.includes(PARTIAL_MARKER)) return undefined;

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
        return { contents: result.code, loader: 'js' };
      });
    },
  };
}
