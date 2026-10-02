export type AICapabilityId =
  | "text_generation"
  | "reasoning"
  | "long_context"
  | "vision"
  | "image_generation"
  | "image_editing"
  | "image_analysis"
  | "video_generation"
  | "video_analysis"
  | "audio_generation"
  | "audio_transcription"
  | "audio_analysis"
  | "speech_generation"
  | "document_analysis"
  | "document_generation"
  | "presentation_generation"
  | "web_research"
  | "structured_data_generation"
  | "code_generation"
  | "code_execution"
  | "embedding"
  | "classification"
  | "summarization"
  | "translation";

export type ProviderCapabilitySupport = {
  providerId: string;
  defaultModel: string;
  models: string[];
  supportsStreaming?: boolean;
  supportsTools?: boolean;
  requiresAsyncJob?: boolean;
};

export type AICapabilityDefinition = {
  id: AICapabilityId;
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  supportsStreaming: boolean;
  supportsTools: boolean;
  requiresAsyncJob?: boolean;
  providers: ProviderCapabilitySupport[];
};

export const AI_CAPABILITY_REGISTRY: Record<AICapabilityId, AICapabilityDefinition> = {
  text_generation: {
    id: "text_generation",
    name: "Text Generation",
    description: "Standard text conversational generation and reasoning.",
    inputTypes: ["text"],
    outputTypes: ["text"],
    supportsStreaming: true,
    supportsTools: true,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "llama",
        defaultModel: "llama-3.3-70b-versatile",
        models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "deepseek-r1-distill-llama-70b", "openai/gpt-oss-120b"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "openai",
        defaultModel: "gpt-4o-mini",
        models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "anthropic",
        defaultModel: "claude-3-5-sonnet-20241022",
        models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-5-haiku-20241022"],
        supportsStreaming: true,
        supportsTools: true,
      },
    ],
  },
  reasoning: {
    id: "reasoning",
    name: "Deep Reasoning",
    description: "Multi-step complex reasoning and problem solving.",
    inputTypes: ["text"],
    outputTypes: ["text"],
    supportsStreaming: true,
    supportsTools: true,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "llama",
        defaultModel: "deepseek-r1-distill-llama-70b",
        models: ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "openai",
        defaultModel: "o3-mini",
        models: ["o3-mini", "o1"],
        supportsStreaming: true,
        supportsTools: true,
      },
    ],
  },
  long_context: {
    id: "long_context",
    name: "Long Context",
    description: "Large context window document and prompt processing.",
    inputTypes: ["text", "document"],
    outputTypes: ["text"],
    supportsStreaming: true,
    supportsTools: true,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "anthropic",
        defaultModel: "claude-3-5-sonnet-20241022",
        models: ["claude-3-5-sonnet-20241022"],
        supportsStreaming: true,
        supportsTools: true,
      },
    ],
  },
  vision: {
    id: "vision",
    name: "Vision Analysis",
    description: "Image analysis, visual question answering, and OCR.",
    inputTypes: ["image"],
    outputTypes: ["text"],
    supportsStreaming: true,
    supportsTools: true,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "openai",
        defaultModel: "gpt-4o-mini",
        models: ["gpt-4o", "gpt-4o-mini"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "anthropic",
        defaultModel: "claude-3-5-sonnet-20241022",
        models: ["claude-3-5-sonnet-20241022"],
        supportsStreaming: true,
        supportsTools: true,
      },
    ],
  },
  image_generation: {
    id: "image_generation",
    name: "Image Generation",
    description: "Text to image synthesis and graphic creation.",
    inputTypes: ["text"],
    outputTypes: ["image"],
    supportsStreaming: false,
    supportsTools: false,
    providers: [
      {
        providerId: "openai",
        defaultModel: "dall-e-3",
        models: ["dall-e-3"],
        supportsStreaming: false,
      },
      {
        providerId: "gemini",
        defaultModel: "imagen-3.0-generate-002",
        models: ["imagen-3.0-generate-002"],
        supportsStreaming: false,
      },
    ],
  },
  image_editing: {
    id: "image_editing",
    name: "Image Editing",
    description: "Image variations, background replacement, and visual editing.",
    inputTypes: ["image", "text"],
    outputTypes: ["image"],
    supportsStreaming: false,
    supportsTools: false,
    providers: [
      {
        providerId: "openai",
        defaultModel: "dall-e-2",
        models: ["dall-e-2"],
        supportsStreaming: false,
      },
    ],
  },
  image_analysis: {
    id: "image_analysis",
    name: "Image Analysis",
    description: "Detailed visual asset examination and object detection.",
    inputTypes: ["image"],
    outputTypes: ["text", "json"],
    supportsStreaming: true,
    supportsTools: true,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
        supportsTools: true,
      },
    ],
  },
  video_generation: {
    id: "video_generation",
    name: "Video Generation",
    description: "Async text or image to video clip generation.",
    inputTypes: ["text", "image"],
    outputTypes: ["video"],
    supportsStreaming: false,
    supportsTools: false,
    requiresAsyncJob: true,
    providers: [
      {
        providerId: "heygen",
        defaultModel: "heygen-v2",
        models: ["heygen-v2"],
        requiresAsyncJob: true,
      },
      {
        providerId: "creatify",
        defaultModel: "creatify-v1",
        models: ["creatify-v1"],
        requiresAsyncJob: true,
      },
    ],
  },
  video_analysis: {
    id: "video_analysis",
    name: "Video Analysis",
    description: "Video frame parsing and temporal visual analysis.",
    inputTypes: ["video"],
    outputTypes: ["text"],
    supportsStreaming: true,
    supportsTools: false,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
      },
    ],
  },
  audio_generation: {
    id: "audio_generation",
    name: "Audio Generation",
    description: "Speech and audio sound effect synthesis.",
    inputTypes: ["text"],
    outputTypes: ["audio"],
    supportsStreaming: false,
    supportsTools: false,
    providers: [
      {
        providerId: "openai",
        defaultModel: "tts-1-hd",
        models: ["tts-1", "tts-1-hd"],
      },
    ],
  },
  audio_transcription: {
    id: "audio_transcription",
    name: "Audio Transcription",
    description: "Audio to text transcription and timestamp alignment.",
    inputTypes: ["audio"],
    outputTypes: ["text"],
    supportsStreaming: false,
    supportsTools: false,
    providers: [
      {
        providerId: "openai",
        defaultModel: "whisper-1",
        models: ["whisper-1"],
      },
      {
        providerId: "llama",
        defaultModel: "whisper-large-v3",
        models: ["whisper-large-v3", "whisper-large-v3-turbo"],
      },
    ],
  },
  audio_analysis: {
    id: "audio_analysis",
    name: "Audio Analysis",
    description: "Acoustic sentiment and multi-speaker audio analysis.",
    inputTypes: ["audio"],
    outputTypes: ["text", "json"],
    supportsStreaming: false,
    supportsTools: false,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
      },
    ],
  },
  speech_generation: {
    id: "speech_generation",
    name: "Speech Synthesis",
    description: "Text-to-speech audio rendering.",
    inputTypes: ["text"],
    outputTypes: ["audio"],
    supportsStreaming: true,
    supportsTools: false,
    providers: [
      {
        providerId: "openai",
        defaultModel: "tts-1",
        models: ["tts-1"],
      },
    ],
  },
  document_analysis: {
    id: "document_analysis",
    name: "Document Analysis",
    description: "PDF and document parsing and content extraction.",
    inputTypes: ["document"],
    outputTypes: ["text", "json"],
    supportsStreaming: true,
    supportsTools: true,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
        supportsTools: true,
      },
    ],
  },
  document_generation: {
    id: "document_generation",
    name: "Document Generation",
    description: "Structured markdown and document formatting.",
    inputTypes: ["text"],
    outputTypes: ["document"],
    supportsStreaming: true,
    supportsTools: false,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
      },
    ],
  },
  presentation_generation: {
    id: "presentation_generation",
    name: "Presentation Generation",
    description: "Slide deck structure, content, and layout generation.",
    inputTypes: ["text"],
    outputTypes: ["presentation", "json"],
    supportsStreaming: false,
    supportsTools: false,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
      },
    ],
  },
  web_research: {
    id: "web_research",
    name: "Web Research",
    description: "Real-time web browsing, search, and document summarization.",
    inputTypes: ["text"],
    outputTypes: ["text"],
    supportsStreaming: true,
    supportsTools: true,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
        supportsTools: true,
      },
    ],
  },
  structured_data_generation: {
    id: "structured_data_generation",
    name: "Structured Data Generation",
    description: "Guaranteed JSON schema output generation.",
    inputTypes: ["text"],
    outputTypes: ["json"],
    supportsStreaming: false,
    supportsTools: true,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsTools: true,
      },
      {
        providerId: "openai",
        defaultModel: "gpt-4o-mini",
        models: ["gpt-4o-mini", "gpt-4o"],
        supportsTools: true,
      },
    ],
  },
  code_generation: {
    id: "code_generation",
    name: "Code Generation",
    description: "Source code generation and refactoring.",
    inputTypes: ["text"],
    outputTypes: ["code"],
    supportsStreaming: true,
    supportsTools: true,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "llama",
        defaultModel: "llama-3.3-70b-versatile",
        models: ["llama-3.3-70b-versatile"],
        supportsStreaming: true,
        supportsTools: true,
      },
      {
        providerId: "anthropic",
        defaultModel: "claude-3-5-sonnet-20241022",
        models: ["claude-3-5-sonnet-20241022"],
        supportsStreaming: true,
        supportsTools: true,
      },
    ],
  },
  code_execution: {
    id: "code_execution",
    name: "Code Execution",
    description: "Execution of generated code in sandbox runtime.",
    inputTypes: ["code"],
    outputTypes: ["text", "json"],
    supportsStreaming: false,
    supportsTools: false,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
      },
    ],
  },
  embedding: {
    id: "embedding",
    name: "Text Embedding",
    description: "Vector embedding representation for semantic retrieval.",
    inputTypes: ["text"],
    outputTypes: ["vector"],
    supportsStreaming: false,
    supportsTools: false,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "text-embedding-004",
        models: ["text-embedding-004"],
      },
      {
        providerId: "openai",
        defaultModel: "text-embedding-3-small",
        models: ["text-embedding-3-small", "text-embedding-3-large"],
      },
    ],
  },
  classification: {
    id: "classification",
    name: "Classification",
    description: "Intent and text categorization.",
    inputTypes: ["text"],
    outputTypes: ["text", "json"],
    supportsStreaming: false,
    supportsTools: false,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
      },
      {
        providerId: "llama",
        defaultModel: "llama-3.1-8b-instant",
        models: ["llama-3.1-8b-instant"],
      },
    ],
  },
  summarization: {
    id: "summarization",
    name: "Summarization",
    description: "Content summarization and key point extraction.",
    inputTypes: ["text", "document"],
    outputTypes: ["text"],
    supportsStreaming: true,
    supportsTools: false,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
      },
      {
        providerId: "llama",
        defaultModel: "llama-3.3-70b-versatile",
        models: ["llama-3.3-70b-versatile"],
        supportsStreaming: true,
      },
    ],
  },
  translation: {
    id: "translation",
    name: "Translation",
    description: "Multi-language text translation.",
    inputTypes: ["text"],
    outputTypes: ["text"],
    supportsStreaming: true,
    supportsTools: false,
    providers: [
      {
        providerId: "gemini",
        defaultModel: "gemini-3.5-flash",
        models: ["gemini-3.5-flash"],
        supportsStreaming: true,
      },
    ],
  },
};

export function getCapability(capabilityId: AICapabilityId): AICapabilityDefinition | undefined {
  return AI_CAPABILITY_REGISTRY[capabilityId];
}

export function getCapabilitiesForProvider(providerId: string): AICapabilityDefinition[] {
  return Object.values(AI_CAPABILITY_REGISTRY).filter((cap) =>
    cap.providers.some((p) => p.providerId === providerId)
  );
}

export function getBestProviderForCapability(
  capabilityId: AICapabilityId,
  preferredProvider?: string
): ProviderCapabilitySupport | undefined {
  const cap = getCapability(capabilityId);
  if (!cap || cap.providers.length === 0) return undefined;

  if (preferredProvider) {
    const matched = cap.providers.find((p) => p.providerId === preferredProvider);
    if (matched) return matched;
  }

  return cap.providers[0];
}
