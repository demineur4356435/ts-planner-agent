import { z } from "zod";

export const planStepSchema: z.ZodType<import("./types.js").PlanStep> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    description: z.string().min(1),
    dependsOn: z.array(z.string()),
    estimatedMinutes: z.number().nonnegative(),
    complexity: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
    risk: z.enum(["low", "medium", "high"]),
    verification: z.string().optional(),
    subSteps: z.array(planStepSchema).optional(),
  }),
);

export const planGenerationSchema = z.object({
  summary: z.string().min(1),
  steps: z.array(planStepSchema).min(1),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
});
