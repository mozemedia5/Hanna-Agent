# Shared Hanna architecture brief

Source: https://chatgpt.com/share/6a9055f0-8638-83ea-b272-760469cf7124?ogimg=multicolor

The shared conversation describes Hanna as an AI orchestration platform with multiple model providers, one central Agent Core, a tool/MCP layer, and application data. The core recommendation is not to let every model independently control the application; instead, Hanna/Liverton Agent Core should understand, plan, decide, execute, and verify.

Recommended initial providers from the conversation are Gemini as the primary multimodal model, Groq for fast inference, Mistral for documents and agents, and OpenRouter as a fallback/router. The model is the reasoning engine; the Agent Core is the software controller; the tool layer provides controlled access to Firebase, Cloudinary, Shopify, GitHub, Vercel, YouTube, and other connected services.

The conversation's example workflow asks Hanna to create a Human Biology module, accept a PDF, summarize it, and create 20 questions. This implies a plan-first workflow, file/context ingestion, tool selection, multi-step execution, progress reporting, verification, and an approval boundary before consequential actions.

The shared conversation also links provider documentation for Mistral, Groq, and OpenRouter. The exact browser error attachment is a generated/bundled server artifact rather than a concise runtime stack trace; the repository's concrete browser error was traced separately to the Home → Workspace → Composer prop/state contract and has already been repaired in the working tree.
