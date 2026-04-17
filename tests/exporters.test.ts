import { describe, expect, it } from "vitest";
import { planToMarkdown } from "../src/planner/exporters/markdown.js";
import { planToMermaid } from "../src/planner/exporters/mermaid.js";
import type { Plan } from "../src/planner/types.js";

const samplePlan: Plan = {
  id: "p",
  goal: "Test goal",
  summary: "Summary line.",
  steps: [
    {
      id: "a",
      description: "First",
      dependsOn: [],
      estimatedMinutes: 5,
      complexity: 1,
      risk: "low",
      verification: "Done",
    },
    {
      id: "b",
      description: "Second",
      dependsOn: ["a"],
      estimatedMinutes: 10,
      complexity: 2,
      risk: "medium",
    },
  ],
  totalEstimatedMinutes: 15,
  assumptions: ["Assume X"],
  risks: ["Risk Y"],
  createdAt: new Date("2020-01-01"),
};

describe("exporters", () => {
  it("renders markdown", () => {
    const md = planToMarkdown(samplePlan);
    expect(md).toContain("# Plan: Test goal");
    expect(md).toContain("Summary line.");
    expect(md).toContain("First");
    expect(md).toContain("Assume X");
  });

  it("renders mermaid", () => {
    const m = planToMermaid(samplePlan);
    expect(m).toContain("flowchart TD");
    expect(m).toContain("-->");
  });
});
