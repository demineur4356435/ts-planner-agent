import type { Plan, PlanStep } from "../planner/types.js";

/**
 * Builds a full {@link Plan} from JSON (e.g. HTTP body). Fills safe defaults for optional fields.
 */
export function normalizePlanFromBody(raw: unknown): Plan | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const body = raw as Record<string, unknown>;
  if (typeof body.goal !== "string" || !Array.isArray(body.steps)) {
    return null;
  }

  const steps = body.steps as PlanStep[];

  const total =
    typeof body.totalEstimatedMinutes === "number" &&
    Number.isFinite(body.totalEstimatedMinutes)
      ? body.totalEstimatedMinutes
      : undefined;

  return {
    id: typeof body.id === "string" && body.id.length ? body.id : "plan-import",
    goal: body.goal,
    summary: typeof body.summary === "string" ? body.summary : "",
    steps,
    totalEstimatedMinutes: total ?? 0,
    assumptions: Array.isArray(body.assumptions)
      ? body.assumptions.filter((x): x is string => typeof x === "string")
      : [],
    risks: Array.isArray(body.risks)
      ? body.risks.filter((x): x is string => typeof x === "string")
      : [],
    createdAt: parseCreatedAt(body.createdAt),
  };
}

function parseCreatedAt(value: unknown): Date {
  if (value == null) {
    return new Date();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d;
    }
  }
  return new Date();
}
