import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

function formatError(error, defaultMsg) {
  let msg = error.message;
  // If the error message is raw JSON from the API
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return "The AI is currently receiving too many requests. Please wait a minute and try again.";
  }
  if (msg.includes('{"error"')) {
    try {
      const parsed = JSON.parse(msg.substring(msg.indexOf('{')));
      if (parsed.error && parsed.error.message) {
        msg = parsed.error.message;
      }
    } catch (e) {
      // Ignore parse errors, just use the raw string
    }
  }
  return `${defaultMsg}: ${msg}`;
}

export async function analyzeImages(images, userNotes) {
  const prompt = `You are ReVive AI — an expert product analyst that helps people find the best second life for products they no longer need. You think creatively and practically.

First, determine if the provided images contain a valid physical product.
1. Valid items include: electronics, furniture, appliances, kitchenware, sports equipment, clothing, books, tools, toys, vehicles, accessories, bags, shoes, musical instruments, stationery, bottles, flasks, containers — basically ANY physical man-made product.
2. Invalid items include: people/selfies, pets/animals, food, nature/scenery, inappropriate/NSFW content, screenshots, memes, random abstract images.

If the image is INVALID, respond ONLY with valid JSON in this format:
{
  "isProduct": false,
  "rejectionReason": "pet/food/person/inappropriate/nature/other",
  "rejectionMessage": "A funny, friendly rejection message (e.g., 'That's adorable, but ReVive is for products, not pets!')"
}

If the image is VALID, analyze the product and generate 5-7 creative, actionable paths. Think BEYOND just "sell/repair/donate/recycle". 

${userNotes ? `
USER'S ADDITIONAL NOTES:
"${userNotes}"
(Consider these notes carefully — the user may have described specific problems, preferences, condition, age, or urgency that should influence your recommendations)
` : ''}

Include in your paths:
- Specific platforms/places to sell (with estimated price ranges in ₹)
- Creative repurposing/upcycling ideas (DIY projects)
- Specific organizations or types of places to donate
- Exchange/trade-in options with specific programs
- Repair options with estimated costs
- Environmental recycling options
- Any unique, creative ideas specific to this product

Respond ONLY with valid JSON in this format:
{
  "isProduct": true,
  "product": {
    "name": "Full product name",
    "category": "electronics/furniture/appliance/kitchenware/clothing/sports/books/tools/toys/accessories/other",
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

IMPORTANT FOR VALID PRODUCTS:
- The FIRST recommendation MUST ALWAYS be about making money (selling, trading in, scrapping for cash).
- If the item is nearly worthless, the first path should explicitly acknowledge this (e.g., "This can't earn much money, max ₹50, so selling isn't worth the effort") and then suggest what to do instead.
- Exactly ONE path should have "isRecommended": true
- Order paths from most recommended to least
- Be specific: name actual platforms, types of places, and realistically estimate prices for the Indian market.
- Include at least one creative/unusual option`;

  const parts = [
    { text: prompt },
    ...images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    })),
  ];

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: parts,
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
    throw new Error(formatError(error, "Failed to analyze"));
  }
}

export async function chatWithAI(productContext, messageHistory, newMessage) {
  const systemPrompt = `You are ReVive AI, a helpful assistant. You just analyzed a product for the user and gave them recommendations. 
The user is now asking follow-up questions.
Be concise, friendly, and practical. Keep responses under 3 short paragraphs.
If the user hasn't provided crucial details in their initial scan (like the age, specific condition, brand, or model of the item), proactively ask them for these details so you can give better advice! For example: "You didn't specify how old your laptop is. If it's under 3 years old..."

CONTEXT ABOUT THE SCANNED PRODUCT:
${JSON.stringify(productContext, null, 2)}
`;

  // Format history for Gemini chat format (user/model)
  const formattedHistory = messageHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const chat = genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Understood. I will use this context for the user's questions." }] },
        ...formattedHistory,
        { role: 'user', parts: [{ text: newMessage }] }
      ],
    });

    const response = await chat;
    return response.text.trim();
  } catch (error) {
    console.error("Chat error:", error);
    throw new Error(formatError(error, "Failed to get response"));
  }
}

export async function revisePlan(originalResult, messageHistory) {
  const prompt = `You are ReVive AI. The user previously scanned a product and you gave them an initial analysis and recommendations.
Then, you had a conversation with the user where they provided more context (e.g. age, condition, preferences).
You must now REGENERATE the original analysis based on the new context from the conversation.
Update the product's conditionScore, conditionLabel, estimatedValueRange, and summary if the chat revealed new information (e.g. it's broken).
Update the paths to reflect the new reality (e.g. if it's worthless, remove selling paths and focus on repair/recycle).

ORIGINAL PRODUCT ANALYSIS:
${JSON.stringify(originalResult, null, 2)}

CONVERSATION HISTORY:
${messageHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

Respond ONLY with valid JSON in the exact same format as the original analysis:
{
  "isProduct": true,
  "product": {
    "name": "Full product name",
    "category": "category",
    "conditionScore": 0-100,
    "conditionLabel": "Excellent/Good/Average/Poor",
    "estimatedValueRange": "₹X,XXX - ₹X,XXX",
    "summary": "One line summary"
  },
  "paths": [
    {
      "id": 1,
      "title": "Short action title",
      "subtitle": "Where/how",
      "icon": "emoji",
      "tag": "BEST VALUE / ECO-FRIENDLY / CREATIVE / QUICK & EASY / HIGH IMPACT / RECOMMENDED",
      "valueOrCost": "₹X,XXX - ₹X,XXX or Free",
      "reasoning": "2-3 sentences",
      "steps": ["Step 1", "Step 2"],
      "difficulty": "Easy / Medium / Hard",
      "timeEstimate": "Instant / 1-2 days / 1 week",
      "environmentalImpact": "Brief note",
      "isRecommended": true/false
    }
  ],
  "aiNote": "A brief note about how you've updated the plan based on their chat."
}

IMPORTANT: Exactly ONE path should have "isRecommended": true. Order from most recommended to least.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    
    const text = response.text.trim();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Revise error:", error);
    throw new Error(formatError(error, "Failed to revise plan"));
  }
}
