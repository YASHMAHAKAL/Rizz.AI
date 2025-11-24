const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for images

const PORT = process.env.PORT || 3000;
const GEN_AI_KEY = process.env.GEN_AI_KEY;

if (!GEN_AI_KEY) {
    console.error("CRITICAL: GEN_AI_KEY is missing from environment variables!");
}

const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-09-2025",
    systemInstruction: "You are a smooth, witty, and Gen Z-friendly dating expert. Keep responses short, punchy, and lower-case aesthetic where appropriate."
});

// Helper to clean JSON string (copied from frontend logic)
function cleanJSON(text) {
    let clean = text.replace(/```json\n|\n```|```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
}

// Endpoint 1: Generate Rizz
app.post('/api/rizz', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ text: response.text() });
    } catch (error) {
        console.error("Error generating rizz:", error);
        res.status(500).json({ error: "Failed to generate rizz" });
    }
});

// Endpoint 2: Chat Reply
app.post('/api/chat', async (req, res) => {
    try {
        const { history, userMessage } = req.body;

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
            const json = JSON.parse(cleanJSON(text));
            res.json(json);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            res.json({ reply: text.substring(0, 100) + "...", critique: "AI formatting error, but I got your message!" });
        }
    } catch (error) {
        console.error("Error generating chat reply:", error);
        res.status(500).json({ error: "Failed to generate chat reply" });
    }
});

// Endpoint 3: Analyze Screenshot
app.post('/api/analyze', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: "Image is required" });

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
                data: imageBase64.split(',')[1], // Remove 'data:image/jpeg;base64,' prefix if present
                mimeType: "image/jpeg"
            }
        };

        const result = await visionModel.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        try {
            const json = JSON.parse(cleanJSON(text));
            res.json(json);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            res.status(500).json({ error: "Failed to parse AI response" });
        }
    } catch (error) {
        console.error("Error analyzing screenshot:", error);
        res.status(500).json({ error: "Failed to analyze screenshot" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
