import { describe, expect, it } from "vitest";
import { ganttFromPlan } from "../src/planner/exporters/gantt.js";
import type { Plan } from "../src/planner/types.js";

describe("ganttFromPlan", () => {
  it("schedules dependencies with offsets", () => {
    const plan: Plan = {
      id: "p1",
      goal: "g",
      summary: "s",
      steps: [
        {
          id: "a",
          description: "A",
          dependsOn: [],
          estimatedMinutes: 10,
          complexity: 1,
          risk: "low",
        },
        {
          id: "b",
          description: "B",
          dependsOn: ["a"],
          estimatedMinutes: 5,
          complexity: 1,
          risk: "low",
        },
      ],
      totalEstimatedMinutes: 15,
      assumptions: [],
      risks: [],
      createdAt: new Date(),
    };
    const g = ganttFromPlan(plan);
    expect(g.find((t) => t.id === "a")?.startOffsetMinutes).toBe(0);
    expect(g.find((t) => t.id === "b")?.startOffsetMinutes).toBe(10);
  });
});
