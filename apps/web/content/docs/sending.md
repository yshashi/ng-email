# Sending

ng-email renders; your email provider sends. This page shows how to wire the two together in a Node service.

## Build once, import everywhere

Build your emails as part of your service's build:

```bash
npx ng-email build src/emails/index.ts -o dist/emails.mjs --minify
```

```ts
import { renderEmailBoth, WelcomeEmail } from './dist/emails.mjs';

const { html, text } = await renderEmailBoth(WelcomeEmail, {
  inputs: { name: user.name, url: 'https://example.com/app' },
});
```

The bundle is self-contained: Angular, the components and the renderer are inside it, and nothing else needs to be installed at runtime. It also writes `dist/emails.d.mts`, so `inputs` stay type-checked in your service.

> Keep the subject line next to the email. A small helper exported from the email file, such as `welcomeSubject(name)`, keeps copy changes in one place.

## Nodemailer (SMTP)

```ts
import nodemailer from 'nodemailer';
import { renderEmailBoth, WelcomeEmail } from './dist/emails.mjs';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const { html, text } = await renderEmailBoth(WelcomeEmail, { inputs: { name: 'Ada', url } });

await transporter.sendMail({
  from: 'Acme <hello@example.com>',
  to: 'ada@example.com',
  subject: 'Welcome to Acme',
  html,
  text,
});
```

## Resend

```ts
import { Resend } from 'resend';
import { renderEmailBoth, WelcomeEmail } from './dist/emails.mjs';

const resend = new Resend(process.env.RESEND_API_KEY);
const { html, text } = await renderEmailBoth(WelcomeEmail, { inputs: { name: 'Ada', url } });

await resend.emails.send({
  from: 'Acme <hello@example.com>',
  to: 'ada@example.com',
  subject: 'Welcome to Acme',
  html,
  text,
});
```

## Amazon SES

```ts
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { renderEmailBoth, WelcomeEmail } from './dist/emails.mjs';

const ses = new SESv2Client({ region: 'us-east-1' });
const { html, text } = await renderEmailBoth(WelcomeEmail, { inputs: { name: 'Ada', url } });

await ses.send(
  new SendEmailCommand({
    FromEmailAddress: 'hello@example.com',
    Destination: { ToAddresses: ['ada@example.com'] },
    Content: {
      Simple: {
        Subject: { Data: 'Welcome to Acme' },
        Body: { Html: { Data: html }, Text: { Data: text } },
      },
    },
  }),
);
```

## Postmark

```ts
import { ServerClient } from 'postmark';
import { renderEmailBoth, WelcomeEmail } from './dist/emails.mjs';

const postmark = new ServerClient(process.env.POSTMARK_SERVER_TOKEN!);
const { html, text } = await renderEmailBoth(WelcomeEmail, { inputs: { name: 'Ada', url } });

await postmark.sendEmail({
  From: 'hello@example.com',
  To: 'ada@example.com',
  Subject: 'Welcome to Acme',
  HtmlBody: html,
  TextBody: text,
});
```

Any other provider works the same way: it takes an HTML body and a text body. ng-email doesn't wrap provider SDKs, so you keep full access to each provider's features, such as tags, attachments and scheduling.

## Bundle size and cold starts

The bundle includes Angular's server renderer, a server-side DOM and the plain-text converter. A minified bundle for two emails is about 1 MB. In long-running services that only matters once, at startup. On serverless platforms, load the bundle at module scope so warm invocations reuse it.
