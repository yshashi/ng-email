import { existsSync } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, parse, relative, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';

import {
  type CompilerOptions,
  createCompilerHost,
  formatDiagnostics,
  performCompilation,
  readConfiguration,
} from '@angular/compiler-cli';
import { type BuildFailure, type Message, type Plugin, build as esbuild } from 'esbuild';
import ts from 'typescript';

import { type LinkerCache, angularLinkerPlugin } from './linker.js';

export interface BuildEmailsOptions {
  /** TypeScript entry that exports your email components (e.g. `src/emails/index.ts`). */
  entry: string;
  /** Output ESM file. Default `dist/emails.mjs`. */
  outfile?: string;
  /** Directory relative paths are resolved from. Default `process.cwd()`. */
  cwd?: string;
  /** tsconfig to compile with. Default: the nearest `tsconfig.json` above the entry. */
  tsconfig?: string;
  /** Keep Angular dev mode (extra checks, verbose errors). Default false. */
  dev?: boolean;
  minify?: boolean;
  /** Write an external `.map` file. */
  sourcemap?: boolean;
  /** Packages to leave as runtime imports instead of bundling. Angular is always bundled. */
  external?: readonly string[];
  /** Write a `.d.mts` / `.d.ts` next to the bundle. Default true. */
  dts?: boolean;
  /** Share between repeated builds (watch mode) so Angular is linked only once. */
  linkerCache?: LinkerCache;
}

export interface BuildEmailsResult {
  outfile: string;
  dtsFile: string | undefined;
  bytes: number;
  durationMs: number;
  mode: 'production' | 'development';
}

/** A build failure with user-facing details (compiler diagnostics, bundler messages). */
export class BuildError extends Error {
  override readonly name = 'BuildError';

  constructor(
    message: string,
    readonly details?: string,
  ) {
    super(message);
  }
}

/** What the bundle re-exports from @ng-email/render, so callers use the bundled (linked) Angular. */
const RENDER_EXPORTS = [
  'renderEmail',
  'renderEmailText',
  'renderEmailBoth',
  'toPlainText',
  'EmailRenderError',
  'XHTML_TRANSITIONAL_DOCTYPE',
  'defineEmail',
  'defineEmails',
  'describeEmailComponent',
  'isEmailComponent',
] as const;

const NEVER_EXTERNAL = /^@angular\/|^@ng-email\//;

const VIRTUAL_OUT_DIR = '/__ng_email_out__';

const DEFAULT_COMPILER_OPTIONS: CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ES2022,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  strict: true,
  skipLibCheck: true,
  strictTemplates: true,
};

const NON_ESM_MODULES = new Set([
  ts.ModuleKind.None,
  ts.ModuleKind.CommonJS,
  ts.ModuleKind.AMD,
  ts.ModuleKind.UMD,
  ts.ModuleKind.System,
]);

export async function buildEmails(options: BuildEmailsOptions): Promise<BuildEmailsResult> {
  const started = performance.now();
  const cwd = resolve(options.cwd ?? process.cwd());
  const entry = resolve(cwd, options.entry);
  const outfile = resolve(cwd, options.outfile ?? 'dist/emails.mjs');
  const dev = options.dev ?? false;

  if (!existsSync(entry)) {
    throw new BuildError(`Entry not found: ${relative(cwd, entry) || entry}`);
  }
  for (const name of options.external ?? []) {
    if (NEVER_EXTERNAL.test(name)) {
      throw new BuildError(
        `"${name}" cannot be external: Angular and @ng-email packages must be bundled so they can be linked.`,
      );
    }
  }

  const tsconfig = options.tsconfig ? resolve(cwd, options.tsconfig) : findUp('tsconfig.json', dirname(entry));
  if (tsconfig && !existsSync(tsconfig)) {
    throw new BuildError(`tsconfig not found: ${relative(cwd, tsconfig)}`);
  }

  const compiled = compileAot(entry, tsconfig, options.sourcemap ?? false);
  await mkdir(dirname(outfile), { recursive: true });

  try {
    await esbuild({
      absWorkingDir: cwd,
      entryPoints: ['ng-email:entry'],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node22',
      minify: options.minify ?? false,
      // Keep class names (WelcomeEmail, not _WelcomeEmail): the preview lists
      // them and render errors quote them.
      keepNames: true,
      sourcemap: options.sourcemap ?? false,
      legalComments: 'none',
      external: [...(options.external ?? [])],
      ...(tsconfig ? { tsconfig } : {}),
      define: dev ? {} : { ngDevMode: 'false' },
      // CommonJS dependencies inside an ESM bundle may still call require().
      banner: {
        js: "import { createRequire as __ngEmailCreateRequire } from 'node:module';\nconst require = __ngEmailCreateRequire(import.meta.url);",
      },
      plugins: [
        virtualEntryPlugin(entry),
        compiledSourcesPlugin(compiled),
        angularLinkerPlugin({ cache: options.linkerCache }),
      ],
      logLevel: 'silent',
    });
  } catch (error) {
    throw toBuildError(error, cwd);
  }

  let dtsFile: string | undefined;
  if (options.dts ?? true) {
    dtsFile = declarationPath(outfile);
    await writeFile(dtsFile, declarationSource(dtsFile, entry));
  }

  return {
    outfile,
    dtsFile,
    bytes: (await stat(outfile)).size,
    durationMs: Math.round(performance.now() - started),
    mode: dev ? 'development' : 'production',
  };
}

