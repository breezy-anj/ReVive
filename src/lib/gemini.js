import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function moderateImage(base64Image, mimeType = "image/jpeg") {
  const prompt = `You are a content moderation AI for "ReVive", an app that helps people find the best second life for products they no longer need.

Analyze this image and determine:
1. Is this a physical product/item that someone could potentially sell, repair, donate, repurpose, exchange, or recycle?
2. Valid items include: electronics, furniture, appliances, kitchenware, sports equipment, clothing, books, tools, toys, vehicles, accessories, bags, shoes, musical instruments, stationery, bottles, flasks, containers — basically ANY physical man-made product.
3. Invalid items include: people/selfies, pets/animals, food, nature/scenery, inappropriate/NSFW content, screenshots, memes, random abstract images.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "isProduct": true or false,
  "productName": "detected product name" or null,
  "category": "electronics/furniture/appliance/kitchenware/clothing/sports/books/tools/toys/accessories/other" or null,
  "rejectionReason": "pet/food/person/inappropriate/nature/other" or null,
  "rejectionMessage": "A funny, friendly rejection message" or null
}

Rejection message examples by type:
- pet: "That's adorable, but ReVive is for products, not pets! Try scanning something you want to give a second life. 🐕"
- food: "Looks delicious, but we can't recycle pizza! Scan an old gadget, chair, or anything reusable instead. 🍕"
- person: "Great photo! But we're looking for items to revive, not people. Try scanning something you own. 📸"
- inappropriate: "This content isn't appropriate. ReVive helps products find new life. 🚫"
- nature: "Beautiful view! But scan a product — a phone, a chair, a flask — anything you want to repurpose. 🌳"
- other: "Hmm, that doesn't look like something we can help with. Try scanning a product you want to give a second life! 🤔"`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text.trim();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Moderation error:", error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

export async function analyzeProduct(base64Image, mimeType = "image/jpeg", productInfo, answers, city, userNotes) {
  const prompt = `You are ReVive AI — an expert product analyst that helps people find the best second life for products they no longer need. You think creatively and practically.

PRODUCT DETECTED: ${productInfo.productName}
CATEGORY: ${productInfo.category}
USER'S CITY/AREA: ${city || "India (general)"}

USER'S ANSWERS:
- Condition: ${answers.condition}
- Age: ${answers.age}
- Still functional: ${answers.functional}
- Accessories included: ${answers.accessories}
${userNotes ? `
USER'S ADDITIONAL NOTES:
"${userNotes}"
(Consider these notes carefully — the user may have described specific problems, preferences, or urgency that should influence your recommendations)
` : ''}

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
    "conditionScore": 0-100,
    "conditionLabel": "Excellent/Good/Average/Poor",
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
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text.trim();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Analysis error:", error);
    throw new Error(`Failed to analyze product: ${error.message}`);
  }
}
