import { describe, expect, it } from "vitest";
import { normalizePlanFromBody } from "../src/api/normalizePlan.js";

describe("normalizePlanFromBody", () => {
  it("returns null for invalid input", () => {
    expect(normalizePlanFromBody(null)).toBeNull();
    expect(normalizePlanFromBody({})).toBeNull();
    expect(normalizePlanFromBody({ goal: "g" })).toBeNull();
  });

  it("fills defaults for minimal valid plan", () => {
    const p = normalizePlanFromBody({
      goal: "Ship feature",
      steps: [
        {
          id: "a",
          description: "A",
          dependsOn: [],
          estimatedMinutes: 10,
          complexity: 1,
          risk: "low",
        },
      ],
    });
    expect(p).not.toBeNull();
    expect(p!.summary).toBe("");
    expect(p!.assumptions).toEqual([]);
    expect(p!.risks).toEqual([]);
    expect(p!.id).toBe("plan-import");
  });

  it("parses ISO createdAt", () => {
    const p = normalizePlanFromBody({
      goal: "g",
      steps: [],
      createdAt: "2020-01-01T00:00:00.000Z",
    });
    expect(p!.createdAt.toISOString()).toBe("2020-01-01T00:00:00.000Z");
  });
});
