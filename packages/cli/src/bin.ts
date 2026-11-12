#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { type ParseArgsConfig, parseArgs } from 'node:util';

import { RegistryError, addBlocks, listRegistry } from './add.js';
import { BuildError, buildEmails } from './build.js';
import { formatCheckIssues } from './check.js';
import { exportEmails } from './export.js';
import { renderEntry } from './render-entry.js';
import { startPreview } from './preview/server.js';

const HELP = `ng-email <command> [options]

Commands
  build <entry>    Compile and bundle email components for plain Node
  preview <entry>  Live preview in the browser, rebuilt on every change
  export <entry>   Render every email to <name>.html and <name>.txt
  check <entry>    Render every email and report inbox problems (exit 1 on errors)
  add <name...>    Copy blocks/templates from the ng-email registry into your project
  mcp              Run the MCP server for AI agents on stdio (see the "AI and agents" docs)

build options
  -o, --outfile <file>   Output ESM bundle (default: dist/emails.mjs)
      --minify           Minify the bundle
      --sourcemap        Write a .map file next to the bundle
      --external <pkg>   Leave a dependency as a runtime import (repeatable)
      --no-dts           Do not write type declarations

preview options
      --port <n>         Port (default: 3000; 0 picks a free one)
      --host <addr>      Interface to listen on (default: 127.0.0.1)
      --no-dev           Preview in Angular production mode

export options
  -o, --outdir <dir>     Output directory (default: out)

check options
      --name <name>      Check one email (repeatable; default: all)

mcp options
      --registry <url>   Registry for blocks (default: the ng-email website, or $NG_EMAIL_REGISTRY)

add options
  -d, --dir <dir>        Where to write the files (default: src/emails/blocks)
      --list             List everything in the registry
      --overwrite        Replace files that already exist
      --registry <url>   Registry URL or local folder (default: the ng-email website, or $NG_EMAIL_REGISTRY)

Shared options
  -p, --tsconfig <file>  tsconfig to compile with (default: nearest to the entry)
      --dev              Angular dev mode for build/export (preview uses it by default)

Other
  -h, --help             Show this help
  -v, --version          Show the version

The entry exports your email components, or a registry:
  export const emails = defineEmails({ welcome: defineEmail(WelcomeEmail, { previewInputs: { name: 'Ada' } }) });
`;

const SHARED = {
  tsconfig: { type: 'string', short: 'p' },
  dev: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
} satisfies ParseArgsConfig['options'];

const COMMAND_OPTIONS = {
  build: {
    ...SHARED,
    outfile: { type: 'string', short: 'o' },
    minify: { type: 'boolean' },
    sourcemap: { type: 'boolean' },
    external: { type: 'string', multiple: true },
    dts: { type: 'boolean', default: true },
  },
  preview: {
    ...SHARED,
    port: { type: 'string' },
    host: { type: 'string' },
  },
  export: {
    ...SHARED,
    outdir: { type: 'string', short: 'o' },
  },
  check: {
    ...SHARED,
    name: { type: 'string', multiple: true },
  },
  mcp: {
    help: { type: 'boolean', short: 'h' },
    registry: { type: 'string' },
  },
  add: {
    help: { type: 'boolean', short: 'h' },
    dir: { type: 'string', short: 'd' },
    list: { type: 'boolean' },
    overwrite: { type: 'boolean' },
    registry: { type: 'string' },
  },
} satisfies Record<string, ParseArgsConfig['options']>;

type Command = keyof typeof COMMAND_OPTIONS;

const rel = (path: string) => relative(process.cwd(), path) || '.';

function version(): string {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
  return pkg.version;
}

function fail(error: unknown): number {
  if (error instanceof BuildError) {
    process.stderr.write(`✖ ${error.message}\n${error.details ? `\n${error.details}\n` : ''}`);
    return 1;
  }
  throw error;
}

