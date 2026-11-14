import { describe, expect, test } from "bun:test";
import { isProblemDetails, LOOM_ERROR_CODES } from "./problem";

describe("LOOM_ERROR_CODES", () => {
  test("contains the contract codes", () => {
    expect(LOOM_ERROR_CODES.FORBIDDEN).toBe("LOOM_FORBIDDEN");
    expect(LOOM_ERROR_CODES.VALIDATION_FAILED).toBe("LOOM_VALIDATION_FAILED");
  });

  test("every code starts with the LOOM_ prefix", () => {
    for (const code of Object.values(LOOM_ERROR_CODES)) {
      expect(code.startsWith("LOOM_")).toBe(true);
    }
  });
});

describe("isProblemDetails", () => {
  test("accepts a complete problem", () => {
    const problem = {
      type: "https://loom.dev/errors/forbidden",
      title: "Forbidden",
      status: 403,
      code: "LOOM_FORBIDDEN",
      requestId: "req-1",
    };
    expect(isProblemDetails(problem)).toBe(true);
  });

  test("rejects a missing requestId", () => {
    const invalid = { type: "x", title: "x", status: 500, code: "LOOM_INTERNAL" };
    expect(isProblemDetails(invalid)).toBe(false);
  });

  test("rejects non-objects", () => {
    expect(isProblemDetails(null)).toBe(false);
    expect(isProblemDetails("forbidden")).toBe(false);
    expect(isProblemDetails(42)).toBe(false);
  });
});
