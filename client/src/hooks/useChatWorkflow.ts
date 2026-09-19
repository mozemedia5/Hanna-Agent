import { useState, useCallback, useRef } from "react";

export type WorkflowStatus =
  | "idle"
  | "intent_routing"
  | "streaming_route_a"
  | "executing_route_b"
  | "pivoted_to_route_b"
  | "completed"
  | "error";

export type IntentAnalysisResult = {
  route: "route_a" | "route_b";
  confidence: number;
  reason: string;
  detectedTools: string[];
  capabilities: string[];
};

export type AgentStage =
  | "understand"
  | "plan"
  | "analyze"
  | "decide"
  | "tool_selection"
  | "execute"
  | "verify"
  | "reflect"
  | "synthesize";

export type AgentTraceItem = {
  stage: AgentStage;
  status: "completed" | "waiting" | "skipped";
  detail: string;
};

export type AgentPlanDetails = {
  intent: string;
  steps: string[];
  approvalRequired?: boolean;
};

export type ToolLogItem = {
  connector: string;
  action: string;
  args?: Record<string, unknown>;
  result?: unknown;
  timestamp: string;
};

export type MarkdownCardPayload = {
  type: string;
  title: string;
  steps?: string[];
  toolsUsed?: string[];
  trace?: AgentTraceItem[];
};

export type ChatWorkflowState = {
  status: WorkflowStatus;
  intent: IntentAnalysisResult | null;
  plan: AgentPlanDetails | null;
  trace: AgentTraceItem[];
  toolLogs: ToolLogItem[];
  markdownCards: MarkdownCardPayload[];
  streamingText: string;
  error: string | null;
  model: string | null;
};

export function useChatWorkflow() {
  const [state, setState] = useState<ChatWorkflowState>({
    status: "idle",
    intent: null,
    plan: null,
    trace: [],
    toolLogs: [],
    markdownCards: [],
    streamingText: "",
    error: null,
    model: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const resetWorkflow = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({
      status: "idle",
      intent: null,
      plan: null,
      trace: [],
      toolLogs: [],
      markdownCards: [],
      streamingText: "",
      error: null,
      model: null,
    });
  }, []);

  const submitPrompt = useCallback(
    async (
      prompt: string,
      options: {
        context?: string;
        model?: string;
        agenticMode?: boolean;
        userId?: number;
      } = {}
    ): Promise<string> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState({
        status: "intent_routing",
        intent: null,
        plan: null,
        trace: [],
        toolLogs: [],
        markdownCards: [],
        streamingText: "",
        error: null,
        model: null,
      });

      let accumulatedText = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            prompt,
            context: options.context,
            model: options.model,
            agenticMode: options.agenticMode,
            userId: options.userId,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Server HTTP error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            if (!block.trim()) continue;

            const eventMatch = block.match(/^event:\s*(.+)$/m);
            const dataMatch = block.match(/^data:\s*(.+)$/m);

            if (!eventMatch || !dataMatch) continue;

            const event = eventMatch[1].trim();
            let data: any = {};
            try {
              data = JSON.parse(dataMatch[1].trim());
            } catch {
              data = { raw: dataMatch[1].trim() };
            }

            switch (event) {
              case "intent":
                setState(prev => ({
                  ...prev,
                  intent: data,
                  status: data.route === "route_a" ? "streaming_route_a" : "executing_route_b",
                }));
                break;

              case "pivot":
                setState(prev => ({
                  ...prev,
                  status: "pivoted_to_route_b",
                  error: null,
                }));
                break;

              case "plan":
                setState(prev => ({ ...prev, plan: data.plan }));
                break;

              case "trace":
                setState(prev => {
                  const existing = prev.trace.filter(t => t.stage !== data.stage);
                  return {
                    ...prev,
                    trace: [...existing, { stage: data.stage, status: "completed", detail: data.detail }],
                  };
                });
                break;

              case "tool_start":
                setState(prev => ({
                  ...prev,
                  toolLogs: [
                    ...prev.toolLogs,
                    {
                      connector: data.connector,
                      action: data.action,
                      args: data.args,
                      timestamp: new Date().toLocaleTimeString(),
                    },
                  ],
                }));
                break;

              case "tool_result":
                setState(prev => ({
                  ...prev,
                  toolLogs: prev.toolLogs.map(log =>
                    log.connector === data.connector && log.action === data.action
                      ? { ...log, result: data.result }
                      : log
                  ),
                }));
                break;

              case "markdown_card":
                setState(prev => ({
                  ...prev,
                  markdownCards: [...prev.markdownCards, data],
                }));
                break;

              case "token":
                accumulatedText += data.chunk || "";
                setState(prev => ({
                  ...prev,
                  streamingText: accumulatedText,
                }));
                break;

              case "final":
                accumulatedText = data.text || accumulatedText;
                setState(prev => ({
                  ...prev,
                  status: "completed",
                  streamingText: accumulatedText,
                  model: data.model || prev.model,
                  plan: data.plan || prev.plan,
                  trace: data.trace || prev.trace,
                }));
                break;

              case "error":
                accumulatedText = data.message || accumulatedText;
                setState(prev => ({
                  ...prev,
                  status: "error",
                  streamingText: accumulatedText,
                  error: data.message || "Hanna could not complete this request.",
                }));
                break;

              case "fallback":
                accumulatedText = data.text || accumulatedText;
                setState(prev => ({
                  ...prev,
                  status: "completed",
                  streamingText: accumulatedText,
                  error: data.error || null,
                }));
                break;
            }
          }
        }

        if (!accumulatedText.trim()) {
          accumulatedText = "I’m here and ready to help. Please try sending your request again.";
        }

        setState(prev => ({
          ...prev,
          status: "completed",
          streamingText: accumulatedText,
        }));

        return accumulatedText;
      } catch (err) {
        if (controller.signal.aborted) return accumulatedText;
        const msg = err instanceof Error ? err.message : "Chat workflow failed";
        setState(prev => ({
          ...prev,
          status: "error",
          error: msg,
        }));
        throw err;
      }
    },
    []
  );

  return {
    ...state,
    submitPrompt,
    resetWorkflow,
    isProcessing: state.status === "intent_routing" || state.status === "streaming_route_a" || state.status === "executing_route_b" || state.status === "pivoted_to_route_b",
  };
}
