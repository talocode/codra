export class MockProvider {
    name = 'mock';
    async chat(messages, model) {
        const lastMessage = messages[messages.length - 1];
        const input = lastMessage?.content || '';
        let response = '';
        if (input.toLowerCase().includes('hello') || input.toLowerCase().includes('hi')) {
            response = 'Hello! I\'m Codra Code, your local-first coding assistant. How can I help you today?';
        }
        else if (input.toLowerCase().includes('help')) {
            response = 'I can help you with:\n- Reading and analyzing code\n- Explaining code functionality\n- Suggesting improvements\n- Answering questions about your project\n\nTry asking me about a specific file or coding concept!';
        }
        else if (input.toLowerCase().includes('status')) {
            response = `Running in mock mode with model: ${model}. This is a simulated response for testing purposes.`;
        }
        else if (input.includes('/')) {
            response = `Mock response for command: ${input}`;
        }
        else {
            response = `Mock response to: "${input}"\n\nThis is a simulated response. Configure a real provider (OpenAI, Ollama) to get actual AI responses.`;
        }
        return {
            content: response,
            model: model,
            provider: 'mock',
            usage: {
                promptTokens: input.split(' ').length,
                completionTokens: response.split(' ').length
            }
        };
    }
    async isAvailable() {
        return true;
    }
}
