import { generateObject } from "ai";
import type { LanguageModel } from "ai";
import { buildAdaptUserPrompt } from "./adapter.js";
import { buildPlanningSystemPrompt, buildPlanningUserPrompt } from "./decomposer.js";
import {
  collectStepIds,
  orderStepsDAG,
  sanitizeDependencies,
} from "./dependency.js";
import {
  coerceIncludeVerification,
  coerceMaxSteps,
  coerceModelId,
  coercePlanningStrategy,
} from "./coerce.js";
import { defaultModelId, resolveLanguageModel } from "./model.js";
import { planGenerationSchema } from "./schema.js";
import { totalEstimatedMinutes, trimStepsToMax } from "./estimator.js";
import { planToMermaid } from "./exporters/mermaid.js";
import type {
  AdaptInput,
  Plan,
  PlanComparison,
  PlanContext,
  PlannerAgentOptions,
  PlanningStrategy,
} from "./types.js";

function newPlanId(): string {
  return `plan-${crypto.randomUUID()}`;
}

export class PlannerAgent {
  private readonly modelId: string;
  private readonly strategy: PlanningStrategy;
  private readonly maxSteps: number;
  private readonly includeVerification: boolean;
  private readonly languageModel?: LanguageModel;

  constructor(options: PlannerAgentOptions = {}) {
    this.modelId = coerceModelId(options.model, defaultModelId());
    this.strategy = coercePlanningStrategy(options.strategy);
    this.maxSteps = coerceMaxSteps(options.maxSteps);
    this.includeVerification = coerceIncludeVerification(
      options.includeVerification,
      true,
    );
    this.languageModel = options.languageModel;
  }

  private getModel(): LanguageModel {
    return this.languageModel ?? resolveLanguageModel(this.modelId);
  }

  async plan(goal: string, context?: PlanContext): Promise<Plan> {
    const system = buildPlanningSystemPrompt(
      this.strategy,
      this.maxSteps,
      this.includeVerification,
    );
    const prompt = buildPlanningUserPrompt(goal, context);

    const { object } = await generateObject({
      model: this.getModel(),
      schema: planGenerationSchema,
      system,
      prompt,
    });

    let steps = trimStepsToMax(object.steps, this.maxSteps);
    const validIds = collectStepIds(steps);
    steps = sanitizeDependencies(steps, validIds);
    const { ordered, hadCycle } = orderStepsDAG(steps);
    steps = ordered;

    const assumptions = [...object.assumptions];
    if (hadCycle) {
      assumptions.push(
        "A dependency cycle was detected; the planner removed prerequisite edges from one step to produce a valid DAG.",
      );
    }

    if (!this.includeVerification) {
      steps = stripVerification(steps);
    }

    const plan: Plan = {
      id: newPlanId(),
      goal: goal.trim(),
      summary: object.summary,
      steps,
      totalEstimatedMinutes: totalEstimatedMinutes(steps),
      assumptions,
      risks: object.risks,
      createdAt: new Date(),
    };

    return plan;
  }

  async adapt(plan: Plan, input: AdaptInput): Promise<Plan> {
    const system = buildPlanningSystemPrompt(
      this.strategy,
      this.maxSteps,
      this.includeVerification,
    );
    const prompt = buildAdaptUserPrompt(plan, input);

    const { object } = await generateObject({
      model: this.getModel(),
      schema: planGenerationSchema,
      system,
      prompt,
    });

    let steps = trimStepsToMax(object.steps, this.maxSteps);
    const validIds = collectStepIds(steps);
    steps = sanitizeDependencies(steps, validIds);
    const { ordered, hadCycle } = orderStepsDAG(steps);
    steps = ordered;

    const assumptions = [...object.assumptions];
    if (hadCycle) {
      assumptions.push(
        "A dependency cycle was detected; the planner removed prerequisite edges from one step to produce a valid DAG.",
      );
    }

    if (!this.includeVerification) {
      steps = stripVerification(steps);
    }

    return {
      id: newPlanId(),
      goal: plan.goal,
      summary: object.summary,
      steps,
      totalEstimatedMinutes: totalEstimatedMinutes(steps),
      assumptions,
      risks: object.risks,
      createdAt: new Date(),
    };
  }

  toMermaid(plan: Plan): string {
    return planToMermaid(plan);
  }

  compare(a: Plan, b: Plan): PlanComparison {
    const dist = (p: Plan) => {
      const d: Record<"low" | "medium" | "high", number> = {
        low: 0,
        medium: 0,
        high: 0,
      };
      for (const s of p.steps) {
        d[s.risk] += 1;
      }
      return d;
    };
    const ra = dist(a);
    const rb = dist(b);
    const stepDelta = b.steps.length - a.steps.length;
    const minDelta = b.totalEstimatedMinutes - a.totalEstimatedMinutes;
    return {
      stepCountDelta: stepDelta,
      totalMinutesDelta: minDelta,
      riskDistributionA: ra,
      riskDistributionB: rb,
      summary: `Compared plans: B has ${stepDelta >= 0 ? stepDelta : -stepDelta} ${stepDelta >= 0 ? "more" : "fewer"} steps than A; total time delta ${minDelta >= 0 ? "+" : ""}${minDelta} minutes.`,
    };
  }

  async planInteractive(goal: string, context?: PlanContext): Promise<Plan> {
    let plan = await this.plan(goal, context);
    if (!process.stdin.isTTY) {
      return plan;
    }
    const readline = await import("node:readline/promises");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      const note = await rl.question(
        "\nAdjustments or extra constraints (Enter to keep plan): ",
      );
      if (note.trim()) {
        plan = await this.plan(goal, {
          ...context,
          constraints: [
            ...(context?.constraints ?? []),
            `User feedback: ${note.trim()}`,
          ],
        });
      }
    } finally {
      rl.close();
    }
    return plan;
  }
}

function stripVerification(steps: import("./types.js").PlanStep[]) {
  function walk(s: import("./types.js").PlanStep): import("./types.js").PlanStep {
    const { verification: _v, subSteps, ...rest } = s;
    return {
      ...rest,
      subSteps: subSteps?.map(walk),
    };
  }
  return steps.map(walk);
}
