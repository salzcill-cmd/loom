/**
 * HTTP handler contract.
 *
 * Every route handler takes the platform `Request`, a Loom request context,
 * and validated input, and returns the handler result or a `Response`.
 * HTTP server libraries are mounted behind adapters and never appear in
 * business code.
 */

/** The principal attached to a request by authentication. */
export interface PrincipalLike {
  /** Principal identifier, stable across sessions. */
  id: string;
  /** Role names used for authorization. */
  roles: readonly string[];
}

/** Per-request context every handler receives. */
export interface RequestContextLike {
  /** Correlation ID, accepted from inbound headers when valid. */
  requestId: string;
  /** Authenticated principal, or `null` for anonymous requests. */
  principal: PrincipalLike | null;
}

/** Arguments every handler receives. */
export interface HandlerArgs<Input> {
  /** Platform request. Body access goes through `input`, not here. */
  request: Request;
  /** Loom request context. */
  ctx: RequestContextLike;
  /** Validated and typed input for the route. */
  input: Input;
}

/**
 * A route handler.
 *
 * Return the typed result and let the adapter serialize it, or return a
 * `Response` directly for streams and downloads.
 */
export type Handler<Input, Output> = (args: HandlerArgs<Input>) => Promise<Output | Response>;
