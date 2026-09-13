import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not configured");
}

export const gemini = apiKey ? new GoogleGenAI({ apiKey }) : null;
