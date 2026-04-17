import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PlannerAgent } from "../planner/PlannerAgent.js";

async function main(): Promise<void> {
  let goal = process.argv.slice(2).join(" ").trim();
  if (!goal) {
    const rl = createInterface({ input, output });
    try {
      goal = (await rl.question("Goal: ")).trim();
    } finally {
      rl.close();
    }
  }

  if (!goal) {
    console.error("No goal provided.");
    process.exit(1);
  }

  const planner = new PlannerAgent({
    strategy: "top-down",
  });

  console.log("[Planner] Decomposing goal...");
  const plan = await planner.planInteractive(goal);

  console.log("\n" + plan.summary + "\n");
  console.log(`[Planner] Generated ${plan.steps.length} steps:\n`);

  plan.steps.forEach((step, i) => {
    const deps = step.dependsOn.length ? step.dependsOn.join(", ") : "none";
    console.log(
      `${i + 1}. ${step.description} (${step.estimatedMinutes} min) [depends on: ${deps}]`,
    );
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
