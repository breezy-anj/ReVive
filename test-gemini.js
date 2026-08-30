import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function run() {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
    });
    console.log(response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
