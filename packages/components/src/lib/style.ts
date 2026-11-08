/**
 * Style handling for email components.
 *
 * Components never use `[style.x]` / `[ngStyle]`: those go through the DOM's
 * CSSStyleDeclaration, which may drop non-standard `mso-*` properties and
 * reformats values. Instead each component builds one string and binds it
 * with `[attr.style]`, so the emitted text is exactly what we produce here.
 */

export type StyleValue = string | number | null | undefined;

/** Either a CSS declaration string or an object (camelCase or kebab-case keys). */
export type EmailStyle = string | Readonly<Record<string, StyleValue>>;

/** Ordered property → value map with kebab-case keys. */
export type StyleMap = Map<string, string>;

/** Properties whose numeric values are written without a unit. */
const UNITLESS = new Set([
  'line-height',
  'opacity',
  'font-weight',
  'z-index',
  'flex',
  'flex-grow',
  'flex-shrink',
  'order',
  'orphans',
  'widows',
  'zoom',
]);

/** `msoPaddingAlt` → `mso-padding-alt`, `WebkitTextSizeAdjust` → `-webkit-text-size-adjust`. */
export function toKebabCase(property: string): string {
  if (property.includes('-')) return property.toLowerCase();
  const kebab = property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  if (/^ms-(?!o-)/.test(kebab)) return `-${kebab}`; // msTransform → -ms-transform, msoX stays mso-x
  return kebab.startsWith('-') ? kebab : kebab.replace(/^(webkit|moz)-/, '-$1-');
}

function formatValue(property: string, value: StyleValue): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return undefined;
    return value === 0 || UNITLESS.has(property) ? String(value) : `${value}px`;
  }
  return value.trim();
}

/** Parses either style form into an ordered map. Later duplicates win. */
export function parseStyle(style: EmailStyle | null | undefined): StyleMap {
  const map: StyleMap = new Map();
  if (!style) return map;

  if (typeof style === 'string') {
    for (const declaration of style.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon === -1) continue;
      const property = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration.slice(colon + 1).trim();
      if (property && value) {
        map.delete(property);
        map.set(property, value);
      }
    }
    return map;
  }

  for (const [key, raw] of Object.entries(style)) {
    const property = toKebabCase(key);
    const value = formatValue(property, raw);
    map.delete(property);
    if (value !== undefined) map.set(property, value);
  }
  return map;
}

/**
 * Merges style parts left to right; a later part overrides an earlier one and
 * moves the property to its position in the later part.
 */
export function mergeStyles(...parts: Array<EmailStyle | StyleMap | null | undefined>): StyleMap {
  const merged: StyleMap = new Map();
  for (const part of parts) {
    const map = part instanceof Map ? part : parseStyle(part);
    for (const [property, value] of map) {
      merged.delete(property);
      merged.set(property, value);
    }
  }
  return merged;
}

/** Serializes to `a:b;c:d`. Returns `null` when empty so `[attr.style]` drops the attribute. */
export function toStyleString(style: StyleMap | EmailStyle | null | undefined): string | null {
  const map = style instanceof Map ? style : parseStyle(style);
  if (map.size === 0) return null;
  return Array.from(map, ([property, value]) => `${property}:${value}`).join(';');
}

/** Splits a style map into the entries whose property matches `predicate` and the rest. */
export function partitionStyle(
  map: StyleMap,
  predicate: (property: string) => boolean,
): [matching: StyleMap, rest: StyleMap] {
  const matching: StyleMap = new Map();
  const rest: StyleMap = new Map();
  for (const [property, value] of map) {
    (predicate(property) ? matching : rest).set(property, value);
  }
  return [matching, rest];
}
