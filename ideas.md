# Hanna Interface Direction

## Three directions considered

### Theme Name: Quiet Command Center

Very Brief Intro: A monochrome, editorial workspace that feels calm, precise, and dependable. Inspired by modern productivity tools, it uses measured spacing, tactile controls, and strong hierarchy instead of decorative effects.
Probability: 0.07

### Theme Name: Paper Signal

Very Brief Intro: A warm, paper-toned interpretation of an AI notebook with soft ink marks and restrained utility accents. It would feel more personal and literary while remaining highly functional.
Probability: 0.04

### Theme Name: Graphite Studio

Very Brief Intro: A compact dark-mode operator console with dense panels, technical metadata, and subtle graphite layering. It would prioritize power-user density over softness.
Probability: 0.08

## Selected Direction: Quiet Command Center

### Design Movement

Swiss International Typographic Style translated into a contemporary AI productivity workspace, with the directness of a professional command center and the calm of an editorial reading surface.

### Core Principles

1. **Hierarchy before decoration.** Typography, alignment, and contrast communicate state before color or ornament.
2. **Monochrome with material depth.** Black, white, and neutral grays do the structural work; depth comes from surfaces, hairline rules, and restrained shadows.
3. **Asymmetric utility.** A persistent navigation rail, a readable conversation column, and a contextual artifact/settings panel create a purposeful three-part composition.
4. **Every control earns its place.** Tool chips, model controls, and action buttons stay discoverable without turning the workspace into a dashboard of noise.

### Color Philosophy

Hanna is anchored by ink black and paper white, so the interface stays legible in both themes and avoids the visual shorthand of AI-generated purple/blue gradients. Light mode is a warm off-white reading surface with graphite text; dark mode is near-black charcoal with softened white text. The ownable signature color is **Hanna Ink (#151515)**: the color of the primary action, active rail, and brand mark. It communicates confidence without competing with content.

### Layout Paradigm

A desktop-first, asymmetric command center: a compact left rail for identity and chat history; a central conversation stage with a deliberately constrained reading width; and an optional right-side context panel for artifacts or settings. On smaller screens, the rail becomes an overlay drawer and the context panel becomes a sheet, preserving focus instead of collapsing everything into a generic centered card.

### Signature Elements

- **The Hanna mark:** a bold, two-stroke H-like glyph built from offset vertical bars, used in the brand lockup, avatar, favicon, and empty-state emblem.
- **Ink actions:** black filled buttons with crisp white labels and a slight press scale, reserved for high-intent actions such as New chat and Send.
- **Hairline rails:** 1px graphite dividers, compact metadata labels, and small uppercase section markers that make the app feel structured and authored.

### Interaction Philosophy

Interactions should feel immediate, quiet, and reversible. Hover states use surface shifts and border darkening rather than glow. Active states are explicit through an ink fill, a small indicator bar, or a selected surface. Tool buttons toggle on and off, chat history loads a real seeded conversation, panel buttons open the corresponding workspace, and settings changes persist locally. Placeholder capabilities are labeled honestly and surface a compact "coming soon" toast instead of pretending to call a live service.

### Animation

Use short ease-out transitions (120–220ms) for hover, focus, selection, and panel movement. New messages fade and translate upward by a few pixels; drawers enter from their edge at 180–260ms; tool chips use a subtle background/border transition. Never animate layout dimensions or use decorative looping motion. Respect `prefers-reduced-motion` by removing non-essential transforms and entrance effects.

### Typography System

Use **Manrope** for interface text and headlines, with **IBM Plex Mono** for metadata, shortcut hints, code/artifact labels, and small system status. Headlines use 600–700 weight with tight tracking; body copy uses 400–500 weight with a comfortable 1.55 line height; labels are 10–12px uppercase with deliberate tracking. Avoid Inter and default system-only typography so Hanna has a distinct but quiet voice.

### Brand Essence

Hanna is a focused AI workspace for people who want to think, make, and organize without fighting the interface; it is different because the product surface stays quiet while the tools remain close at hand.

Personality adjectives: **precise, calm, capable**.

### Brand Voice

Headlines and CTAs are concise, direct, and human. Microcopy explains the next action without hype, and never uses generic filler such as "Welcome to our website" or "Get started today."

Example lines:

- "Make room for the next good idea."
- "Bring a question. Hanna will help shape the work."

### Wordmark & Logo

The wordmark is a custom lockup: the Hanna name is set in a heavy Manrope treatment with slightly tightened spacing, paired with the offset two-bar H mark. The mark is a graphic symbol rather than the name rendered in a default font, and it remains recognizable at compact sizes.

### Signature Brand Color

**Hanna Ink — `#151515`**. This is the primary action color in light mode and the deepest structural ink in dark mode, creating a consistent identity across the theme toggle.

### Implementation Notes

- Replace the existing placeholder Home page with an interactive chat workspace.
- Join the supplied structural HTML and CSS intent into the React/Tailwind app rather than copying standalone script tags or inline event handlers.
- Keep app integrations, artifacts, settings, web search, image input, voice, study, deep research, and image generation represented as honest UI affordances with clear placeholder feedback where live services are not connected.
- Preserve frontend-only scope: do not modify server logic, database schemas, or backend routes.
- Use existing shadcn/ui primitives and `lucide-react` icons wherever they fit; do not add a competing component system.

## Style Decisions

The selected direction is intentionally monochrome and high-contrast. The interface should feel like a real product workspace, not a landing page or a decorative AI concept shot. Primary surfaces stay square-ish and measured, with rounded corners used only where they clarify interaction such as the composer, tool chips, menus, and avatar.

The desktop composition must read as a three-zone command center: left rail, constrained conversation stage, and a visible contextual dock or expanded artifacts/settings panel. The dock is a persistent, low-noise orientation surface rather than unused right whitespace.

Hanna’s identity is carried structurally through repeated use of the two-bar H mark, Hanna Ink active states, hairline rails, and mono metadata. Controls favor precise graphite surfaces and restrained rounding; pill-like treatments are reserved for compact interactive chips.
