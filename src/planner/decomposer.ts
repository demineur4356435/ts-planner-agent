import type { PlanContext } from "./types.js";
import type { PlanningStrategy } from "./types.js";

export function buildPlanningSystemPrompt(
  strategy: PlanningStrategy,
  maxSteps: number,
  includeVerification: boolean,
): string {
  const strategyText =
    strategy === "top-down"
      ? "Use a top-down approach: infer major phases or sub-goals first, then break each into concrete actions."
      : strategy === "bottom-up"
        ? "Use a bottom-up approach: list atomic actions first, then group and order them into a coherent sequence."
        : "Use a mixed approach: combine hierarchical phases with concrete executable tasks; keep the plan auditable.";

  const verifyLine = includeVerification
    ? "For each step, include a short verification string describing how success is checked."
    : "Omit verification fields (leave them unset).";

  return `You are an expert planning agent. ${strategyText}
Produce an ordered, dependency-aware plan with at most ${maxSteps} top-level steps (nested subSteps allowed but keep the plan readable).
${verifyLine}
Rules:
- Each step must have a unique string id (slug-like, e.g. step-1, auth-setup).
- dependsOn must list prerequisite step ids only (no cycles). Dependencies form a DAG.
- estimatedMinutes is realistic for a skilled developer unless the goal clearly implies otherwise.
- complexity is 1 (trivial) through 5 (very complex).
- risk is low, medium, or high.
- summary explains the overall approach in 2–4 sentences.
- assumptions lists explicit assumptions; risks lists major delivery risks.`;
}

export function buildPlanningUserPrompt(goal: string, context?: PlanContext): string {
  const lines = [`Goal:\n${goal.trim()}`];
  if (context?.constraints?.length) {
    lines.push("\nConstraints:");
    for (const c of context.constraints) {
      lines.push(`- ${c}`);
    }
  }
  lines.push(
    "\nReturn JSON matching the schema: summary, steps (with ids, dependsOn, estimates, complexity, risk), assumptions, risks.",
  );
  return lines.join("\n");
}
