/** Client-safe model catalog (labels only — no vendor branding for Groq) */
export type HannaUiModelId =
  | "Hanna Lite"
  | "Hanna Pro"
  | "Hanna Fast"
  | "Hanna Instant"
  | "Hanna Advanced"
  | "Hanna Presentation"
  | "Hanna Image"
  | "Hanna Video";

export const HANNA_UI_MODELS: Array<{
  id: HannaUiModelId;
  label: string;
  description: string;
  capability: "chat" | "presentation" | "image" | "video" | "advanced";
}> = [
  {
    id: "Hanna Lite",
    label: "Hanna Lite",
    description: "Fast everyday chat",
    capability: "chat",
  },
  {
    id: "Hanna Pro",
    label: "Hanna Pro",
    description: "Deeper reasoning",
    capability: "chat",
  },
  {
    id: "Hanna Fast",
    label: "Hanna Fast",
    description: "Ultra-low latency",
    capability: "chat",
  },
  {
    id: "Hanna Instant",
    label: "Hanna Instant",
    description: "Snappy short answers",
    capability: "chat",
  },
  {
    id: "Hanna Advanced",
    label: "Hanna Advanced",
    description: "Complex multi-step tasks",
    capability: "advanced",
  },
  {
    id: "Hanna Presentation",
    label: "Hanna Presentation",
    description: "Slide decks & outlines",
    capability: "presentation",
  },
  {
    id: "Hanna Image",
    label: "Hanna Image",
    description: "Image prompts & visual briefs",
    capability: "image",
  },
  {
    id: "Hanna Video",
    label: "Hanna Video",
    description: "Video scripts & storyboards",
    capability: "video",
  },
];
