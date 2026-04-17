import { describe, expect, it, vi, beforeEach } from "vitest";

const generateObjectMock = vi.fn();

vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObjectMock(...args),
}));

import { PlannerAgent } from "../src/planner/PlannerAgent.js";

describe("PlannerAgent", () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
    generateObjectMock.mockResolvedValue({
      object: {
        summary: "Do A then B.",
        steps: [
          {
            id: "a",
            description: "Step A",
            dependsOn: [],
            estimatedMinutes: 10,
            complexity: 1,
            risk: "low" as const,
            verification: "A ok",
          },
          {
            id: "b",
            description: "Step B",
            dependsOn: ["a"],
            estimatedMinutes: 5,
            complexity: 2,
            risk: "medium" as const,
            verification: "B ok",
          },
        ],
        assumptions: ["assume network"],
        risks: ["schedule"],
      },
    });
  });

  it("plans with mocked LLM", async () => {
    const planner = new PlannerAgent({ languageModel: {} as never });
    const plan = await planner.plan("Build a thing");
    expect(plan.steps).toHaveLength(2);
    expect(plan.totalEstimatedMinutes).toBe(15);
    expect(plan.summary).toContain("Do A");
  });

  it("compares two plans", async () => {
    const planner = new PlannerAgent({ languageModel: {} as never });
    const a = await planner.plan("x");
    const b = await planner.plan("y");
    const c = planner.compare(a, b);
    expect(c.stepCountDelta).toBe(0);
    expect(c.riskDistributionA.low).toBe(1);
  });

  it("coerces NaN maxSteps to default window", async () => {
    const planner = new PlannerAgent({
      languageModel: {} as never,
      maxSteps: Number.NaN,
    });
    const plan = await planner.plan("x");
    expect(plan.steps.length).toBeGreaterThan(0);
  });
});
