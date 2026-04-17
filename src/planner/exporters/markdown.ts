import type { Plan } from "../types.js";

export function planToMarkdown(plan: Plan): string {
  const lines: string[] = [];
  lines.push(`# Plan: ${plan.goal}`);
  lines.push("");
  lines.push(plan.summary);
  lines.push("");
  lines.push(`**Estimated total:** ${plan.totalEstimatedMinutes} minutes`);
  lines.push("");
  lines.push("## Steps");
  lines.push("");
  let i = 1;
  for (const s of plan.steps) {
    const deps =
      s.dependsOn.length > 0 ? ` _(depends on: ${s.dependsOn.join(", ")})_` : "";
    lines.push(`${i}. **${s.description}** — ${s.estimatedMinutes} min, complexity ${s.complexity}, risk ${s.risk}${deps}`);
    if (s.verification) {
      lines.push(`   - Verification: ${s.verification}`);
    }
    i += 1;
  }
  if (plan.assumptions.length) {
    lines.push("");
    lines.push("## Assumptions");
    for (const a of plan.assumptions) {
      lines.push(`- ${a}`);
    }
  }
  if (plan.risks.length) {
    lines.push("");
    lines.push("## Risks");
    for (const r of plan.risks) {
      lines.push(`- ${r}`);
    }
  }
  return lines.join("\n");
}
