/**
 * The block and template catalog. One list drives everything:
 *  - `emails` (defineEmails) is what `ng-email preview` / the generator render,
 *  - `catalog` is the metadata the website and `ng-email add` read.
 *
 * To add a block: create a self-contained file in blocks/ (or templates/)
 * that imports only @angular/core, @angular/common and @ng-email/components,
 * then add an entry below. Its inputs need defaults: previews render with no inputs.
 */
import type { Type } from '@angular/core';
import { defineEmail, defineEmails } from '@ng-email/render';

import { ArticleCard } from './blocks/article-card';
import { AvatarGroup } from './blocks/avatar-group';
import { AvatarProfile } from './blocks/avatar-profile';
import { ButtonFull } from './blocks/button-full';
import { ButtonPair } from './blocks/button-pair';
import { DividerLabel } from './blocks/divider-label';
import { FeaturesChecklist } from './blocks/features-checklist';
import { FeaturesGrid } from './blocks/features-grid';
import { FeedbackRating } from './blocks/feedback-rating';
import { FooterColumns } from './blocks/footer-columns';
import { FooterSimple } from './blocks/footer-simple';
import { GalleryGrid } from './blocks/gallery-grid';
import { HeaderCentered } from './blocks/header-centered';
import { HeaderSplit } from './blocks/header-split';
import { HeroCentered } from './blocks/hero-centered';
import { ListSteps } from './blocks/list-steps';
import { OrderSummary } from './blocks/order-summary';
import { PricingCard } from './blocks/pricing-card';
import { ProductCard } from './blocks/product-card';
import { StatsRow } from './blocks/stats-row';
import { TestimonialQuote } from './blocks/testimonial-quote';
import { LoginCodeEmail } from './templates/login-code';
import { PasswordResetEmail } from './templates/password-reset';
import { ReceiptEmail } from './templates/receipt';
import { TeamInviteEmail } from './templates/team-invite';
import { WelcomeEmail } from './templates/welcome';

export type BlockKind = 'block' | 'template';

export interface BlockMeta {
  /** URL- and file-safe id: `ng-email add <name>`. */
  name: string;
  title: string;
  description: string;
  category: string;
  kind: BlockKind;
  /** Source file, relative to src/. */
  file: string;
  /** Exported class name, for the import hint after `ng-email add`. */
  className: string;
  /** Element selector to use it inside another email (blocks only). */
  selector: string;
}

interface Entry extends BlockMeta {
  component: Type<unknown>;
}

type Info = Pick<BlockMeta, 'name' | 'title' | 'description' | 'category' | 'selector'>;

const block = (component: Type<unknown>, info: Info): Entry => ({
  ...info,
  kind: 'block',
  file: `blocks/${info.name}.ts`,
  className: component.name,
  component,
});

const template = (component: Type<unknown>, info: Info): Entry => ({
  ...info,
  kind: 'template',
  file: `templates/${info.name}.ts`,
  className: component.name,
  component,
});

