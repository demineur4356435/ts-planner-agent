import type { PlanStep } from "./types.js";

export function flattenSteps(steps: PlanStep[]): PlanStep[] {
  const out: PlanStep[] = [];
  function visit(s: PlanStep): void {
    out.push(s);
    for (const c of s.subSteps ?? []) {
      visit(c);
    }
  }
  for (const s of steps) {
    visit(s);
  }
  return out;
}

export function totalEstimatedMinutes(steps: PlanStep[]): number {
  return flattenSteps(steps).reduce((acc, s) => acc + s.estimatedMinutes, 0);
}

export function trimStepsToMax(steps: PlanStep[], max: number): PlanStep[] {
  if (steps.length <= max) {
    return steps;
  }
  return steps.slice(0, max);
}
