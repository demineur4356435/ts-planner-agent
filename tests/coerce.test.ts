import { describe, expect, it } from "vitest";
import {
  coerceIncludeVerification,
  coerceMaxSteps,
  coerceModelId,
  coercePlanningStrategy,
} from "../src/planner/coerce.js";

describe("coerce", () => {
  it("coerces planning strategy", () => {
    expect(coercePlanningStrategy("mixed")).toBe("mixed");
    expect(coercePlanningStrategy("bogus")).toBe("top-down");
    expect(coercePlanningStrategy(undefined)).toBe("top-down");
  });

  it("coerces max steps", () => {
    expect(coerceMaxSteps(undefined)).toBe(20);
    expect(coerceMaxSteps(Number.NaN)).toBe(20);
    expect(coerceMaxSteps("10")).toBe(10);
    expect(coerceMaxSteps(2)).toBe(3);
    expect(coerceMaxSteps(100)).toBe(50);
  });

  it("coerces includeVerification", () => {
    expect(coerceIncludeVerification("false")).toBe(false);
    expect(coerceIncludeVerification("true")).toBe(true);
    expect(coerceIncludeVerification(undefined, true)).toBe(true);
  });

  it("coerces model id", () => {
    expect(coerceModelId(undefined, "gpt-4o-mini")).toBe("gpt-4o-mini");
    expect(coerceModelId("  x  ", "y")).toBe("x");
  });
});
