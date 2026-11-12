import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { RegistryError, addBlocks, listRegistry, readRegistryItem } from './add.js';
import { BuildError } from './build.js';
import { formatCheckIssues } from './check.js';
import { fetchDocsIndex, fetchDocsPage, searchDocs } from './docs.js';
import { renderEntry } from './render-entry.js';

const INSTRUCTIONS = `ng-email turns standalone Angular components into email HTML that works in Gmail, Outlook and Apple Mail.

How to work with it:
- Before writing an email, read the docs (get_docs with no page for the index; "first-email", "components" and "styling" cover most work) and look for a block or template to start from (list_blocks, then get_block or add_blocks).
- Emails are standalone components that import EMAIL_COMPONENTS from @ng-email/components. Layout is tables (table ngeContainer, table ngeRow + td ngeColumn), styles go in [ngeStyle], per-recipient values are signal inputs. Never use component styles, flexbox or grid.
- An entry file (usually src/emails/index.ts) exports the emails, ideally as defineEmails({ ... }) with previewInputs.
- After every change, call render_email (or check_email) on the entry: it compiles the emails, renders them with their preview inputs and reports problems such as Gmail clipping, images without alt text or relative links. Fix errors before you finish.
- Tell the user they can preview with: npx ng-email preview <entry>.`;

type Args<T extends z.ZodRawShape> = z.infer<z.ZodObject<T>>;

const text = (value: string): CallToolResult => ({ content: [{ type: 'text', text: value }] });
const json = (value: unknown): CallToolResult => text(JSON.stringify(value, null, 2));
const failure = (message: string): CallToolResult => ({ content: [{ type: 'text', text: message }], isError: true });

/** Turns expected failures (bad input, compile errors, network) into tool errors the agent can act on. */
async function guard(run: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof BuildError) return failure(`${error.message}${error.details ? `\n\n${error.details}` : ''}`);
    if (error instanceof RegistryError) return failure(error.message);
    return failure(error instanceof Error ? error.message : String(error));
  }
}

function version(): string {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
  return pkg.version;
}

export interface McpServerOptions {
  /** Project root that relative paths resolve against. Default: the working directory. */
  cwd?: string;
  /** Registry URL or folder for blocks (default: the website, or $NG_EMAIL_REGISTRY). */
  registry?: string;
  /** Website URL or folder for docs (default: the website, or $NG_EMAIL_SITE). */
  site?: string;
}

