/*
 * Model Context Protocol (MCP) Server
 * Exposes connected plugins and tools via JSON-RPC 2.0 (tools/list, tools/call)
 */

import { integrations, type IntegrationDefinition } from "@shared/integrations";
import { executeConnectorAction } from "./connectorAdapters";
import { getConnectorCredential, type ConnectorCredential } from "./connectorDb";

export type McpToolSchema = {
  name: string;
  description: string;
  category: string;
  provider: string;
  capabilities: string[];
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
};

export type McpRequest =
  | { jsonrpc: "2.0"; id: number | string; method: "tools/list" }
  | {
      jsonrpc: "2.0";
      id: number | string;
      method: "tools/call";
      params: { name: string; arguments?: Record<string, unknown> };
    };

export function listMcpTools(): McpToolSchema[] {
  const tools: McpToolSchema[] = [];

  for (const integration of integrations) {
    for (const capability of integration.capabilities) {
      const actionName = capability.replace(/[:/]/g, "_");
      tools.push({
        name: `${integration.id}.${actionName}`,
        description: `${integration.name}: ${integration.description} (Capability: ${capability})`,
        category: integration.category,
        provider: integration.id,
        capabilities: [capability],
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query or target entity filter" },
            id: { type: "string", description: "Resource or entity ID" },
            parameters: { type: "object", description: "Action arguments and context" },
          },
        },
      });
    }
  }

  return tools;
}

export async function handleMcpRequest(
  request: McpRequest,
  userId?: number
): Promise<Record<string, unknown>> {
  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        tools: listMcpTools(),
      },
    };
  }

  if (request.method === "tools/call") {
    const { name, arguments: args = {} } = request.params;
    const [connectorId, ...actionParts] = name.split(".");
    const actionName = actionParts.join(".");

    if (!connectorId || !actionName) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32602, message: `Invalid tool name: '${name}'. Expected 'connector.action'.` },
      };
    }

    if (!userId) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32001, message: "Authentication required to execute MCP tool calls." },
      };
    }

    const credential = await getConnectorCredential(userId, connectorId as any);
    if (!credential) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32002, message: `Connector '${connectorId}' is not connected for this user.` },
      };
    }

    try {
      const result = await executeConnectorAction(credential, {
        connector: connectorId as any,
        action: actionName,
        parameters: args,
      });

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: false,
        },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : "MCP execution failed.",
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id: (request as any).id ?? null,
    error: { code: -32601, message: "Method not found" },
  };
}
