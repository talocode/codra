export class OpenAIProvider {
    name = 'openai';
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl || process.env.CODRA_BASE_URL || 'https://api.openai.com/v1';
        this.apiKey = apiKey || process.env.CODRA_API_KEY || '';
    }
    async chat(messages, model) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured. Set CODRA_API_KEY environment variable.');
        }
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: 0.7,
                max_tokens: 2048
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        const choice = data.choices?.[0];
        return {
            content: choice?.message?.content || 'No response generated',
            model: data.model || model,
            provider: 'openai',
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens
            } : undefined
        };
    }
    async isAvailable() {
        if (!this.apiKey)
            return false;
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
