import { describe, expect, it } from "vitest";
import { orderStepsDAG, sanitizeDependencies } from "../src/planner/dependency.js";
import type { PlanStep } from "../src/planner/types.js";

describe("dependency", () => {
  it("orders a simple DAG", () => {
    const steps: PlanStep[] = [
      {
        id: "b",
        description: "B",
        dependsOn: ["a"],
        estimatedMinutes: 1,
        complexity: 1,
        risk: "low",
      },
      {
        id: "a",
        description: "A",
        dependsOn: [],
        estimatedMinutes: 1,
        complexity: 1,
        risk: "low",
      },
    ];
    const { ordered, hadCycle } = orderStepsDAG(steps);
    expect(hadCycle).toBe(false);
    expect(ordered.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("breaks cycles deterministically", () => {
    const steps: PlanStep[] = [
      {
        id: "a",
        description: "A",
        dependsOn: ["b"],
        estimatedMinutes: 1,
        complexity: 1,
        risk: "low",
      },
      {
        id: "b",
        description: "B",
        dependsOn: ["a"],
        estimatedMinutes: 1,
        complexity: 1,
        risk: "low",
      },
    ];
    const { hadCycle } = orderStepsDAG(steps);
    expect(hadCycle).toBe(true);
  });

  it("sanitizes unknown dependency ids", () => {
    const steps: PlanStep[] = [
      {
        id: "a",
        description: "A",
        dependsOn: ["ghost"],
        estimatedMinutes: 1,
        complexity: 1,
        risk: "low",
      },
    ];
    const valid = new Set(["a"]);
    const out = sanitizeDependencies(steps, valid);
    expect(out[0].dependsOn).toEqual([]);
  });
});
