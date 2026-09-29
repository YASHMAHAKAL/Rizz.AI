// Browser calls our backend only. Gemini credentials never enter this bundle.
export class ApiError extends Error {
    status: number;
    constructor(message: string, status = 0) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
        const response = await fetch(`/api/${path}`, {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body), signal: controller.signal,
        });
        if (!response.ok) {
            const payload = response.status === 429 ? await response.json().catch(() => null) : null;
            const message = response.status === 401 ? 'Sign in to the staging demo, then try again.'
                : response.status === 429 && payload?.error === 'demo_call_budget_exhausted'
                    ? 'The demo AI request budget is exhausted. Contact the demo owner.'
                : response.status === 429 ? 'Demo request limit reached. Please wait before trying again.'
                : response.status === 400 || response.status === 413 ? 'Check your input or upload a smaller image.'
                : response.status === 504 ? 'The AI request timed out. Please try again later.'
                : 'The AI service is unavailable. Please try again later.';
            throw new ApiError(message, response.status);
        }
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ApiError('Invalid service response.');
        return data as Record<string, unknown>;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error instanceof Error && error.name === 'AbortError') throw new ApiError('The AI request timed out.', 504);
        throw new ApiError('Cannot reach the AI service. Please try again later.');
    } finally {
        clearTimeout(timeout);
    }
}

function requiredText(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) throw new ApiError('Invalid service response.');
    return value;
}

export async function generateRizz(prompt: string): Promise<string> {
    return requiredText((await post('rizz', { prompt })).text);
}

export async function generateChatReply(history: { role: string; parts: string }[], userMessage: string): Promise<{ reply: string; critique: string }> {
    const data = await post('chat', { history, userMessage });
    return { reply: requiredText(data.reply), critique: requiredText(data.critique) };
}

export async function analyzeScreenshot(imageBase64: string): Promise<{ tone: string; options: string[] }> {
    const data = await post('analyze', { imageBase64 });
    if (!Array.isArray(data.options) || data.options.length !== 3) throw new ApiError('Invalid service response.');
    return { tone: requiredText(data.tone), options: data.options.map(requiredText) };
}
