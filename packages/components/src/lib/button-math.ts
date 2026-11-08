/**
 * Outlook (Word engine) ignores padding on <a>. The workaround fills the
 * horizontal padding with hair spaces (U+200A) inside an MSO-only <i>, and
 * scales them with `mso-font-width` so their total width equals the padding.
 *
 * `mso-font-width` is capped here at 500%, so we look for the smallest number
 * of hair spaces whose required width per space stays at or under that cap.
 * A hair space is treated as half of the font-width unit wide, hence `/ 2`.
 */
const MAX_FONT_WIDTH = 5;

export interface HairSpaceFill {
  /** mso-font-width as a multiplier (1 = 100%). */
  fontWidth: number;
  /** Number of U+200A characters. */
  spaceCount: number;
}

export function computeHairSpaceFill(paddingPx: number | undefined): HairSpaceFill {
  const width = paddingPx ?? 0;
  if (width <= 0) return { fontWidth: 0, spaceCount: 0 };

  let spaceCount = 1;
  while (width / spaceCount / 2 > MAX_FONT_WIDTH) {
    spaceCount++;
  }
  return { fontWidth: width / spaceCount / 2, spaceCount };
}

/** Rounds to at most 4 decimals so output is stable and readable (e.g. 333.3333). */
export function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
