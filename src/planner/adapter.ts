import type { AdaptInput, Plan } from "./types.js";

export function buildAdaptUserPrompt(plan: Plan, input: AdaptInput): string {
  const snapshot = JSON.stringify(
    {
      goal: plan.goal,
      steps: plan.steps.map((s) => ({
        id: s.id,
        description: s.description,
        dependsOn: s.dependsOn,
      })),
    },
    null,
    2,
  );

  return `The following plan failed during execution.

${snapshot}

Failed step id: ${input.failedStepId}
Reason: ${input.failureReason}
${input.alternativeApproach ? `Suggested alternative: ${input.alternativeApproach}` : ""}

Revise the remaining work: update steps, dependencies, and estimates. Keep completed steps conceptually in the past; you may add/replace steps after the failure point.
Return the full revised plan (summary, steps with unique ids, dependsOn, estimates, assumptions, risks) as JSON matching the same schema as initial planning.`;
}
