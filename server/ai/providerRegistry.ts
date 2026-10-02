import { ProviderCapabilitySupport, AICapabilityDefinition, getCapabilitiesForProvider } from "./capabilityRegistry";

export type TextGenerationRequest = {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
  userContext?: {
    userId?: string;
  };
};

export type TextGenerationResult = {
  text: string;
  provider: string;
  model: string;
  toolCalls?: Array<{
    id?: string;
    name: string;
    args: Record<string, any>;
  }>;
};

export type TextStreamEvent = {
  type: "text_chunk" | "tool_call" | "done" | "error";
  text?: string;
  toolCall?: {
    id?: string;
    name: string;
    args: Record<string, any>;
  };
  error?: string;
};

export type ImageGenerationRequest = {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  style?: string;
};

export type ImageGenerationResult = {
  url: string;
  provider: string;
  model: string;
  mimeType?: string;
};

export interface AIProviderAdapter {
  providerId: string;
  capabilities(): ProviderCapabilitySupport[];
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
  streamText?(request: TextGenerationRequest): AsyncIterable<TextStreamEvent>;
  generateImage?(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

export class AIProviderRegistry {
  private adapters = new Map<string, AIProviderAdapter>();

  registerProvider(adapter: AIProviderAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  getProvider(providerId: string): AIProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  hasProvider(providerId: string): boolean {
    return this.adapters.has(providerId);
  }

  listProviders(): string[] {
    return Array.from(this.adapters.keys());
  }

  getCapabilitiesForProvider(providerId: string): AICapabilityDefinition[] {
    return getCapabilitiesForProvider(providerId);
  }
}

export const globalProviderRegistry = new AIProviderRegistry();
