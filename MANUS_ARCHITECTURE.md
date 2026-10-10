# Manus AI Autonomous AI Agent — System Architecture & Design Specification

This document details the architecture, design, and execution backend for the Manus AI Autonomous AI Agent Application integrated within Hanna.

---

## High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client UI / UX Layer ["Frontend UI / UX Layer (React + Tailwind CSS)"]
        Composer["Task Design Composer\n- Placeholder: 'Assign a task or ask anything...'\n- Arm Mode Chips: Slides, Design, Meeting Minutes\n- Operational Profile: Lite | Pro | Max\n- Suggested Connector Cards"]
        VoiceBubble["Agent Voice / Status Bubble\n- Task-oriented speech ('Step 2/4: Reading competitor pricing pages...')\n- Prominent 'Skip to Results' button"]
        LogTree["Activity Log Tree\n- Goal -> Sub-tasks -> Execution Logs -> Outputs"]
        VisualLoop["Visual Connector Loop\n- Agent Icon ➔ Pulsing Line ➔ Target Connector Icon"]
        ComputerWindow["Virtual Computer Screen Mirror\n- Titled: '[App Name]'s Computer Window'\n- Simulated cursor (x, y) coordinates\n- Browser tabs, form filler, code editor, file writer"]
    end

    subgraph Streaming Protocol ["Real-Time Event Stream (WebSockets / SSE)"]
        WS["WebSocket & Event Bus Channel\n- Telemetry: Cursor (x,y) coords\n- Status: Agent speech & current goal\n- Connector: Active tool + animated loop state\n- Logs: Tree node additions & output files"]
    end

    subgraph Backend Execution Engine ["Server-Side Asynchronous Agent Engine"]
        Planner["Hierarchical Agent Planner\n- Takes high-level prompt\n- Decomposes into ordered step DAG\n- Registers steps in Firestore / persistent store"]
        Executor["Agent Executor Loop\n- Dynamic Tool Selection (Browser, Python, Sheets, APIs)\n- Emits real-time cursor & tool events"]
        Critic["Critic & Validator\n- Evaluates step output quality against criteria\n- Triggers retry or proceeds to next step"]
        Store[("Persistent State Store\n- Task State & Step Progress\n- Continuous execution when browser closes")]
    end

    subgraph Cloud Sandbox ["Cloud-Based Isolated Execution Sandbox"]
        HeadlessBrowser["Headless Chrome / Web Automator\n- Navigation, form filling, web scraping"]
        CodeInterpreter["Python / Code Sandbox\n- Analytical code execution, data processing"]
        SandboxedFS["Isolated File System\n- Output spreadsheet, document & visual writer"]
        Connectors["Third-Party API Connectors\n- Google Sheets, Stripe, Facebook Ads, GitHub"]
    end

    %% Flow connections
    Composer -->|1. Submit Task Prompt| Planner
    Planner -->|2. Register Step Plan| Store
    Planner -->|3. Dispatch Step| Executor
    Executor -->|4. Run Tool Action| HeadlessBrowser & CodeInterpreter & SandboxedFS & Connectors
    Executor -->|5. Emit Live Telemetry| WS
    Executor -->|6. Pass Output| Critic
    Critic -->|7a. Valid Output| Planner
    Critic -.->|7b. Retry Request| Executor
    WS -->|Live Telemetry Stream| VoiceBubble & LogTree & VisualLoop & ComputerWindow
```

---

## Core System Architectural Pillars

### 1. FRONTEND UI/UX DESIGN & INTERACTIVE ELEMENTS

#### A. The "Task Design" Composer
- **Assignment-Centric Design**: Moves away from open-ended conversational chatbots toward task-driven agent delegation.
- **Explicit Placeholder**: Directs user with `"Assign a task or ask anything..."`.
- **Arm Mode Chips**: Contextual attachment tags (`Slides`, `Design`, `Meeting Minutes`, `Market Research`, `Code Analysis`) that attach specific system directives and context presets.
- **Operational Profile Selector**:
  - **Lite**: Fast execution, lightweight tool calls.
  - **Pro**: Standard agentic reasoning, web search, code interpreter.
  - **Max**: Multi-agent consensus, heavy code execution, deep web crawling, multi-step critique.
- **Suggested Connector Cards**: Pre-configured integration cards beneath the composer combining connector branding (e.g., Google Sheets, Facebook Ads, Stripe, Web Browser) with concrete, actionable task outcomes (e.g., *"Analyze ad campaign ROI and export performance spreadsheet"*).

#### B. Real-Time Task Execution & Visual Connectors
- **Activity Log Tree**: Hierarchical step visualization displaying the primary goal, sub-task breakdowns, active tool invocations, duration timers, and output artifacts.
- **Visual Connector Loop**: A live visual loop component rendering `Agent Icon -> Pulsing Animated Connection Line -> Active Integration Icon` (e.g., Chrome, Python, Google Sheets, Stripe).

#### C. The "Virtual Computer Screen" Mirror
- **Viewport Frame**: Titled `"[App Name]'s Computer Window"` with browser/editor tab navigation (Browser, Code Sandbox, Terminal, File Workspace).
- **Live Cursor Telemetry**: Renders an animated cursor moving smoothly across `(x, y)` pixel coordinates to simulate active form filling, link clicking, and text selection.
- **Sandboxed Directory Viewer**: Shows live files written by the agent in real time.

#### D. The Agent's Voice / Status Bubble
- **Task-Oriented Speech**: Omits conversational filler to focus purely on active progress and goals (e.g., `"Step 2/4: Reading competitor pricing pages..."`).
- **Skip to Results**: Action button allowing users to immediately scroll/jump to the finalized product.

---

## 2. BACKEND WORKFLOW & EXECUTION ENGINE

#### A. Cloud-Based Sandbox & Persistence
- Execution runs completely server-side in isolated containerized sandboxes.
- **Browser Independence**: Execution persists asynchronously. If the user disconnects or closes their device, server-side workers maintain task state until completion.

#### B. Multi-Agent Planner, Executor, and Critic Loop
1. **Planner**: Takes the initial goal, decomposes it into sequential or parallel step definitions, and persists them.
2. **Executor**: Executes each step sequentially using available sandbox tools (Headless Web Browser, Code Interpreter, Sandboxed FS, External Connectors).
3. **Critic/Validator**: Cross-references tool output against step validation criteria before approving advancement to the next step.

#### C. Live Progress WebSockets & Telemetry Stream
- WebSocket server streams JSON event frames to the frontend including:
  - `cursor`: `{ x, y, action, target }`
  - `step`: `{ id, label, status, duration }`
  - `connector`: `{ name, icon, status }`
  - `speech`: `current task status text`
  - `log`: `terminal output / file write event`
