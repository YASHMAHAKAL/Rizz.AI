// The frontend now calls our own backend, which holds the API key securely.
// We assume the backend is available at the same host under /api (via Nginx proxy) or a specific URL.

const BACKEND_URL = "/api"; // Relative path, handled by Nginx proxy

export async function generateRizz(prompt: string): Promise<string> {
    try {
        const response = await fetch(`${BACKEND_URL}/rizz`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) throw new Error("Backend request failed");

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Error generating rizz:", error);
        return "oops, my rizz meter broke. try again later? 🥺";
    }
}

export async function generateChatReply(history: { role: string; parts: string }[], userMessage: string): Promise<{ reply: string; critique: string }> {
    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history, userMessage })
        });

        if (!response.ok) throw new Error("Backend request failed");

        return await response.json();
    } catch (error) {
        console.error("Error generating chat reply:", error);
        return { reply: "I'm lost for words...", critique: "System error." };
    }
}

export async function analyzeScreenshot(imageBase64: string): Promise<{ tone: string; options: string[] }> {
    try {
        const response = await fetch(`${BACKEND_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64 })
        });

        if (!response.ok) throw new Error("Backend request failed");

        return await response.json();
    } catch (error) {
        console.error("Error analyzing screenshot:", error);
        return { tone: "Unknown", options: ["Error analyzing image"] };
    }
}

