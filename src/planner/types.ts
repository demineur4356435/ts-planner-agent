import type { LanguageModel } from "ai";

export interface PlanStep {
  id: string;
  description: string;
  dependsOn: string[];
  estimatedMinutes: number;
  complexity: 1 | 2 | 3 | 4 | 5;
  risk: "low" | "medium" | "high";
  verification?: string;
  subSteps?: PlanStep[];
}

export interface Plan {
  id: string;
  goal: string;
  summary: string;
  steps: PlanStep[];
  totalEstimatedMinutes: number;
  assumptions: string[];
  risks: string[];
  createdAt: Date;
}

export type PlanningStrategy = "top-down" | "bottom-up" | "mixed";

export interface PlannerAgentOptions {
  model?: string;
  strategy?: PlanningStrategy;
  maxSteps?: number;
  includeVerification?: boolean;
  /** When set (e.g. in tests), used instead of resolving credentials from the environment. */
  languageModel?: LanguageModel;
}

export interface PlanContext {
  constraints?: string[];
}

export interface AdaptInput {
  failedStepId: string;
  failureReason: string;
  alternativeApproach?: string;
}

export interface PlanComparison {
  stepCountDelta: number;
  totalMinutesDelta: number;
  riskDistributionA: Record<PlanStep["risk"], number>;
  riskDistributionB: Record<PlanStep["risk"], number>;
  summary: string;
}
