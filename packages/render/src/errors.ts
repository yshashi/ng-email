export type EmailRenderErrorCode =
  | 'NOT_A_COMPONENT'
  | 'UNKNOWN_INPUT'
  | 'COMPONENT_STYLES'
  | 'SCRIPT_IN_OUTPUT'
  | 'NO_OUTPUT';

/** Thrown for problems the renderer detects itself (as opposed to errors thrown by your component). */
export class EmailRenderError extends Error {
  override readonly name = 'EmailRenderError';

  constructor(
    readonly code: EmailRenderErrorCode,
    message: string,
  ) {
    super(`[${code}] ${message}`);
  }
}
