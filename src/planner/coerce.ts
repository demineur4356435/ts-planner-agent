import type { PlanningStrategy } from "./types.js";

export function coercePlanningStrategy(value: unknown): PlanningStrategy {
  if (value === "top-down" || value === "bottom-up" || value === "mixed") {
    return value;
  }
  return "top-down";
}

/**
 * Clamps to [3, 50]; default 20. Non-finite or missing values yield 20.
 */
export function coerceMaxSteps(value: unknown): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n)) {
    return 20;
  }
  return Math.min(50, Math.max(3, Math.floor(n)));
}

export function coerceIncludeVerification(
  value: unknown,
  defaultValue = true,
): boolean {
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  return defaultValue;
}

export function coerceModelId(value: unknown, fallback: string): string {
  if (value == null) {
    return fallback;
  }
  const s = String(value).trim();
  return s.length > 0 ? s : fallback;
}