/** Builds the ng-email MCP server (not yet connected to a transport). */
export function createMcpServer(options: McpServerOptions = {}): McpServer {
  const root = resolve(options.cwd ?? process.cwd());
  const { registry, site } = options;
  const projectPath = (dir: string | undefined) => resolve(root, dir ?? '.');
  const server = new McpServer({ name: 'ng-email', version: version() }, { instructions: INSTRUCTIONS });

  const listShape = {
    kind: z.enum(['block', 'template']).optional().describe('Only blocks (pieces of an email) or templates (complete emails)'),
    query: z.string().optional().describe('Words to match in the name, title, description or category, for example "receipt" or "button"'),
  };
  server.registerTool(
    'list_blocks',
    {
      title: 'List blocks and templates',
      description:
        'Lists the ready-made email blocks (headers, buttons, pricing, footers, …) and complete templates (welcome, receipt, password reset, …) that can be added to the project.',
      inputSchema: listShape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    ({ kind, query }: Args<typeof listShape>) =>
      guard(async () => {
        const words = (query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
        const items = (await listRegistry(registry, root)).filter(
          (item) =>
            (!kind || item.kind === kind) &&
            words.every((w) => `${item.name} ${item.title} ${item.description} ${item.category}`.toLowerCase().includes(w)),
        );
        if (items.length === 0) return text('Nothing matches. Call list_blocks without a query to see everything.');
        return json(
          items.map(({ name, kind, category, title, description, selector, className }) => ({
            name,
            kind,
            category,
            title,
            description,
            selector,
            className,
          })),
        );
      }),
  );

  const getShape = { name: z.string().describe('Block or template name from list_blocks, for example "button-pair"') };
  server.registerTool(
    'get_block',
    {
      title: 'Get a block’s source',
      description:
        'Returns the Angular source of one block or template, what it imports and how to use it, without changing the project. Use add_blocks to copy it into the project.',
      inputSchema: getShape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    ({ name }: Args<typeof getShape>) =>
      guard(async () => {
        const item = await readRegistryItem(name, registry, root);
        if (!item) return failure(`No block or template named "${name}". Call list_blocks to see the names.`);
        const usage =
          item.kind === 'block'
            ? `Use it inside an email template, within table ngeContainer: <${item.selector} /> (add ${item.className} to the component's imports).`
            : `It is a complete email: render it with renderEmailBoth(${item.className}, { inputs: { … } }) or add it to defineEmails().`;
        const files = item.files.map((f) => `// ${f.path}\n${f.content}`).join('\n\n');
        return text(
          `${item.title} (${item.kind}, ${item.category})\n${item.description}\n\n${usage}\nDependencies: ${item.dependencies.join(', ') || 'none'}\nAdd it with: npx ng-email add ${item.name}\n\n${files}`,
        );
      }),
  );

  const addShape = {
    names: z.array(z.string()).min(1).describe('Block or template names from list_blocks'),
    dir: z.string().optional().describe('Folder for the files, relative to the project (default src/emails/blocks)'),
    overwrite: z.boolean().optional().describe('Replace files that already exist (default false)'),
    projectDir: z.string().optional().describe('Project root, relative to the server’s working directory (default: the working directory)'),
  };
  server.registerTool(
    'add_blocks',
    {
      title: 'Add blocks to the project',
      description:
        'Copies blocks or templates into the project as editable .ts files (the same as "npx ng-email add"). Returns the files written and the import line for each.',
      inputSchema: addShape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    ({ names, dir, overwrite, projectDir }: Args<typeof addShape>) =>
      guard(async () => {
        const cwd = projectPath(projectDir);
        const result = await addBlocks({ names, dir, overwrite, registry, cwd });
        const lines: string[] = [];
        for (const { item, files } of result.added) {
          const file = relative(cwd, files[0]!).replace(/\\/g, '/');
          lines.push(`Added ${item.name}: ${file}`);
          lines.push(`  import { ${item.className} } from './${file.replace(/\.ts$/, '')}';  (path relative to the project root)`);
          lines.push(item.kind === 'block' ? `  use: <${item.selector} />` : `  render: renderEmailBoth(${item.className}, { inputs: { … } })`);
        }
        for (const { name, reason } of result.skipped) lines.push(`Skipped ${name}: ${reason}`);
        if (result.missingDependencies.length) lines.push(`Install first: npm install ${result.missingDependencies.join(' ')}`);
        const output = lines.join('\n');
        return result.added.length === 0 ? failure(output) : text(output);
      }),
  );

  const entryShape = {
    entry: z.string().describe('Entry file that exports the emails, relative to the project, for example "src/emails/index.ts"'),
    projectDir: z.string().optional().describe('Project root, relative to the server’s working directory (default: the working directory)'),
    tsconfig: z.string().optional().describe('tsconfig to compile with (default: the nearest one to the entry)'),
  };
  server.registerTool(
    'list_emails',
    {
      title: 'List the project’s emails',
      description: 'Compiles the entry and lists its emails with their inputs and preview inputs.',
      inputSchema: entryShape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ entry, projectDir, tsconfig }: Args<typeof entryShape>) =>
      guard(async () => {
        const result = await renderEntry({ entry, tsconfig, cwd: projectPath(projectDir), names: [] });
        if (result.entries.length === 0) {
          return failure('No emails found. Export a defineEmails({ … }) registry, or email components, from the entry.');
        }
        return json(result.entries);
      }),
  );

  const renderShape = {
    ...entryShape,
    name: z.string().optional().describe('Email name from list_emails (default: every email in the entry)'),
    inputs: z.record(z.string(), z.unknown()).optional().describe('Input values (default: the email’s previewInputs)'),
    output: z.enum(['text', 'html', 'both']).optional().describe('What to return besides the check results (default "text"; "html" can be long)'),
  };
  server.registerTool(
    'render_email',
    {
      title: 'Render and check an email',
      description:
        'Compiles the entry, renders an email the way the inbox receives it and checks the result: Gmail clipping, images without alt text, relative URLs, flexbox, missing preview text and more. Returns the plain-text version (or the HTML) and the problems found.',
      inputSchema: renderShape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ entry, projectDir, tsconfig, name, inputs, output = 'text' }: Args<typeof renderShape>) =>
      guard(async () => {
        const result = await renderEntry({ entry, tsconfig, cwd: projectPath(projectDir), names: name ? [name] : undefined, inputs });
        const parts: string[] = [];
        for (const email of result.rendered) {
          parts.push(`## ${email.name}: ${(email.check.bytes / 1024).toFixed(1)} kB, rendered in ${email.durationMs} ms`);
          parts.push(formatCheckIssues(email.check));
          if (output !== 'html') parts.push(`### Plain text\n${email.text}`);
          if (output !== 'text') parts.push(`### HTML\n${email.html}`);
        }
        for (const { name: failed, error } of result.failed) parts.push(`## ${failed}: failed to render\n${error}`);
        if (parts.length === 0) return failure('No emails found in the entry.');
        const output_ = parts.join('\n\n');
        return result.failed.length > 0 && result.rendered.length === 0 ? failure(output_) : text(output_);
      }),
  );

  const checkShape = { ...entryShape, name: renderShape.name };
  server.registerTool(
    'check_email',
    {
      title: 'Check emails for inbox problems',
      description:
        'Renders the entry’s emails with their preview inputs and reports only the problems, for a quick pass after editing. Same checks as render_email.',
      inputSchema: checkShape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ entry, projectDir, tsconfig, name }: Args<typeof checkShape>) =>
      guard(async () => {
        const result = await renderEntry({ entry, tsconfig, cwd: projectPath(projectDir), names: name ? [name] : undefined });
        const lines = result.rendered.map((e) => `## ${e.name}\n${formatCheckIssues(e.check)}`);
        for (const { name: failed, error } of result.failed) lines.push(`## ${failed}: failed to render\n${error}`);
        if (lines.length === 0) return failure('No emails found in the entry.');
        const hasErrors = result.failed.length > 0 || result.rendered.some((e) => !e.check.ok);
        return hasErrors ? failure(lines.join('\n\n')) : text(lines.join('\n\n'));
      }),
  );

  const docsShape = { page: z.string().optional().describe('Page slug from the index, for example "styling" (default: the index of all pages)') };
  server.registerTool(
    'get_docs',
    {
      title: 'Read the ng-email docs',
      description: 'Returns one documentation page as Markdown, or the index of all pages when no page is given.',
      inputSchema: docsShape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    ({ page }: Args<typeof docsShape>) =>
      guard(async () => {
        if (!page) return text(await fetchDocsIndex(site));
        const markdown = await fetchDocsPage(page, site);
        return markdown === undefined ? failure(`No docs page "${page}". Call get_docs without a page for the index.`) : text(markdown);
      }),
  );

  const searchShape = { query: z.string().min(2).describe('What to look for, for example "outlook button padding"') };
  server.registerTool(
    'search_docs',
    {
      title: 'Search the ng-email docs',
      description: 'Finds the documentation sections that mention every word of the query.',
      inputSchema: searchShape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    ({ query }: Args<typeof searchShape>) =>
      guard(async () => {
        const matches = await searchDocs(query, site);
        if (matches.length === 0) return text(`No section mentions all of "${query}". Try fewer words, or get_docs for the index.`);
        return text(matches.map((m) => `## ${m.heading} (page: ${m.page})\n\n${m.excerpt}`).join('\n\n---\n\n'));
      }),
  );

  return server;
}

/** Runs the MCP server on stdio until the client disconnects. */
export async function runMcpServer(options: McpServerOptions = {}): Promise<void> {
  // stdout carries the protocol: anything else printed there (Angular's dev
  // mode notice, a stray console.log in an email) would corrupt it.
  for (const method of ['log', 'info', 'debug'] as const) console[method] = console.error.bind(console);
  const server = createMcpServer(options);
  await server.connect(new StdioServerTransport());
}
