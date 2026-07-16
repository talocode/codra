import { Provider, Message, ProviderResponse } from './types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const AUTH_FILE = path.join(os.homedir(), '.codra', 'auth.json');

function getTeraToken(): string | null {
  if (process.env.CODRA_API_KEY) return process.env.CODRA_API_KEY;
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      return auth.accessToken || null;
    } catch {
      return null;
    }
  }
  return null;
}

export class TeraProvider implements Provider {
  name = 'tera';
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || process.env.CODRA_BASE_URL || 'https://teraai.chat';
    this.model = model || process.env.CODRA_MODEL || 'gpt-4o-mini';
  }

  async chat(messages: Message[], model: string): Promise<ProviderResponse> {
    const token = getTeraToken();
    if (!token) {
      throw new Error('Tera authentication required. Run: codra-code login');
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: model || this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 4096,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tera API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || 'No response generated',
      model: data.model || model || this.model,
      provider: 'tera',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens
      } : undefined
    };
  }

  async chatStreaming(
    messages: Message[],
    model: string,
    onChunk: (delta: string) => void
  ): Promise<ProviderResponse> {
    const token = getTeraToken();
    if (!token) {
      throw new Error('Tera authentication required. Run: codra-code login');
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: model || this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 4096,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tera API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
          if (parsed.usage) {
            promptTokens = parsed.usage.prompt_tokens || 0;
            completionTokens = parsed.usage.completion_tokens || 0;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    return {
      content: fullContent,
      model: model || this.model,
      provider: 'tera',
      usage: promptTokens > 0 ? { promptTokens, completionTokens } : undefined
    };
  }

  async isAvailable(): Promise<boolean> {
    const token = getTeraToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
