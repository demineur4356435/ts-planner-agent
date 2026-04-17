import type { PlanStep } from "./types.js";

/**
 * Collects all step ids from a tree of steps.
 */
export function collectStepIds(steps: PlanStep[]): Set<string> {
  const ids = new Set<string>();
  function visit(s: PlanStep): void {
    ids.add(s.id);
    for (const c of s.subSteps ?? []) {
      visit(c);
    }
  }
  for (const s of steps) {
    visit(s);
  }
  return ids;
}

/**
 * Filters dependsOn to ids that exist; drops self-refs.
 */
export function sanitizeDependencies(steps: PlanStep[], validIds: Set<string>): PlanStep[] {
  function fix(s: PlanStep): PlanStep {
    const dependsOn = s.dependsOn.filter((d) => d !== s.id && validIds.has(d));
    const sub = s.subSteps?.map(fix);
    return { ...s, dependsOn, subSteps: sub };
  }
  return steps.map(fix);
}

/**
 * Kahn topological sort over top-level steps (dependsOn refers to top-level ids).
 * If cycles exist, breaks them by clearing dependencies on the lexicographically last stuck step.
 */
export function orderStepsDAG(steps: PlanStep[]): { ordered: PlanStep[]; hadCycle: boolean } {
  const byId = new Map(steps.map((s) => [s.id, s] as const));
  const ids = steps.map((s) => s.id);

  let mutable = steps.map((s) => ({ ...s, dependsOn: [...s.dependsOn] }));
  let hadCycle = false;

  for (;;) {
    const adj = new Map<string, string[]>();
    for (const id of ids) {
      adj.set(id, []);
    }
    const inDegree = new Map<string, number>();
    for (const id of ids) {
      inDegree.set(id, 0);
    }

    for (const s of mutable) {
      for (const d of s.dependsOn) {
        if (byId.has(d) && d !== s.id) {
          adj.get(d)!.push(s.id);
          inDegree.set(s.id, (inDegree.get(s.id) ?? 0) + 1);
        }
      }
    }

    const queue = ids.filter((id) => (inDegree.get(id) ?? 0) === 0).sort();
    const order: string[] = [];

    while (queue.length) {
      const n = queue.shift()!;
      order.push(n);
      for (const m of adj.get(n) ?? []) {
        const next = (inDegree.get(m) ?? 0) - 1;
        inDegree.set(m, next);
        if (next === 0) {
          queue.push(m);
          queue.sort();
        }
      }
    }

    if (order.length === ids.length) {
      const ordered = order.map((id) => byId.get(id)!);
      return { ordered, hadCycle };
    }

    hadCycle = true;
    const stuck = ids.filter((id) => !order.includes(id)).sort();
    const victim = stuck[stuck.length - 1];
    mutable = mutable.map((s) =>
      s.id === victim ? { ...s, dependsOn: [] } : s,
    );
  }
}
