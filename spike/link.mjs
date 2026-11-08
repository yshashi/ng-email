// Build step: bundle the ngc output and run the Angular Linker over the
// partially compiled @angular/* packages, so nothing needs JIT at runtime.
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { transformAsync } from '@babel/core';
import linkerPlugin from '@angular/compiler-cli/linker/babel';

const angularLinker = {
  name: 'angular-linker',
  setup(b) {
    b.onLoad({ filter: /node_modules[\\/]@angular[\\/].*\.m?js$/ }, async ({ path }) => {
      const source = await readFile(path, 'utf8');
      if (!source.includes('ɵɵngDeclare')) return { contents: source, loader: 'js' };
      const out = await transformAsync(source, {
        filename: path,
        babelrc: false,
        configFile: false,
        compact: false,
        sourceMaps: false,
        plugins: [linkerPlugin],
      });
      return { contents: out.code, loader: 'js' };
    });
  },
};

await build({
  entryPoints: ['dist/spike.test.js'],
  outfile: 'dist/spike.linked.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // node:test and friends stay external; everything Angular is linked + inlined.
  external: ['node:*'],
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  plugins: [angularLinker],
  logLevel: 'warning',
});
