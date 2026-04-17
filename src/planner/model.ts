import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing ${name}. Set it in .env or use OLLAMA_BASE_URL for local models.`,
    );
  }
  return v;
}

/**
 * Resolves a Vercel AI SDK language model from a logical id (e.g. openai/gpt-4o-mini, anthropic/claude-3-5-sonnet-20241022).
 */
export function resolveLanguageModel(modelId: string): LanguageModel {
  const ollamaBase = process.env.OLLAMA_BASE_URL;
  if (ollamaBase) {
    const client = createOpenAI({
      baseURL: `${ollamaBase.replace(/\/$/, "")}/v1`,
      apiKey: process.env.OLLAMA_API_KEY ?? "ollama",
    });
    const name = modelId.includes("/") ? modelId.split("/").pop()! : modelId;
    return client(name) as unknown as LanguageModel;
  }

  if (modelId.startsWith("anthropic/")) {
    const anthropic = createAnthropic({
      apiKey: requireEnv("ANTHROPIC_API_KEY"),
    });
    return anthropic(modelId.replace("anthropic/", "")) as unknown as LanguageModel;
  }

  if (process.env.GROQ_API_KEY && process.env.GROQ_BASE_URL) {
    const groq = createOpenAI({
      baseURL: process.env.GROQ_BASE_URL.replace(/\/$/, ""),
      apiKey: requireEnv("GROQ_API_KEY"),
    });
    const name = modelId.includes("/") ? modelId.split("/").pop()! : modelId;
    return groq(name) as unknown as LanguageModel;
  }

  const openai = createOpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
  });

  if (modelId.startsWith("openai/")) {
    return openai(modelId.replace("openai/", "")) as unknown as LanguageModel;
  }

  return openai(modelId) as unknown as LanguageModel;
}

export function defaultModelId(): string {
  return process.env.PLANNER_MODEL ?? "gpt-4o-mini";
}
