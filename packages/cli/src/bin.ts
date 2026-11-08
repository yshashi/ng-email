#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { parseArgs } from 'node:util';

import { BuildError, buildEmails } from './build.js';

const HELP = `ng-email <command> [options]

Commands
  build <entry>        Compile and bundle email components for plain Node

build options
  -o, --outfile <file> Output ESM bundle (default: dist/emails.mjs)
  -p, --tsconfig <file> tsconfig to compile with (default: nearest to the entry)
      --dev            Keep Angular dev mode (default: production mode)
      --minify         Minify the bundle
      --sourcemap      Write a .map file next to the bundle
      --external <pkg> Leave a dependency as a runtime import (repeatable)
      --no-dts         Do not write type declarations

Other
  -h, --help           Show this help
  -v, --version        Show the version

Example
  ng-email build src/emails/index.ts -o dist/emails.mjs

  // in your Node service
  import { renderEmail, WelcomeEmail } from './dist/emails.mjs';
  const html = await renderEmail(WelcomeEmail, { inputs: { name: 'Ada' } });
`;

function version(): string {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    version: string;
  };
  return pkg.version;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;

  if (command === undefined || command === '-h' || command === '--help' || command === 'help') {
    process.stdout.write(HELP);
    return command === undefined ? 1 : 0;
  }
  if (command === '-v' || command === '--version') {
    process.stdout.write(`${version()}\n`);
    return 0;
  }
  if (command !== 'build') {
    process.stderr.write(`Unknown command "${command}". Run "ng-email --help".\n`);
    return 1;
  }

  let parsed;
  try {
    parsed = parseArgs({
      args: rest,
      allowPositionals: true,
      allowNegative: true,
      options: {
        outfile: { type: 'string', short: 'o' },
        tsconfig: { type: 'string', short: 'p' },
        dev: { type: 'boolean' },
        minify: { type: 'boolean' },
        sourcemap: { type: 'boolean' },
        external: { type: 'string', multiple: true },
        dts: { type: 'boolean', default: true },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\nRun "ng-email --help".\n`);
    return 1;
  }

  const { values, positionals } = parsed;
  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (positionals.length !== 1) {
    process.stderr.write('ng-email build: expected exactly one <entry> file.\nRun "ng-email --help".\n');
    return 1;
  }

  try {
    const result = await buildEmails({
      entry: positionals[0]!,
      outfile: values.outfile,
      tsconfig: values.tsconfig,
      dev: values.dev,
      minify: values.minify,
      sourcemap: values.sourcemap,
      external: values.external,
      dts: values.dts,
    });
    const kb = (result.bytes / 1024).toFixed(1);
    process.stdout.write(
      `✔ Built ${relative(process.cwd(), result.outfile)} (${kb} kB, Angular ${result.mode} mode) in ${result.durationMs} ms\n`,
    );
    if (result.dtsFile) process.stdout.write(`  types: ${relative(process.cwd(), result.dtsFile)}\n`);
    return 0;
  } catch (error) {
    if (error instanceof BuildError) {
      process.stderr.write(`✖ ${error.message}\n${error.details ? `\n${error.details}\n` : ''}`);
      return 1;
    }
    throw error;
  }
}

process.exitCode = await main(process.argv.slice(2));
