import type { Catalog, CatalogEntry } from '../catalog.js';

/** Main thread → worker. */
export interface RenderRequest {
  id: number;
  name: string;
  inputs?: Record<string, unknown>;
}

/** Worker → main thread. */
export type WorkerMessage =
  | { type: 'ready'; source: Catalog['source']; entries: CatalogEntry[] }
  | { type: 'failed'; error: string }
  | { type: 'result'; id: number; ok: true; html: string; text: string; durationMs: number }
  | { type: 'result'; id: number; ok: false; unknown: boolean; error: string };

/** What the UI receives from `/api/state` and the `/api/events` stream. */
export interface PreviewState {
  status: 'building' | 'ready' | 'error';
  /** Increments on every successful build; the UI re-renders when it changes. */
  version: number;
  /** Build or load error, without terminal colors. Set alongside a still-usable previous build. */
  error: string | null;
  buildMs: number | null;
  source: Catalog['source'] | null;
  entries: CatalogEntry[];
}
