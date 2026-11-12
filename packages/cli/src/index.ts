export {
  DEFAULT_REGISTRY,
  RegistryError,
  addBlocks,
  listRegistry,
  readRegistryItem,
  type AddOptions,
  type AddResult,
  type RegistryIndexItem,
  type RegistryItem,
} from './add.js';
export { BuildError, buildEmails, type BuildEmailsOptions, type BuildEmailsResult } from './build.js';
export {
  type Catalog,
  type CatalogEntry,
  type RenderedEmail,
  UnknownEmailError,
  loadCatalog,
} from './catalog.js';
export { exportEmails, type ExportEmailsOptions, type ExportEmailsResult } from './export.js';
export { startPreview, type PreviewOptions, type PreviewServer } from './preview/server.js';
export type { PreviewState } from './preview/protocol.js';
export {
  type AngularLinkerPluginOptions,
  type LinkerCache,
  angularLinkerPlugin,
  createLinkerCache,
} from './linker.js';
export {
  type CheckIssue,
  type CheckLevel,
  type CheckResult,
  GMAIL_CLIP_BYTES,
  checkEmailHtml,
  formatCheckIssues,
} from './check.js';
export { type DocsMatch, DEFAULT_SITE, fetchDocsIndex, fetchDocsPage, searchDocs } from './docs.js';
export { type RenderEntryOptions, type RenderEntryResult, type RenderedEntryEmail, renderEntry } from './render-entry.js';
export { type McpServerOptions, createMcpServer, runMcpServer } from './mcp.js';
