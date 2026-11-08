import { EmailButton } from './lib/button';
import { EmailHeading, EmailHr, EmailImg, EmailLink, EmailText } from './lib/content';
import { EmailFont } from './lib/font';
import {
  EmailBody,
  EmailColumn,
  EmailContainer,
  EmailHead,
  EmailHtml,
  EmailRow,
  EmailSection,
} from './lib/layout';
import { EmailPreview } from './lib/preview';

export { EmailButton } from './lib/button';
export { EmailHeading, EmailHr, EmailImg, EmailLink, EmailText } from './lib/content';
export { EmailFont, buildFontCss, type FallbackFont, type FontFormat, type WebFont } from './lib/font';
export {
  EmailBody,
  EmailColumn,
  EmailContainer,
  EmailHead,
  EmailHtml,
  EmailRow,
  EmailSection,
  type TextDirection,
} from './lib/layout';
export { EmailPreview, PREVIEW_MAX_LENGTH } from './lib/preview';
export {
  type EmailStyle,
  type StyleMap,
  type StyleValue,
  mergeStyles,
  parseStyle,
  toKebabCase,
  toStyleString,
} from './lib/style';
export { convertToPx, expandShorthand, parsePadding, pxToPt } from './lib/box';
export { computeHairSpaceFill } from './lib/button-math';

/** Every email component, for `imports: [EMAIL_COMPONENTS]`. */
export const EMAIL_COMPONENTS = [
  EmailHtml,
  EmailHead,
  EmailBody,
  EmailPreview,
  EmailContainer,
  EmailSection,
  EmailRow,
  EmailColumn,
  EmailText,
  EmailHeading,
  EmailLink,
  EmailButton,
  EmailImg,
  EmailHr,
  EmailFont,
] as const;
