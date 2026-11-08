/**
 * Render worker: one per successful build. Importing the bundle in a fresh
 * worker isolate gives a clean module graph every rebuild (no `vm`, no stale
 * ESM cache). The main thread terminates the previous worker after swapping.
 */
import { parentPort, workerData } from 'node:worker_threads';

import { UnknownEmailError, loadCatalog } from '../catalog.js';
import type { RenderRequest, WorkerMessage } from './protocol.js';

const port = parentPort;
if (!port) throw new Error('preview worker must run in a worker thread');

const send = (message: WorkerMessage) => port.postMessage(message);

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const code = (error as { code?: unknown }).code;
  return code && !error.message.includes(String(code)) ? `${error.name} [${code}]: ${error.message}` : `${error.name}: ${error.message}`;
}

try {
  const catalog = await loadCatalog((workerData as { bundleUrl: string }).bundleUrl);
  port.on('message', async (request: RenderRequest) => {
    try {
      const rendered = await catalog.render(request.name, request.inputs);
      send({ type: 'result', id: request.id, ok: true, ...rendered });
    } catch (error) {
      send({
        type: 'result',
        id: request.id,
        ok: false,
        unknown: error instanceof UnknownEmailError,
        error: describe(error),
      });
    }
  });
  send({ type: 'ready', source: catalog.source, entries: catalog.entries });
} catch (error) {
  send({ type: 'failed', error: describe(error) });
}