/**
 * Full AOT compile of everything reachable from the entry, emitted to memory.
 * Returns compiled JavaScript keyed by absolute source path.
 */
function compileAot(entry: string, tsconfig: string | undefined, sourcemap: boolean): Map<string, string> {
  let base: CompilerOptions = DEFAULT_COMPILER_OPTIONS;
  if (tsconfig) {
    const config = readConfiguration(tsconfig);
    if (config.errors.length > 0) {
      throw new BuildError(`Invalid ${tsconfig}`, formatDiagnostics(config.errors));
    }
    base = config.options;
  }

  const compilerOptions: CompilerOptions = {
    ...base,
    compilationMode: 'full',
    noEmit: false,
    noEmitOnError: true,
    emitDeclarationOnly: false,
    declaration: false,
    declarationMap: false,
    composite: false,
    incremental: false,
    sourceMap: false,
    inlineSourceMap: sourcemap,
    inlineSources: sourcemap,
    outDir: VIRTUAL_OUT_DIR,
    // TS 6 requires an explicit rootDir with outDir (TS5011). Output only lives
    // in memory, so use the filesystem root: no "file is not under rootDir".
    rootDir: parse(entry).root,
    module: base.module === undefined || NON_ESM_MODULES.has(base.module) ? ts.ModuleKind.ES2022 : base.module,
  };
  delete compilerOptions.tsBuildInfoFile;
  delete compilerOptions.outFile;

  const host = createCompilerHost({ options: compilerOptions });
  const outputs = new Map<string, string>();
  host.writeFile = (fileName, data, _bom, _onError, sourceFiles) => {
    const source = sourceFiles?.[0]?.fileName;
    if (source && /\.[cm]?js$/.test(fileName)) outputs.set(resolve(source), data);
  };

  const { diagnostics } = performCompilation({ rootNames: [entry], options: compilerOptions, host });
  const errors = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (errors.length > 0) {
    throw new BuildError(
      `Angular compilation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}.`,
      formatDiagnostics(errors),
    );
  }
  return outputs;
}

/** Entry module = the user's entry + the render API, all from one bundled Angular. */
function virtualEntryPlugin(entry: string): Plugin {
  return {
    name: 'ng-email:entry',
    setup(build) {
      build.onResolve({ filter: /^ng-email:entry$/ }, () => ({ path: 'entry', namespace: 'ng-email-entry' }));
      build.onLoad({ filter: /.*/, namespace: 'ng-email-entry' }, () => ({
        contents:
          `export * from ${JSON.stringify(entry)};\n` +
          `export { ${RENDER_EXPORTS.join(', ')} } from '@ng-email/render';\n`,
        resolveDir: dirname(entry),
        loader: 'js',
      }));
    },
  };
}

/** Serves the AOT output for TypeScript sources instead of letting esbuild strip types itself. */
function compiledSourcesPlugin(compiled: ReadonlyMap<string, string>): Plugin {
  return {
    name: 'ng-email:compiled-sources',
    setup(build) {
      build.onLoad({ filter: /\.[cm]?tsx?$/ }, ({ path }) => {
        if (/\.d\.[cm]?ts$/.test(path)) return undefined;
        const code = compiled.get(resolve(path));
        if (code === undefined) {
          return {
            errors: [
              {
                text: `${path} was bundled but not compiled by Angular. TypeScript sources inside node_modules are not supported.`,
              },
            ],
          };
        }
        return { contents: code, loader: 'js', resolveDir: dirname(path) };
      });
    },
  };
}

function toBuildError(error: unknown, cwd: string): BuildError {
  const failure = error as Partial<BuildFailure>;
  if (!Array.isArray(failure.errors)) {
    return new BuildError(error instanceof Error ? error.message : String(error));
  }
  const messages = failure.errors.map((m) => formatMessage(m, cwd));
  const missingRender = failure.errors.some((m) => m.text.includes('"@ng-email/render"'));
  const hint = missingRender ? '\nInstall it in your project: npm install @ng-email/render' : '';
  return new BuildError(`Bundling failed.${hint}`, messages.join('\n'));
}

function formatMessage(message: Message, cwd: string): string {
  const where = message.location
    ? `${relative(cwd, resolve(cwd, message.location.file))}:${message.location.line}:${message.location.column}: `
    : '';
  return `${where}${message.text}`;
}

function declarationPath(outfile: string): string {
  const ext = extname(outfile);
  const stem = outfile.slice(0, outfile.length - ext.length);
  return ext === '.mjs' ? `${stem}.d.mts` : ext === '.cjs' ? `${stem}.d.cts` : `${stem}.d.ts`;
}

/** Types for the bundle point back at the email sources, plus the re-exported render API. */
function declarationSource(dtsFile: string, entry: string): string {
  let specifier = relative(dirname(dtsFile), entry).split(sep).join('/');
  specifier = specifier.replace(/\.([cm]?)tsx?$/, (_m, kind: string) => `.${kind}js`);
  if (!specifier.startsWith('.')) specifier = `./${specifier}`;
  return (
    '// Generated by ng-email build. Do not edit.\n' +
    `export * from '${specifier}';\n` +
    `export { ${RENDER_EXPORTS.join(', ')} } from '@ng-email/render';\n`
  );
}

function findUp(name: string, from: string): string | undefined {
  let dir = from;
  for (;;) {
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}