const entries: Entry[] = [
  // ---- blocks -------------------------------------------------------------
  block(HeaderCentered, {
    name: 'header-centered',
    title: 'Header with centered menu',
    description: 'Wordmark centered above a row of navigation links.',
    category: 'Headers',
    selector: 'header-centered',
  }),
  block(HeaderSplit, {
    name: 'header-split',
    title: 'Header with side menu',
    description: 'Logo mark and wordmark on the left, links on the right.',
    category: 'Headers',
    selector: 'header-split',
  }),
  block(HeroCentered, {
    name: 'hero-centered',
    title: 'Centered hero',
    description: 'Eyebrow, headline, supporting text and one call to action.',
    category: 'Hero',
    selector: 'hero-centered',
  }),
  block(ButtonPair, {
    name: 'button-pair',
    title: 'Primary and secondary buttons',
    description: 'Two actions side by side, with Outlook-safe padding.',
    category: 'Buttons',
    selector: 'button-pair',
  }),
  block(ButtonFull, {
    name: 'button-full',
    title: 'Full-width button with fallback link',
    description: 'A block-level call to action plus a copyable link.',
    category: 'Buttons',
    selector: 'button-full',
  }),
  block(AvatarProfile, {
    name: 'avatar-profile',
    title: 'Avatar with name and role',
    description: 'Initials avatar that shows even with images blocked.',
    category: 'Avatars',
    selector: 'avatar-profile',
  }),
  block(AvatarGroup, {
    name: 'avatar-group',
    title: 'Avatar group',
    description: 'A row of initials avatars with a "+N" count.',
    category: 'Avatars',
    selector: 'avatar-group',
  }),
  block(FeaturesChecklist, {
    name: 'features-checklist',
    title: 'Feature checklist',
    description: 'Heading and a checklist of features with descriptions.',
    category: 'Features',
    selector: 'features-checklist',
  }),
  block(FeaturesGrid, {
    name: 'features-grid',
    title: 'Two-column feature grid',
    description: 'Numbered features laid out in a 2-column grid.',
    category: 'Features',
    selector: 'features-grid',
  }),
  block(ListSteps, {
    name: 'list-steps',
    title: 'Numbered steps',
    description: 'Onboarding or setup steps with numbered badges.',
    category: 'Lists',
    selector: 'list-steps',
  }),
  block(StatsRow, {
    name: 'stats-row',
    title: 'Stats row',
    description: 'Three key numbers with week-over-week change.',
    category: 'Stats',
    selector: 'stats-row',
  }),
  block(TestimonialQuote, {
    name: 'testimonial-quote',
    title: 'Customer quote',
    description: 'A quote with an accent rule, avatar, name and company.',
    category: 'Testimonials',
    selector: 'testimonial-quote',
  }),
  block(PricingCard, {
    name: 'pricing-card',
    title: 'Pricing card',
    description: 'One plan with price, inclusions and an upgrade button.',
    category: 'Pricing',
    selector: 'pricing-card',
  }),
  block(ProductCard, {
    name: 'product-card',
    title: 'Product card',
    description: 'Product image beside name, price and a buy button.',
    category: 'Ecommerce',
    selector: 'product-card',
  }),
  block(OrderSummary, {
    name: 'order-summary',
    title: 'Order summary',
    description: 'Line items with subtotal, shipping, tax and total.',
    category: 'Ecommerce',
    selector: 'order-summary',
  }),
  block(ArticleCard, {
    name: 'article-card',
    title: 'Article card',
    description: 'Cover image, category, headline, excerpt and link.',
    category: 'Articles',
    selector: 'article-card',
  }),
  block(GalleryGrid, {
    name: 'gallery-grid',
    title: 'Image grid',
    description: 'A 2×2 grid of linked images with alt text.',
    category: 'Gallery',
    selector: 'gallery-grid',
  }),
  block(DividerLabel, {
    name: 'divider-label',
    title: 'Divider with label',
    description: 'A horizontal rule with text in the middle.',
    category: 'Dividers',
    selector: 'divider-label',
  }),
  block(FeedbackRating, {
    name: 'feedback-rating',
    title: 'One-click rating',
    description: 'Score links from 1 to 5: no forms or scripts needed.',
    category: 'Feedback',
    selector: 'feedback-rating',
  }),
  block(FooterSimple, {
    name: 'footer-simple',
    title: 'Simple footer',
    description: 'Company, postal address and unsubscribe link.',
    category: 'Footers',
    selector: 'footer-simple',
  }),
  block(FooterColumns, {
    name: 'footer-columns',
    title: 'Footer with link columns',
    description: 'Brand and tagline with two columns of links and a legal line.',
    category: 'Footers',
    selector: 'footer-columns',
  }),

  // ---- templates ----------------------------------------------------------
  template(WelcomeEmail, {
    name: 'welcome',
    title: 'Welcome',
    description: 'Greeting, three first steps and a dashboard button.',
    category: 'Onboarding',
    selector: 'welcome-email',
  }),
  template(ReceiptEmail, {
    name: 'receipt',
    title: 'Order receipt',
    description: 'Items, totals, shipping address and order tracking.',
    category: 'Ecommerce',
    selector: 'receipt-email',
  }),
  template(PasswordResetEmail, {
    name: 'password-reset',
    title: 'Password reset',
    description: 'Reset button, expiry and a "not you?" note.',
    category: 'Authentication',
    selector: 'password-reset-email',
  }),
  template(LoginCodeEmail, {
    name: 'login-code',
    title: 'Sign-in code',
    description: 'A one-time code with a magic-link fallback.',
    category: 'Authentication',
    selector: 'login-code-email',
  }),
  template(TeamInviteEmail, {
    name: 'team-invite',
    title: 'Team invitation',
    description: 'Who invited them, to which team, and an accept button.',
    category: 'Collaboration',
    selector: 'team-invite-email',
  }),
];

export const catalog: BlockMeta[] = entries.map(({ component: _component, ...meta }) => meta);

export const emails = defineEmails(
  Object.fromEntries(entries.map((e) => [e.name, defineEmail(e.component, { description: e.title })])),
);
