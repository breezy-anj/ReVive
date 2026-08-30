import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function run() {
  const prompt = `You are ReVive AI — an expert product analyst that helps people find the best second life for products they no longer need. You think creatively and practically.

PRODUCT DETECTED: Glass Beer Bottles
CATEGORY: other
USER'S CITY/AREA: noida

USER'S ANSWERS:
- Condition: Excellent
- Age: Less than 1 year
- Still functional: Yes
- Accessories included: No

USER'S ADDITIONAL NOTES:
"I have an empty pack of whey protein that I used to use."
(Consider these notes carefully — the user may have described specific problems, preferences, or urgency that should influence your recommendations)

TASK: Generate 5-7 creative, actionable paths for what the user can do with this item. Think BEYOND just "sell/repair/donate/recycle". Include:
- Specific platforms/places to sell (with estimated price ranges in ₹)
- Creative repurposing/upcycling ideas (DIY projects)
- Specific organizations or types of places to donate
- Exchange/trade-in options with specific programs
- Repair options with estimated costs
- Environmental recycling options
- Any unique, creative ideas specific to this product

Consider the user's city for local suggestions when possible.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "product": {
    "name": "Full product name",
    "category": "category",
    "conditionScore": 95,
    "conditionLabel": "Excellent",
    "estimatedValueRange": "₹X,XXX - ₹X,XXX",
    "summary": "One line summary of the product's current state"
  },
  "paths": [
    {
      "id": 1,
      "title": "Short action title",
      "subtitle": "Where/how specifically",
      "icon": "appropriate emoji",
      "tag": "BEST VALUE / ECO-FRIENDLY / CREATIVE / QUICK & EASY / HIGH IMPACT / RECOMMENDED",
      "valueOrCost": "₹X,XXX - ₹X,XXX or Free or Cost: ₹X,XXX",
      "reasoning": "2-3 sentences explaining why this path makes sense for this specific product in this condition",
      "steps": ["Step 1 with specific detail", "Step 2", "Step 3", "Step 4"],
      "difficulty": "Easy / Medium / Hard",
      "timeEstimate": "Instant / 1-2 days / 1 week / 2-4 weeks",
      "environmentalImpact": "Brief note on environmental benefit",
      "isRecommended": false
    }
  ],
  "aiNote": "A brief personalized note from ReVive AI about the best overall approach (2-3 sentences)"
}

IMPORTANT:
- Exactly ONE path should have "isRecommended": true
- Order paths from most recommended to least
- Be specific: name actual platforms (OLX, Cashify, Facebook Marketplace, Amazon trade-in, etc.)
- Be specific: name actual types of places (kabadiwala, Croma exchange, local repair shops)
- For the user's city, mention specific local markets or areas if you know them
- Price estimates should be realistic for the Indian market
- Include at least one creative/unusual option`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });
    console.log(response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
