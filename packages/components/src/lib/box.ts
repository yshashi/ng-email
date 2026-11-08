import type { StyleMap } from './style';

/** Width used to resolve percentage padding (the conventional email body width). */
const PERCENT_BASE_PX = 600;
/** Pixels per em/rem. */
const EM_PX = 16;

export interface BoxSides<T> {
  top: T;
  right: T;
  bottom: T;
  left: T;
}

/**
 * Converts one CSS length to px.
 * `undefined`/`''` → undefined; unsupported or invalid → 0 (so it does not break layout math).
 */
export function convertToPx(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;

  const match = /^(-?[\d.]+)(px|em|rem|%)?$/.exec(value.trim());
  if (!match) return 0;
  const amount = Number.parseFloat(match[1]!);
  if (Number.isNaN(amount)) return 0;
  switch (match[2]) {
    case 'em':
    case 'rem':
      return amount * EM_PX;
    case '%':
      return (amount / 100) * PERCENT_BASE_PX;
    case 'px':
      return amount;
    default:
      // A bare number is not a valid CSS length (and is 0 when it is "0").
      return 0;
  }
}

/** Expands a 1–4 value shorthand (`10px 20px`) into sides. */
export function expandShorthand(value: string | undefined): BoxSides<string | undefined> {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  const [a, b = a, c = a, d = b] = parts;
  return { top: a, right: b, bottom: c, left: d };
}

/**
 * Reads `<prefix>` shorthand and `<prefix>-<side>` longhands from a style map,
 * in map order, so whichever is declared later wins (CSS cascade within one rule).
 */
export function readBox(map: StyleMap, prefix: 'padding' | 'margin'): BoxSides<string | undefined> {
  const box: BoxSides<string | undefined> = {
    top: undefined,
    right: undefined,
    bottom: undefined,
    left: undefined,
  };
  for (const [property, value] of map) {
    if (property === prefix) {
      Object.assign(box, expandShorthand(value));
    } else if (property.startsWith(`${prefix}-`)) {
      const side = property.slice(prefix.length + 1);
      if (side === 'top' || side === 'right' || side === 'bottom' || side === 'left') {
        box[side] = value;
      }
    }
  }
  return box;
}

/** Padding sides in px, as the Button's Outlook math needs them. */
export function parsePadding(map: StyleMap): BoxSides<number | undefined> {
  const box = readBox(map, 'padding');
  return {
    top: convertToPx(box.top),
    right: convertToPx(box.right),
    bottom: convertToPx(box.bottom),
    left: convertToPx(box.left),
  };
}

/** px → pt (Outlook's Word engine measures in points). */
export function pxToPt(px: number | undefined): number | undefined {
  return typeof px === 'number' && !Number.isNaN(px) ? (px * 3) / 4 : undefined;
}

export function isBoxProperty(property: string, prefix: 'padding' | 'margin'): boolean {
  return property === prefix || property.startsWith(`${prefix}-`);
}
