import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CopyButton } from './copy-button';

/** A shell command on one line, with a copy button. */
@Component({
  selector: 'site-command',
  imports: [CopyButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-10 min-w-0 items-center gap-2 rounded-md border border-line bg-code pr-1 pl-3">
      <code class="min-w-0 flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap text-ink [scrollbar-width:none]">
        <span class="text-muted select-none" aria-hidden="true">$ </span>{{ command() }}
      </code>
      <site-copy [text]="command()" [iconOnly]="true" [ariaLabel]="label() || 'Copy command'" />
    </div>
  `,
  host: { class: 'block min-w-0' },
})
export class Command {
  readonly command = input.required<string>();
  readonly label = input('');
}
