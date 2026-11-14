import { describe, expect, test } from "bun:test";
import type { Id } from "./ids";
import { toId } from "./ids";

describe("toId", () => {
  test("returns the same runtime value", () => {
    // The brand is compile-time only, so the cast mirrors what a caller holds.
    expect(toId<"user">("u-1")).toBe("u-1" as Id<"user">);
  });

  test("produces a branded identifier usable as an Id", () => {
    const userId: Id<"user"> = toId("u-1");
    expect(userId.length).toBe(3);
  });
});