async function runAdd(values: Record<string, unknown>, names: string[]): Promise<number> {
  const registry = values['registry'] as string | undefined;
  try {
    if (values['list']) {
      const items = await listRegistry(registry);
      for (const kind of ['block', 'template'] as const) {
        const ofKind = items.filter((i) => i.kind === kind);
        if (ofKind.length === 0) continue;
        process.stdout.write(`\n${kind === 'block' ? 'Blocks' : 'Templates'}\n`);
        for (const item of ofKind) {
          process.stdout.write(`  ${item.name.padEnd(22)} ${item.category.padEnd(16)} ${item.title}\n`);
        }
      }
      process.stdout.write(`\nAdd one with: ng-email add <name>\n`);
      return 0;
    }
    if (names.length === 0) {
      process.stderr.write('ng-email add: name at least one block (see "ng-email add --list").\n');
      return 1;
    }

    const result = await addBlocks({
      names,
      registry,
      dir: values['dir'] as string | undefined,
      overwrite: values['overwrite'] as boolean | undefined,
    });
    for (const { item, files } of result.added) {
      const file = files[0]!;
      const importPath = `./${rel(file).replace(/\\/g, '/').replace(/\.ts$/, '')}`;
      process.stdout.write(`✔ Added ${item.name} → ${rel(file)}\n`);
      process.stdout.write(`    import { ${item.className} } from '${importPath}';\n`);
      process.stdout.write(
        item.kind === 'block'
          ? `    use it inside an email template: <${item.selector} />\n`
          : `    render it: renderEmail(${item.className}, { inputs: { … } })\n`,
      );
    }
    for (const { name, reason } of result.skipped) process.stderr.write(`✖ ${name}: ${reason}\n`);
    if (result.missingDependencies.length > 0) {
      process.stderr.write(
        `\n! Install what the added files import: npm install ${result.missingDependencies.join(' ')}\n`,
      );
    }
    return result.skipped.length > 0 ? 1 : 0;
  } catch (error) {
    if (error instanceof RegistryError) {
      process.stderr.write(`✖ ${error.message}\n`);
      return 1;
    }
    throw error;
  }
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
  if (!(command in COMMAND_OPTIONS)) {
    process.stderr.write(`Unknown command "${command}". Run "ng-email --help".\n`);
    return 1;
  }

  let parsed: { values: Record<string, unknown>; positionals: string[] };
  try {
    parsed = parseArgs({
      args: rest,
      allowPositionals: true,
      allowNegative: true,
      options: COMMAND_OPTIONS[command as Command],
    });
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\nRun "ng-email --help".\n`);
    return 1;
  }

  const { values, positionals } = parsed;
  if (values['help']) {
    process.stdout.write(HELP);
    return 0;
  }
  if (command === 'add') {
    return runAdd(values, positionals);
  }
  if (command === 'mcp') {
    // Loaded on demand: the MCP SDK is only needed by this command.
    const { runMcpServer } = await import('./mcp.js');
    await runMcpServer({ registry: values['registry'] as string | undefined });
    return 0;
  }
  if (positionals.length !== 1) {
    process.stderr.write(`ng-email ${command}: expected exactly one <entry> file.\nRun "ng-email --help".\n`);
    return 1;
  }
  const entry = positionals[0]!;
  const tsconfig = values['tsconfig'] as string | undefined;

  switch (command as Command) {
    case 'build': {
      try {
        const result = await buildEmails({
          entry,
          tsconfig,
          outfile: values['outfile'] as string | undefined,
          dev: values['dev'] as boolean | undefined,
          minify: values['minify'] as boolean | undefined,
          sourcemap: values['sourcemap'] as boolean | undefined,
          external: values['external'] as string[] | undefined,
          dts: values['dts'] as boolean | undefined,
        });
        const kb = (result.bytes / 1024).toFixed(1);
        process.stdout.write(
          `✔ Built ${rel(result.outfile)} (${kb} kB, Angular ${result.mode} mode) in ${result.durationMs} ms\n`,
        );
        if (result.dtsFile) process.stdout.write(`  types: ${rel(result.dtsFile)}\n`);
        return 0;
      } catch (error) {
        return fail(error);
      }
    }

    case 'export': {
      try {
        const result = await exportEmails({
          entry,
          tsconfig,
          outdir: values['outdir'] as string | undefined,
          dev: values['dev'] as boolean | undefined,
        });
        const count = result.written.length / 2;
        process.stdout.write(`✔ Exported ${count} email${count === 1 ? '' : 's'} to ${rel(result.outdir)}\n`);
        for (const file of result.written) process.stdout.write(`  ${rel(file)}\n`);
        for (const { name, error } of result.failed) process.stderr.write(`✖ ${name}: ${error}\n`);
        if (count === 0 && result.failed.length === 0) {
          process.stderr.write('✖ No emails found: export a defineEmails() registry or email components from the entry.\n');
          return 1;
        }
        return result.failed.length > 0 ? 1 : 0;
      } catch (error) {
        return fail(error);
      }
    }

    case 'check': {
      try {
        const result = await renderEntry({
          entry,
          tsconfig,
          dev: values['dev'] as boolean | undefined,
          names: values['name'] as string[] | undefined,
        });
        let errors = result.failed.length;
        for (const email of result.rendered) {
          process.stdout.write(`\n${email.name} (${(email.check.bytes / 1024).toFixed(1)} kB)\n`);
          process.stdout.write(`${formatCheckIssues(email.check).replace(/^/gm, '  ')}\n`);
          if (!email.check.ok) errors++;
        }
        for (const { name, error } of result.failed) process.stderr.write(`\n✖ ${name}: ${error}\n`);
        if (result.rendered.length === 0 && result.failed.length === 0) {
          process.stderr.write('✖ No emails found: export a defineEmails() registry or email components from the entry.\n');
          return 1;
        }
        process.stdout.write(errors ? `\n✖ ${errors} email${errors === 1 ? '' : 's'} with errors\n` : '\n✔ All emails passed\n');
        return errors ? 1 : 0;
      } catch (error) {
        return fail(error);
      }
    }

    case 'add':
    case 'mcp':
      return 1; // handled above; keeps the switch exhaustive

    case 'preview': {
      const portText = (values['port'] as string | undefined) ?? '3000';
      const port = Number(portText);
      if (!Number.isInteger(port) || port < 0 || port > 65_535) {
        process.stderr.write(`--port must be an integer between 0 and 65535, got "${portText}".\n`);
        return 1;
      }
      const preview = await startPreview({
        entry,
        tsconfig,
        port,
        host: values['host'] as string | undefined,
        dev: (values['dev'] as boolean | undefined) ?? true,
        onBuild: (state) => {
          const time = state.buildMs === null ? '' : ` in ${state.buildMs} ms`;
          if (state.status === 'ready') {
            const n = state.entries.length;
            process.stdout.write(`✔ Built ${n} email${n === 1 ? '' : 's'}${time}\n`);
          } else if (state.status === 'error') {
            const fallback =
              state.version > 0
                ? 'Still serving the last good build.'
                : 'Nothing to preview yet: fix the error and save.';
            process.stderr.write(`✖ Build failed${time}. ${fallback}\n\n${state.error}\n\n`);
          }
        },
      });
      process.stdout.write(`\n  ng-email preview ready at ${preview.url}\n  watching for changes, Ctrl+C to stop\n\n`);

      await new Promise<void>((resolvePromise) => {
        const stop = () => {
          process.off('SIGINT', stop);
          process.off('SIGTERM', stop);
          void preview.close().then(resolvePromise);
        };
        process.on('SIGINT', stop);
        process.on('SIGTERM', stop);
      });
      return 0;
    }
  }
}

process.exitCode = await main(process.argv.slice(2));
