import { GoogleGenerativeAI } from "@google/generative-ai";

// Placeholder for the API key. In a real app, this would be an environment variable.
const GEN_AI_KEY = "";

const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-09-2025",
    systemInstruction: "You are a smooth, witty, and Gen Z-friendly dating expert. Keep responses short, punchy, and lower-case aesthetic where appropriate."
});

// Helper to clean JSON string
function cleanJSON(text: string): string {
    // Remove markdown code blocks
    let clean = text.replace(/```json\n|\n```|```/g, '').trim();
    // Remove any leading/trailing non-JSON characters (sometimes models add text before/after)
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
}

export async function generateRizz(prompt: string): Promise<string> {
    if (!GEN_AI_KEY) {
        console.warn("Gemini API Key is missing. Returning mock response.");
        return "hey, are you a magician? cause whenever i look at you, everyone else disappears ✨";
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating rizz:", error);
        return "oops, my rizz meter broke. try again later? 🥺";
    }
}

export async function generateChatReply(history: { role: string; parts: string }[], userMessage: string): Promise<{ reply: string; critique: string }> {
    if (!GEN_AI_KEY) {
        return { reply: "Haha, that's cute! Tell me more.", critique: "Great playful tone! Keep it up." };
    }

    try {
        const chat = model.startChat({
            history: history.map(h => ({ role: h.role, parts: [{ text: h.parts }] })),
            generationConfig: { maxOutputTokens: 500 },
        });

        const prompt = `
      User message: "${userMessage}"
      
      Task:
      1. Respond to the user as a flirty, Gen Z date.
      2. Provide a brief critique of the user's message (tone, effectiveness).
      
      IMPORTANT: Return ONLY raw JSON without any markdown formatting or backticks.
      JSON format:
      {
        "reply": "your response here",
        "critique": "your critique here"
      }
    `;

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            return JSON.parse(cleanJSON(text));
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw text:", text);
            return { reply: text.substring(0, 100) + "...", critique: "AI formatting error, but I got your message!" };
        }
    } catch (error) {
        console.error("Error generating chat reply:", error);
        return { reply: "I'm lost for words...", critique: "System error." };
    }
}

export async function analyzeScreenshot(imageBase64: string): Promise<{ tone: string; options: string[] }> {
    if (!GEN_AI_KEY) {
        return {
            tone: "Playful & Flirty",
            options: ["Bet you say that to all the girls 😉", "Is that a challenge?", "I might be trouble..."]
        };
    }

    try {
        // For image analysis, we need a model that supports vision
        const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

        const prompt = `
      Analyze this chat screenshot.
      1. Identify the tone of the conversation.
      2. Suggest 3 distinct reply options: Safe, Risky, and Witty.
      
      IMPORTANT: Return ONLY raw JSON without any markdown formatting or backticks.
      JSON format:
      {
        "tone": "detected tone",
        "options": ["Safe option", "Risky option", "Witty option"]
      }
    `;

        const imagePart = {
            inlineData: {
                data: imageBase64.split(',')[1],
                mimeType: "image/jpeg"
            }
        };

        const result = await visionModel.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        try {
            return JSON.parse(cleanJSON(text));
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw text:", text);
            return { tone: "Analysis Failed", options: ["Could not parse results."] };
        }
    } catch (error) {
        console.error("Error analyzing screenshot:", error);
        return { tone: "Unknown", options: ["Error analyzing image"] };
    }
}
