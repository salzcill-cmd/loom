/**
 * Error contract shared by every package and by client error mapping.
 *
 * The wire shape follows RFC 9457 problem details, extended with a machine
 * code, a request correlation ID, and field-level issues. Clients branch on
 * `code`, never on message text.
 */

/** Stable machine codes for Loom errors. New codes are added, never renamed. */
export const LOOM_ERROR_CODES = {
  CONFIG_INVALID: "LOOM_CONFIG_INVALID",
  VALIDATION_FAILED: "LOOM_VALIDATION_FAILED",
  UNAUTHENTICATED: "LOOM_UNAUTHENTICATED",
  FORBIDDEN: "LOOM_FORBIDDEN",
  NOT_FOUND: "LOOM_NOT_FOUND",
  CONFLICT: "LOOM_CONFLICT",
  RATE_LIMITED: "LOOM_RATE_LIMITED",
  INTERNAL: "LOOM_INTERNAL",
} as const satisfies Record<string, string>;

/** One of the stable Loom error codes. */
export type LoomErrorCode = (typeof LOOM_ERROR_CODES)[keyof typeof LOOM_ERROR_CODES];

/** RFC 9457 problem details. */
export interface ProblemDetails {
  /** Stable URI identifying the error class. */
  type: string;
  /** Short human-readable summary. */
  title: string;
  /** HTTP status code. */
  status: number;
  /** Safe, non-sensitive explanation. */
  detail?: string;
  /** URI of the failing request, when meaningful. */
  instance?: string;
}

/** A validation failure attached to one field path. */
export interface FieldIssue {
  /** Field path the client can map back to a form control, e.g. `address.city`. */
  path: string;
  /** Machine code for the issue, for example `too_small`. */
  code: string;
  /** Localizable message. Clients render by `code`, not by message. */
  message: string;
}

/** A Loom error as it appears on the wire. */
export interface LoomProblem extends ProblemDetails {
  /** Machine code from {@link LOOM_ERROR_CODES}. */
  code: LoomErrorCode;
  /** Correlation ID, always present on framework-generated responses. */
  requestId: string;
  /** Field issues when the error is a validation failure. */
  errors?: FieldIssue[];
  /** Safe structured context. Never contains stack traces or SQL text. */
  meta?: Record<string, unknown>;
}

/**
 * Narrow an unknown value to {@link LoomProblem}.
 *
 * Structural check only: a valid-looking object that was not produced by the
 * framework can still pass. Callers should treat the result as untrusted data.
 */
export function isProblemDetails(value: unknown): value is LoomProblem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.type === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.status === "number" &&
    typeof candidate.code === "string" &&
    typeof candidate.requestId === "string"
  );
}
