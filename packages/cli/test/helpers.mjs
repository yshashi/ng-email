// Shared fixtures for the ng-email CLI end-to-end tests.
//
// Each test file creates its own throwaway consumer project under
// dist-test/cli/<name> (node --test runs files in parallel), with
// @ng-email/render and @ng-email/components linked to their built dist/.
// Run `npm run build` first; the root `test` script does.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export const repo = resolve(import.meta.dirname, '../../..');
export const cli = join(repo, 'packages/cli/dist/bin.js');

export async function write(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

export function run(args, cwd) {
  const r = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

/** Like `run`, but does not block the event loop (needed when the test itself serves HTTP). */
export function runAsync(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (d) => (stdout += d));
    child.stderr.setEncoding('utf8').on('data', (d) => (stderr += d));
    child.once('error', reject);
    child.once('close', (code) => resolve({ code, stdout, stderr }));
  });
}

export const WELCOME = `import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

@Component({
  selector: 'welcome-email',
  imports: [EMAIL_COMPONENTS],
  template: \`
    <html ngeHtml>
      <head ngeHead><title>Welcome</title></head>
      <body ngeBody>
        <nge-preview [text]="'Hi ' + name()" />
        <table ngeContainer>
          <h1 ngeHeading>Welcome, {{ name() }}</h1>
          <a ngeButton href="https://example.com/go" [ngeStyle]="{ padding: '12px 20px' }">Go</a>
        </table>
      </body>
    </html>\`,
})
export class WelcomeEmail {
  readonly name = input.required<string>();
}
`;

export const RECEIPT = `import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { EMAIL_COMPONENTS } from '@ng-email/components';

export interface Line { name: string; price: number }

@Component({
  selector: 'receipt-email',
  imports: [EMAIL_COMPONENTS, CurrencyPipe],
  template: \`
    <table ngeSection>
      @for (line of lines(); track line.name) {
        <p ngeText>{{ line.name }}: {{ line.price | currency: 'USD' }}</p>
      }
      <p ngeText>Total {{ total() | currency: 'USD' }}</p>
    </table>\`,
})
export class ReceiptEmail {
  readonly lines = input<Line[]>([]);
  total() {
    return this.lines().reduce((sum, l) => sum + l.price, 0);
  }
}
`;

/** Entry that only exports the components. */
export const INDEX_EXPORTS =
  "export { WelcomeEmail } from './welcome.email';\nexport { ReceiptEmail, type Line } from './receipt.email';\n";

/** Entry with a typed registry. */
export const INDEX_REGISTRY = `import { defineEmail, defineEmails } from '@ng-email/render';
import { ReceiptEmail } from './receipt.email';
import { WelcomeEmail } from './welcome.email';

export { WelcomeEmail, ReceiptEmail };

export const emails = defineEmails({
  welcome: defineEmail(WelcomeEmail, { previewInputs: { name: 'Ada' }, description: 'Sent after sign-up' }),
  receipt: defineEmail(ReceiptEmail, {
    previewInputs: { lines: [{ name: 'Mug', price: 12.5 }, { name: 'Tea', price: 30 }] },
  }),
});
`;

/** Creates dist-test/cli/<name> with a tsconfig, linked @ng-email packages and `files`. */
export async function createProject(name, files) {
  for (const pkg of ['render', 'components']) {
    if (!existsSync(join(repo, `packages/${pkg}/dist/package.json`))) {
      throw new Error(`packages/${pkg}/dist is missing: run "npm run build" first.`);
    }
  }
  const dir = join(repo, 'dist-test/cli', name);
  await rm(dir, { recursive: true, force: true });
  await write(
    join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ES2022',
          moduleResolution: 'bundler',
          lib: ['ES2022', 'DOM'],
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        angularCompilerOptions: { strictTemplates: true },
      },
      null,
      2,
    ),
  );
  await mkdir(join(dir, 'node_modules/@ng-email'), { recursive: true });
  for (const pkg of ['render', 'components']) {
    await symlink(join(repo, `packages/${pkg}/dist`), join(dir, `node_modules/@ng-email/${pkg}`), 'dir');
  }
  for (const [file, content] of Object.entries(files)) await write(join(dir, file), content);
  return dir;
}
