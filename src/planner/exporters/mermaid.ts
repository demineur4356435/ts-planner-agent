import type { Plan } from "../types.js";

function escapeLabel(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, " ");
}

/**
 * Top-level dependency graph as Mermaid flowchart TD.
 */
export function planToMermaid(plan: Plan): string {
  const lines: string[] = ["flowchart TD"];
  for (const s of plan.steps) {
    const id = s.id.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`  ${id}["${escapeLabel(s.description)}"]`);
  }
  for (const s of plan.steps) {
    const to = s.id.replace(/[^a-zA-Z0-9_]/g, "_");
    for (const d of s.dependsOn) {
      const from = d.replace(/[^a-zA-Z0-9_]/g, "_");
      lines.push(`  ${from} --> ${to}`);
    }
  }
  return lines.join("\n");
}
