#!/usr/bin/env node
// Test pipeline, per package:
//   1. ngc (full AOT) compiles the package's src + test (and any sibling
//      package sources it imports through tsconfig `paths`) into
//      dist-test/<pkg>/<package-dir>/...
//   2. esbuild bundles each *.spec.js, running the Angular Linker over the
//      partially compiled @angular/* packages (plain Node cannot run them as
//      published; see docs/reverse-engineering-notes.md, spike failure 1).
//      `@ng-email/<name>` imports resolve to the freshly compiled sources.
//   3. node --test runs every bundle twice: Angular dev mode and prod mode,
//      because the two modes emit different comment markers.
// Usage: node tools/run-tests.mjs packages/render packages/components [-- node --test args]
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile, rm } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { build } from 'esbuild';
import { transformAsync } from '@babel/core';
import linkerPlugin from '@angular/compiler-cli/linker/babel';

const args = process.argv.slice(2);
const split = args.indexOf('--');
const pkgDirs = split === -1 ? args : args.slice(0, split);
const nodeTestArgs = split === -1 ? [] : args.slice(split + 1);
const root = resolve(import.meta.dirname, '..');
const modes = { dev: {}, prod: { ngDevMode: 'false' } };

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

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
        plugins: [linkerPlugin],
      });
      return { contents: out.code, loader: 'js' };
    });
  },
};

if (pkgDirs.length === 0) {
  console.error('Usage: node tools/run-tests.mjs <package-dir>... [-- node --test args]');
  process.exit(1);
}

for (const pkgDir of pkgDirs) {
  const pkgName = basename(pkgDir);
  const outDir = join(root, 'dist-test', pkgName);
  await rm(outDir, { recursive: true, force: true });
  run(join(root, 'node_modules/.bin/ngc'), ['-p', join(pkgDir, 'tsconfig.spec.json')]);

  // @ng-email/<name> → compiled sibling sources inside this package's output.
  const alias = {};
  for (const name of await readdir(outDir)) {
    const entry = join(outDir, name, 'src', 'public-api.js');
    if (existsSync(entry)) alias[`@ng-email/${name}`] = entry;
  }

  const testDir = join(outDir, pkgName, 'test');
  const specs = (await readdir(testDir))
    .filter((f) => f.endsWith('.spec.js'))
    .map((f) => join(testDir, f));
  if (specs.length === 0) {
    console.error(`No *.spec.ts files under ${pkgDir}/test`);
    process.exit(1);
  }

  for (const [mode, define] of Object.entries(modes)) {
    await build({
      entryPoints: specs,
      outdir: join(outDir, `linked-${mode}`),
      outExtension: { '.js': '.mjs' },
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node22',
      define,
      alias,
      external: ['node:*'],
      banner: {
        js: "import { createRequire as __ngeCreateRequire } from 'node:module'; const require = __ngeCreateRequire(import.meta.url);",
      },
      plugins: [angularLinker],
      logLevel: 'warning',
    });
  }

  for (const mode of Object.keys(modes)) {
    console.log(`\n=== ${pkgName}: Angular ${mode} mode ===`);
    const dir = join(outDir, `linked-${mode}`);
    const files = (await readdir(dir)).filter((f) => f.endsWith('.mjs')).map((f) => join(dir, f));
    run(process.execPath, ['--test', '--test-reporter=spec', ...nodeTestArgs, ...files]);
  }
}
