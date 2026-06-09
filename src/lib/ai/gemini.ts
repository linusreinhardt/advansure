/*
  Gemini-Client-Wrapper (Google AI Studio).

  Kapselt SDK-Aufruf, Timeout und Retry mit exponentiellem Backoff
  (TU-02 Alternativablauf 1: bis zu zwei Wiederholungen bei Timeout/5xx).
  Liefert den rohen JSON-Text zurück; das Parsen/Validieren übernimmt der Aufrufer.
*/

import { GoogleGenAI, type Content, type Schema } from "@google/genai";

import { geminiApiKey, geminiModel } from "@/lib/ai/config";

let cached: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = geminiApiKey();
  if (!apiKey) {
    throw new Error("GOOGLE_AI_STUDIO_API_KEY ist nicht gesetzt.");
  }
  if (!cached) cached = new GoogleGenAI({ apiKey });
  return cached;
}

const TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3; // 1 Versuch + 2 Retries

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini-Timeout")), ms),
    ),
  ]);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface GenerateJsonInput {
  systemInstruction: string;
  contents: Content[];
  responseSchema: Schema;
  temperature?: number;
}

export async function generateJson({
  systemInstruction,
  contents,
  responseSchema,
  temperature = 0.4,
}: GenerateJsonInput): Promise<string> {
  const ai = getClient();
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: geminiModel(),
          contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
            temperature,
          },
        }),
        TIMEOUT_MS,
      );
      const text = response.text;
      if (!text) throw new Error("Leere Gemini-Antwort");
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(500 * 2 ** (attempt - 1)); // 500ms, 1000ms
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini-Aufruf fehlgeschlagen");
}
