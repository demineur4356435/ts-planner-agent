import { describe, expect, it, vi, beforeEach } from "vitest";

const generateObjectMock = vi.fn();

vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObjectMock(...args),
}));

import { PlannerAgent } from "../src/planner/PlannerAgent.js";
import type { Plan } from "../src/planner/types.js";

describe("adaptation", () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
    generateObjectMock.mockResolvedValue({
      object: {
        summary: "Revised plan after failure.",
        steps: [
          {
            id: "a",
            description: "Retry with backoff",
            dependsOn: [],
            estimatedMinutes: 20,
            complexity: 3,
            risk: "medium" as const,
          },
        ],
        assumptions: [],
        risks: [],
      },
    });
  });

  it("adapts a plan", async () => {
    const planner = new PlannerAgent({ languageModel: {} as never });
    const base: Plan = {
      id: "p",
      goal: "g",
      summary: "old",
      steps: [
        {
          id: "x",
          description: "failed",
          dependsOn: [],
          estimatedMinutes: 1,
          complexity: 1,
          risk: "low",
        },
      ],
      totalEstimatedMinutes: 1,
      assumptions: [],
      risks: [],
      createdAt: new Date(),
    };
    const next = await planner.adapt(base, {
      failedStepId: "x",
      failureReason: "rate limit",
    });
    expect(next.summary).toContain("Revised");
    expect(next.steps[0].description).toContain("Retry");
  });
});
