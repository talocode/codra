export class OllamaProvider {
    name = 'ollama';
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl || process.env.CODRA_BASE_URL || 'http://localhost:11434';
    }
    async chat(messages, model) {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                stream: false
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: data.message?.content || 'No response generated',
            model: data.model || model,
            provider: 'ollama',
            usage: data.eval_count ? {
                promptTokens: data.prompt_eval_count || 0,
                completionTokens: data.eval_count
            } : undefined
        };
    }
    async isAvailable() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
