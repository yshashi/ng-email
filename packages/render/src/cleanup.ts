/**
 * Removal of Angular rendering artifacts from email markup.
 *
 * Rules (shared by the DOM pass and the string fallback):
 *  1. Comments: keep Outlook/IE conditional comments (`<!--[if ...]>`,
 *     `<!--<![endif]-->`), drop every other comment (Angular anchors such as
 *     `<!--container-->`, `<!--ng-container-->`, `<!---->`, dev-mode bindings).
 *  2. Attributes: drop Angular's own (`ng-version`, `ng-server-context`,
 *     `ngh`, `ngskiphydration`, `ng-reflect-*`, `_nghost-*`, `_ngcontent-*`)
 *     and ng-email selector attributes (`nge*`).
 *  3. Elements whose name contains a hyphen are component hosts (no real
 *     email element has one): unwrap them, keeping their children.
 */

const ELEMENT_NODE = 1;
const COMMENT_NODE = 8;

export function isOutlookConditionalComment(data: string): boolean {
  return data.startsWith('[if') || data.startsWith('<![endif]');
}

export function isFrameworkAttribute(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n === 'ng-version' ||
    n === 'ng-server-context' ||
    n === 'ngh' ||
    n === 'ngskiphydration' ||
    n.startsWith('ng-reflect-') ||
    n.startsWith('_nghost-') ||
    n.startsWith('_ngcontent-') ||
    /^nge[a-z]/.test(n)
  );
}

export function isComponentHostTag(localName: string): boolean {
  return localName.includes('-');
}

/** Cleans the children of `root` in place. `root` itself is left untouched. */
export function cleanupEmailDom(root: Element): void {
  for (const child of Array.from(root.childNodes)) {
    cleanNode(child);
  }
}

function cleanNode(node: ChildNode): void {
  if (node.nodeType === COMMENT_NODE) {
    if (!isOutlookConditionalComment((node as Comment).data)) {
      node.parentNode?.removeChild(node);
    }
    return;
  }
  if (node.nodeType !== ELEMENT_NODE) {
    return;
  }

  const element = node as Element;
  for (const child of Array.from(element.childNodes)) {
    cleanNode(child);
  }
  for (const attr of Array.from(element.attributes)) {
    if (isFrameworkAttribute(attr.name)) {
      element.removeAttribute(attr.name);
    }
  }
  if (isComponentHostTag(element.localName)) {
    unwrap(element);
  }
}

function unwrap(element: Element): void {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

/**
 * String-level version of the same rules, for HTML that did not come from
 * `renderEmail` (tests, tooling). Regex based: prefer the DOM pass.
 */
export function cleanupEmailHtml(html: string): string {
  return html
    .replace(/<!--([\s\S]*?)-->/g, (match, data: string) =>
      isOutlookConditionalComment(data) ? match : '',
    )
    .replace(/<([a-zA-Z][\w:.]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g,
      (_tag, name: string, attrs: string, selfClose: string) => {
        const kept = attrs.replace(
          /\s+([^\s"'>/=]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g,
          (attr, attrName: string) => (isFrameworkAttribute(attrName) ? '' : attr),
        );
        return `<${name}${kept}${selfClose ? ' /' : ''}>`;
      })
    .replace(/<\/?[a-zA-Z][\w.]*-[\w.-]*(?:\s[^>]*)?>/g, '');
}
