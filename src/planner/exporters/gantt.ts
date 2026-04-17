import type { Plan, PlanStep } from "../types.js";

export interface GanttTask {
  id: string;
  name: string;
  startOffsetMinutes: number;
  durationMinutes: number;
  dependencies: string[];
}

/**
 * Builds a simple Gantt-style schedule from dependency order (critical path not optimized beyond topo order).
 */
export function ganttFromPlan(plan: Plan): GanttTask[] {
  const byId = new Map(plan.steps.map((s) => [s.id, s] as const));
  const memo = new Map<string, number>();

  function earliestStart(s: PlanStep): number {
    if (memo.has(s.id)) {
      return memo.get(s.id)!;
    }
    let start = 0;
    for (const d of s.dependsOn) {
      const p = byId.get(d);
      if (p) {
        start = Math.max(start, earliestStart(p) + p.estimatedMinutes);
      }
    }
    memo.set(s.id, start);
    return start;
  }

  return plan.steps.map((s) => ({
    id: s.id,
    name: s.description,
    startOffsetMinutes: earliestStart(s),
    durationMinutes: s.estimatedMinutes,
    dependencies: [...s.dependsOn],
  }));
}
