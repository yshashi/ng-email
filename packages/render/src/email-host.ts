import {
  Component,
  InjectionToken,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  inject,
} from '@angular/core';

/** Tag of the throwaway root element; it and everything outside it never reach the email. */
export const EMAIL_HOST_TAG = 'nge-root';

export interface RenderRequest {
  readonly component: Type<unknown>;
  /** Keyed by the input's public (template) name. */
  readonly inputs: ReadonlyMap<string, unknown>;
}

export const RENDER_REQUEST = new InjectionToken<RenderRequest>('ng-email RENDER_REQUEST');

/**
 * Generic, AOT-compiled root. Bootstrapped once per render; creates the
 * requested email component inside itself and applies inputs with setInput.
 */
@Component({
  selector: EMAIL_HOST_TAG,
  encapsulation: ViewEncapsulation.None,
  template: '<ng-container #outlet />',
})
export class EmailHost implements OnInit {
  @ViewChild('outlet', { static: true, read: ViewContainerRef })
  private outlet!: ViewContainerRef;

  private readonly request = inject(RENDER_REQUEST);

  ngOnInit(): void {
    const ref = this.outlet.createComponent(this.request.component);
    for (const [name, value] of this.request.inputs) {
      ref.setInput(name, value);
    }
  }
}
