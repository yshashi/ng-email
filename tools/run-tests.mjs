#!/usr/bin/env node
// Test pipeline for a package:
//   1. ngc (full AOT) compiles src + test into dist-test/<pkg>
//   2. esbuild bundles each *.spec.js, running the Angular Linker over the
//      partially compiled @angular/* packages (plain Node cannot run them as
//      published; see docs/reverse-engineering-notes.md, spike failure 1)
//   3. node --test runs every bundle twice: Angular dev mode and prod mode,
//      because the two modes emit different comment markers.
// Usage: node tools/run-tests.mjs packages/render [-- extra node --test args]
import { spawnSync } from 'node:child_process';
import { readdir, readFile, rm } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { build } from 'esbuild';
import { transformAsync } from '@babel/core';
import linkerPlugin from '@angular/compiler-cli/linker/babel';

const [pkgDir = 'packages/render', ...rest] = process.argv.slice(2);
const extraArgs = rest[0] === '--' ? rest.slice(1) : rest;
const root = resolve(import.meta.dirname, '..');
const pkgName = basename(pkgDir);
const outDir = join(root, 'dist-test', pkgName);

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

await rm(outDir, { recursive: true, force: true });
run(join(root, 'node_modules/.bin/ngc'), ['-p', join(pkgDir, 'tsconfig.spec.json')]);

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

const testDir = join(outDir, 'test');
const specs = (await readdir(testDir)).filter((f) => f.endsWith('.spec.js')).map((f) => join(testDir, f));
if (specs.length === 0) {
  console.error(`No *.spec.ts files under ${pkgDir}/test`);
  process.exit(1);
}

const modes = { dev: {}, prod: { ngDevMode: 'false' } };
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
  run(process.execPath, ['--test', '--test-reporter=spec', ...extraArgs, ...files]);
}
