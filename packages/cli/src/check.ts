/**
 * Static checks on rendered email HTML: the problems that make an email look
 * broken or get it clipped in real inboxes, found without sending it.
 *
 * Used by `ng-email check` and the MCP server's render and check tools, so an
 * agent (or CI) can verify an email before anyone opens a mail client.
 */

export type CheckLevel = 'error' | 'warning';

export interface CheckIssue {
  level: CheckLevel;
  /** Stable rule id, for filtering. */
  rule: string;
  message: string;
  /** How many times the problem occurs, when it can occur more than once. */
  count?: number;
}

export interface CheckResult {
  /** Size of the HTML in bytes (UTF-8). */
  bytes: number;
  issues: CheckIssue[];
  /** No errors (warnings are allowed). */
  ok: boolean;
}

/** Gmail clips messages whose HTML is larger than this and hides the rest. */
export const GMAIL_CLIP_BYTES = 102 * 1024;
const NEAR_CLIP_BYTES = 90 * 1024;

const TAG = (name: string) => new RegExp(`<${name}\\b[^>]*>`, 'gi');
const attr = (tag: string, name: string): string | undefined => {
  const match = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match ? (match[2] ?? match[3] ?? match[4] ?? '') : undefined;
};
const styleOf = (tag: string) => (attr(tag, 'style') ?? '').toLowerCase().replace(/\s+/g, '');

function push(issues: CheckIssue[], level: CheckLevel, rule: string, message: string, count?: number) {
  issues.push(count === undefined ? { level, rule, message } : { level, rule, message, count });
}

/** Checks rendered HTML (and, optionally, its plain-text part). */
export function checkEmailHtml(html: string, text?: string): CheckResult {
  const issues: CheckIssue[] = [];
  const bytes = Buffer.byteLength(html, 'utf8');

  if (bytes > GMAIL_CLIP_BYTES) {
    push(issues, 'error', 'gmail-clip', `The HTML is ${(bytes / 1024).toFixed(1)} kB. Gmail clips anything over 102 kB and hides the rest behind "View entire message".`);
  } else if (bytes > NEAR_CLIP_BYTES) {
    push(issues, 'warning', 'gmail-clip', `The HTML is ${(bytes / 1024).toFixed(1)} kB, close to Gmail's 102 kB clipping limit.`);
  }

  if (!/<title\b[^>]*>[^<]+<\/title>/i.test(html)) {
    push(issues, 'warning', 'missing-title', 'No <title>. Some clients show it in the preview, and screen readers announce it.');
  }
  if (!/data-skip-in-text="true"[^>]*display:\s*none/i.test(html)) {
    push(issues, 'warning', 'missing-preview-text', 'No preview text. Add <nge-preview [text]="…" /> first in the body, or clients fill the inbox preview with body text.');
  }

  const images = html.match(TAG('img')) ?? [];
  const noAlt = images.filter((img) => attr(img, 'alt') === undefined).length;
  if (noAlt) push(issues, 'error', 'img-alt', 'Images without an alt attribute. Many clients block images by default; use alt="" only for decoration.', noAlt);
  const relative = images.filter((img) => {
    const src = attr(img, 'src');
    return src !== undefined && !/^(https?:|cid:|data:)/i.test(src);
  }).length;
  if (relative) push(issues, 'error', 'img-relative-src', 'Images with a relative src. Emails have no base URL: use absolute https:// URLs.', relative);
  const insecure = images.filter((img) => /^http:/i.test(attr(img, 'src') ?? '')).length;
  if (insecure) push(issues, 'warning', 'img-http', 'Images served over http://. Some clients block them; use https://.', insecure);
  const unsized = images.filter((img) => attr(img, 'width') === undefined).length;
  if (unsized) push(issues, 'warning', 'img-width', 'Images without a width attribute. Outlook ignores CSS widths and shows them at full size.', unsized);

  const links = html.match(TAG('a')) ?? [];
  const deadLinks = links.filter((a) => {
    const href = attr(a, 'href');
    return href === undefined || href === '' || href === '#' || /^javascript:/i.test(href);
  }).length;
  if (deadLinks) push(issues, 'error', 'link-href', 'Links with an empty, "#" or javascript: href.', deadLinks);
  const relativeLinks = links.filter((a) => {
    const href = attr(a, 'href') ?? '';
    return href !== '' && href !== '#' && !/^([a-z][a-z0-9+.-]*:|#|\{\{)/i.test(href);
  }).length;
  if (relativeLinks) push(issues, 'error', 'link-relative', 'Links with a relative href. Use absolute URLs (https://, mailto:, tel:).', relativeLinks);

  const styled = html.match(/<[a-z][a-z0-9]*\b[^>]*\sstyle\s*=\s*("[^"]*"|'[^']*')[^>]*>/gi) ?? [];
  const styles = styled.map(styleOf);
  const flex = styles.filter((s) => /display:(inline-)?(flex|grid)/.test(s)).length;
  if (flex) push(issues, 'warning', 'css-layout', 'Flexbox or grid in inline styles. Outlook and several webmail clients ignore them: use table ngeRow with td ngeColumn.', flex);
  const positioned = styles.filter((s) => /position:(absolute|fixed|sticky)/.test(s)).length;
  if (positioned) push(issues, 'warning', 'css-position', 'Positioned elements. Most clients strip position; lay out with tables instead.', positioned);
  const bgImage = styles.filter((s) => /background(-image)?:[^;]*url\(/.test(s) && !/background-color:/.test(s)).length;
  if (bgImage) push(issues, 'warning', 'css-background-image', 'Background images without a background-color. Classic Outlook does not show them, so set a solid fallback color.', bgImage);

  if (/<script\b/i.test(html)) push(issues, 'error', 'script', 'A <script> tag. Every email client strips scripts, and some spam filters penalise them.');
  if (/<form\b/i.test(html)) push(issues, 'warning', 'form', 'A <form>. Most clients disable forms in email; link to a page instead.');
  if (/<(video|audio|iframe|object|embed)\b/i.test(html)) push(issues, 'warning', 'embedded-media', 'Embedded media (video, audio, iframe). Clients strip it; link to it with a thumbnail image instead.');
  if (/<link\b[^>]*rel=["']?stylesheet/i.test(html)) push(issues, 'warning', 'external-css', 'An external stylesheet. Gmail and others ignore <link> stylesheets: use ngeStyle.');
  if (/\sng-version=|<!--ng|_ngcontent|_nghost/i.test(html)) push(issues, 'error', 'angular-leftovers', 'Angular attributes or comments in the output. Render with @ng-email/render, not Angular SSR.');

  if (text !== undefined && text.trim() === '') {
    push(issues, 'warning', 'empty-text', 'The plain-text part is empty. Spam filters score HTML-only emails lower.');
  }

  return { bytes, issues, ok: !issues.some((i) => i.level === 'error') };
}

/** One line per issue, for terminals and agent tool results. */
export function formatCheckIssues(result: CheckResult): string {
  if (result.issues.length === 0) return `✔ No problems found (${(result.bytes / 1024).toFixed(1)} kB of HTML).`;
  return result.issues
    .map((i) => `${i.level === 'error' ? '✖' : '!'} ${i.rule}: ${i.message}${i.count && i.count > 1 ? ` (${i.count}×)` : ''}`)
    .join('\n');
}
