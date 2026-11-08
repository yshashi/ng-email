import { type FSWatcher, existsSync, watch } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { type IncomingMessage, type ServerResponse, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';

import { BuildError, type BuildEmailsOptions, buildEmails } from '../build.js';
import { createLinkerCache } from '../linker.js';
import type { PreviewState, RenderRequest, WorkerMessage } from './protocol.js';

export interface PreviewOptions extends Pick<BuildEmailsOptions, 'entry' | 'cwd' | 'tsconfig'> {
  /** Default 3000. Use 0 for any free port. */
  port?: number;
  /** Default 127.0.0.1 (local only). */
  host?: string;
  /** Angular dev mode for readable errors. Default true. */
  dev?: boolean;
  /** Directory watched for changes. Default: the tsconfig's directory, else `cwd`. */
  watchDir?: string;
  /** Called after each build attempt (for CLI logging). */
  onBuild?: (state: PreviewState) => void;
}

export interface PreviewServer {
  url: string;
  state(): PreviewState;
  /** Rebuild now (also triggered by file changes). Resolves when that build finishes. */
  rebuild(): Promise<void>;
  close(): Promise<void>;
}

const RENDER_TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = 1_000_000;
const WATCHED_EXTENSIONS = new Set(['.ts', '.mts', '.cts', '.html', '.css', '.json']);
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'out', '.angular', '.ng-email']);
const ANSI = /\u001b\[[0-9;]*m/g;

/** One loaded build: its worker thread and the bundle file it imported. */
class RenderWorker {
  private nextId = 1;
  private readonly pending = new Map<number, (message: WorkerMessage & { type: 'result' }) => void>();

  private constructor(
    private readonly worker: Worker,
    readonly bundle: string,
  ) {
    worker.on('message', (message: WorkerMessage) => {
      if (message.type === 'result') {
        this.pending.get(message.id)?.(message);
        this.pending.delete(message.id);
      }
    });
  }

  /** Starts a worker for `bundle` and waits until its catalog is loaded. */
  static start(bundle: string): Promise<{ worker: RenderWorker; ready: WorkerMessage & { type: 'ready' } }> {
    // Worker stdout carries Angular's per-render dev-mode notice: drop it. Keep stderr.
    const thread = new Worker(new URL('./worker.js', import.meta.url), {
      workerData: { bundleUrl: pathToFileURL(bundle).href },
      stdout: true,
      stderr: false,
    });
    thread.stdout.resume();
    return new Promise((resolvePromise, reject) => {
      const onMessage = (message: WorkerMessage) => {
        if (message.type === 'ready') {
          thread.off('message', onMessage);
          resolvePromise({ worker: new RenderWorker(thread, bundle), ready: message });
        } else if (message.type === 'failed') {
          void thread.terminate();
          reject(new Error(message.error));
        }
      };
      thread.on('message', onMessage);
      thread.once('error', reject);
    });
  }

  render(name: string, inputs: Record<string, unknown> | undefined) {
    const id = this.nextId++;
    return new Promise<WorkerMessage & { type: 'result' }>((resolvePromise, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Rendering "${name}" took longer than ${RENDER_TIMEOUT_MS / 1000}s.`));
      }, RENDER_TIMEOUT_MS);
      this.pending.set(id, (message) => {
        clearTimeout(timer);
        resolvePromise(message);
      });
      this.worker.postMessage({ id, name, inputs } satisfies RenderRequest);
    });
  }

  async stop(): Promise<void> {
    await this.worker.terminate();
    await rm(this.bundle, { force: true });
  }
}

export async function startPreview(options: PreviewOptions): Promise<PreviewServer> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const entry = resolve(cwd, options.entry);
  const tsconfig = options.tsconfig ? resolve(cwd, options.tsconfig) : undefined;
  const watchDir = resolve(cwd, options.watchDir ?? (tsconfig ? dirname(tsconfig) : cwd));
  const work = await mkdtemp(join(tmpdir(), 'ng-email-preview-'));
  const linkerCache = createLinkerCache();
  const ui = await readFile(new URL('../../preview-ui/index.html', import.meta.url), 'utf8');

  let state: PreviewState = { status: 'building', version: 0, error: null, buildMs: null, source: null, entries: [] };
  let current: RenderWorker | undefined;
  let building: Promise<void> | undefined;
  let queued = false;
  let buildCount = 0;
  const clients = new Set<ServerResponse>();

  const publish = (next: Partial<PreviewState>) => {
    state = { ...state, ...next };
    const frame = `event: state\ndata: ${JSON.stringify(state)}\n\n`;
    for (const client of clients) client.write(frame);
  };

  const runBuild = async (): Promise<void> => {
    publish({ status: 'building' });
    const started = performance.now();
    const bundle = join(work, `emails-${++buildCount}.mjs`);
    try {
      await buildEmails({ entry, cwd, tsconfig, dev: options.dev ?? true, outfile: bundle, dts: false, linkerCache });
      const { worker, ready } = await RenderWorker.start(bundle);
      const previous = current;
      current = worker;
      await previous?.stop();
      publish({
        status: 'ready',
        version: state.version + 1,
        error: null,
        buildMs: Math.round(performance.now() - started),
        source: ready.source,
        entries: ready.entries,
      });
    } catch (error) {
      await rm(bundle, { force: true });
      const message =
        error instanceof BuildError
          ? `${error.message}${error.details ? `\n\n${error.details}` : ''}`
          : error instanceof Error
            ? error.message
            : String(error);
      // Keep serving the last good build; the UI shows the error on top.
      publish({ status: 'error', error: message.replace(ANSI, ''), buildMs: Math.round(performance.now() - started) });
    }
    options.onBuild?.(state);
  };

  const rebuild = (): Promise<void> => {
    if (building) {
      queued = true;
      return building;
    }
    building = runBuild().finally(() => {
      building = undefined;
      if (queued) {
        queued = false;
        void rebuild();
      }
    });
    return building;
  };

  // ---- file watching -------------------------------------------------------
  let debounce: NodeJS.Timeout | undefined;
  let watcher: FSWatcher | undefined;
  if (existsSync(watchDir)) {
    watcher = watch(watchDir, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      const parts = filename.split(/[\\/]/);
      if (parts.some((p) => IGNORED_DIRS.has(p))) return;
      if (!WATCHED_EXTENSIONS.has(extname(filename))) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => void rebuild(), 80);
    });
  }

  // ---- HTTP ----------------------------------------------------------------
  const server = createServer((req, res) => {
    handle(req, res).catch((error: unknown) => {
      if (!res.headersSent) sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
      else res.end();
    });
  });

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;

    if (req.method === 'GET' && (path === '/' || path === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(ui);
      return;
    }
    if (req.method === 'GET' && path === '/api/state') {
      sendJson(res, 200, state);
      return;
    }
    if (req.method === 'GET' && path === '/api/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-store',
        connection: 'keep-alive',
      });
      res.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
      clients.add(res);
      const heartbeat = setInterval(() => res.write(': ping\n\n'), 15_000);
      req.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(res);
      });
      return;
    }

    const renderMatch = /^\/api\/render\/([^/]+)$/.exec(path);
    if (renderMatch && req.method === 'POST') {
      let body: { inputs?: unknown };
      try {
        const raw = await readBody(req);
        body = raw.trim() ? (JSON.parse(raw) as { inputs?: unknown }) : {};
      } catch (error) {
        sendJson(res, 400, { error: `Request body must be JSON: ${(error as Error).message}` });
        return;
      }
      if (body.inputs !== undefined && (typeof body.inputs !== 'object' || body.inputs === null || Array.isArray(body.inputs))) {
        sendJson(res, 400, { error: '"inputs" must be a JSON object.' });
        return;
      }
      const result = await renderFor(decodeURIComponent(renderMatch[1]!), body.inputs as Record<string, unknown> | undefined);
      sendJson(res, result.status, result.body);
      return;
    }

    const pageMatch = /^\/preview\/([^/]+)$/.exec(path);
    if (pageMatch && req.method === 'GET') {
      const result = await renderFor(decodeURIComponent(pageMatch[1]!), undefined);
      if (result.status === 200) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end((result.body as { html: string }).html);
      } else {
        res.writeHead(result.status, { 'content-type': 'text/plain; charset=utf-8' });
        res.end((result.body as { error: string }).error);
      }
      return;
    }

    sendJson(res, 404, { error: `Not found: ${req.method} ${path}` });
  }

  async function renderFor(name: string, inputs: Record<string, unknown> | undefined) {
    if (!current) {
      return { status: 503, body: { error: state.error ?? 'The first build has not finished yet.' } };
    }
    if (!state.entries.some((e) => e.name === name)) {
      return { status: 404, body: { error: `No email named "${name}".` } };
    }
    const message = await current.render(name, inputs);
    if (message.ok) {
      return { status: 200, body: { html: message.html, text: message.text, durationMs: message.durationMs } };
    }
    return { status: message.unknown ? 404 : 422, body: { error: message.error } };
  }

  await new Promise<void>((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 3000, options.host ?? '127.0.0.1', () => resolvePromise());
  });
  const address = server.address() as AddressInfo;
  const host = address.family === 'IPv6' ? `[${address.address}]` : address.address;
  const url = `http://${host}:${address.port}/`;

  await rebuild();

  return {
    url,
    state: () => state,
    rebuild,
    async close() {
      clearTimeout(debounce);
      watcher?.close();
      for (const client of clients) client.end();
      clients.clear();
      const closed = new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
      server.closeAllConnections();
      await closed;
      await building;
      await current?.stop();
      await rm(work, { recursive: true, force: true });
    },
  };
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolvePromise(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
