import OpenAI from "openai";
import "dotenv/config";

let cached: OpenAI | null = null;

export function getOpenAI() {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Ensure it exists in .env and restart `npm run dev`.",
    );
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

