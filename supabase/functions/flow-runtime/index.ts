import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { FlowRuntimeRequest, SSEEvent, FlowNode, FlowEdge } from "./types.ts";
import { FlowExecutor } from "./executor.ts";

// ============================================
// Flow Runtime Edge Function
// Executes flow diagrams as autonomous pipelines with SSE streaming
// ============================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const body: FlowRuntimeRequest = await req.json();
    const { action, flow_id, session_id, input, checkpoint_data } = body;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Fetch flow diagram
    const { data: flowDiagram, error: flowError } = await supabase
      .from("flow_diagrams")
      .select("*")
      .eq("id", flow_id)
      .single();

    if (flowError || !flowDiagram) {
      return new Response(
        JSON.stringify({ error: "Flow diagram not found" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Check access (owner or shared)
    if (flowDiagram.user_id !== user.id && !flowDiagram.is_shared) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    console.log(`[flow-runtime] Action: ${action}, Flow: ${flow_id}, User: ${user.id}`);

    // Handle different actions
    switch (action) {
      case "start":
      case "resume": {
        return await handleExecute(
          flow_id,
          session_id,
          flowDiagram.nodes as FlowNode[],
          flowDiagram.edges as FlowEdge[],
          user.id,
          input || {},
          checkpoint_data,
          {
            supabaseUrl: SUPABASE_URL,
            supabaseKey: SUPABASE_SERVICE_ROLE_KEY,
            lovableApiKey: LOVABLE_API_KEY,
          }
        );
      }

      case "cancel": {
        // For now, just acknowledge cancellation
        // In a full implementation, we'd track running executions
        return new Response(
          JSON.stringify({ success: true, message: "Execution cancelled" }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      case "checkpoint_response": {
        if (!checkpoint_data) {
          return new Response(
            JSON.stringify({ error: "checkpoint_data required for checkpoint_response action" }),
            { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }
        // Resume execution with checkpoint response
        return await handleExecute(
          flow_id,
          session_id,
          flowDiagram.nodes as FlowNode[],
          flowDiagram.edges as FlowEdge[],
          user.id,
          input || {},
          checkpoint_data,
          {
            supabaseUrl: SUPABASE_URL,
            supabaseKey: SUPABASE_SERVICE_ROLE_KEY,
            lovableApiKey: LOVABLE_API_KEY,
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
    }

  } catch (error) {
    console.error("[flow-runtime] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Handle flow execution with SSE streaming
 */
async function handleExecute(
  flowId: string,
  sessionId: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  userId: string,
  input: Record<string, unknown>,
  checkpointData: FlowRuntimeRequest["checkpoint_data"],
  config: { supabaseUrl: string; supabaseKey: string; lovableApiKey: string }
): Promise<Response> {
  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendSSE = (event: SSEEvent) => {
        const data = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        // Create executor
        const executor = new FlowExecutor(
          flowId,
          nodes,
          edges,
          {
            ...config,
            userId,
            sessionId,
          },
          sendSSE
        );

        // Set initial context
        executor.setContext({ input, ...input });

        // Set checkpoint response if provided
        if (checkpointData) {
          executor.setCheckpointResponse(
            checkpointData.node_id,
            checkpointData.approved,
            checkpointData.user_input
          );
        }

        // Execute flow
        const result = await executor.execute();

        // Send final result
        sendSSE({
          type: result.waitingForCheckpoint ? 'checkpoint' : 'flow_complete',
          flowId,
          data: {
            success: result.success,
            output: result.output,
            error: result.error,
            checkpoint: result.waitingForCheckpoint,
          },
          timestamp: new Date().toISOString(),
        });

        // Close stream
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        sendSSE({
          type: 'flow_error',
          flowId,
          data: { error: errorMessage },
          timestamp: new Date().toISOString(),
        });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
