import "dotenv/config";
import express from "express";
import { parseListenPort } from "./listenPort.js";
import { normalizePlanFromBody } from "./normalizePlan.js";
import { PlannerAgent } from "../planner/PlannerAgent.js";
import type { AdaptInput, PlanContext } from "../planner/types.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

const port = parseListenPort();

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/plan", async (req, res) => {
  try {
    const goal = String(req.body?.goal ?? "");
    if (!goal.trim()) {
      res.status(400).json({ error: "Missing goal" });
      return;
    }
    const context = req.body?.context as PlanContext | undefined;
    const planner = new PlannerAgent({
      model: req.body?.model,
      strategy: req.body?.strategy,
      maxSteps: req.body?.maxSteps,
      includeVerification: req.body?.includeVerification,
    });
    const plan = await planner.plan(goal, context);
    res.json({
      ...plan,
      createdAt: plan.createdAt.toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: message });
  }
});

app.post("/adapt", async (req, res) => {
  try {
    const input = req.body?.input as AdaptInput | undefined;
    const normalized = normalizePlanFromBody(req.body?.plan);
    if (!normalized) {
      res.status(400).json({
        error:
          "Invalid plan: require plan.goal (string) and plan.steps (array)",
      });
      return;
    }
    if (
      !input?.failedStepId ||
      typeof input.failureReason !== "string"
    ) {
      res.status(400).json({ error: "Missing input.failedStepId or input.failureReason" });
      return;
    }
    const planner = new PlannerAgent({
      model: req.body?.model,
      strategy: req.body?.strategy,
      maxSteps: req.body?.maxSteps,
      includeVerification: req.body?.includeVerification,
    });
    const next = await planner.adapt(normalized, input);
    res.json({
      ...next,
      createdAt: next.createdAt.toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: message });
  }
});

const server = app.listen(port, () => {
  console.log(`ts-planner-agent API listening on http://localhost:${port}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set PORT in .env to another value.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
