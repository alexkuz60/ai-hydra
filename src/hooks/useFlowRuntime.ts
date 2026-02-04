import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============================================
// Types for Flow Runtime
// ============================================

type NodeState = 'pending' | 'ready' | 'running' | 'waiting_user' | 'completed' | 'failed' | 'skipped';

export interface FlowExecutionEvent {
  type: 'flow_start' | 'node_start' | 'node_progress' | 'node_complete' | 'node_error' | 'checkpoint' | 'flow_complete' | 'flow_error';
  flowId: string;
  nodeId?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface NodeStatus {
  nodeId: string;
  state: NodeState;
  progress?: string;
  output?: unknown;
  error?: string;
}

export interface FlowExecutionState {
  isRunning: boolean;
  isPaused: boolean;
  currentNodeId?: string;
  nodeStatuses: Map<string, NodeStatus>;
  // Map of nodeId -> output data for edge visualization
  nodeOutputs: Map<string, unknown>;
  checkpoint?: {
    nodeId: string;
    message: string;
  };
  finalOutput?: unknown;
  error?: string;
}

export interface UseFlowRuntimeOptions {
  onEvent?: (event: FlowExecutionEvent) => void;
  onComplete?: (output: unknown) => void;
  onError?: (error: string) => void;
  onCheckpoint?: (nodeId: string, message: string) => void;
}

// ============================================
// Hook
// ============================================

export function useFlowRuntime(options: UseFlowRuntimeOptions = {}) {
  const { toast } = useToast();
  const [state, setState] = useState<FlowExecutionState>({
    isRunning: false,
    isPaused: false,
    nodeStatuses: new Map(),
    nodeOutputs: new Map(),
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  /**
   * Start executing a flow diagram
   */
  const startFlow = useCallback(async (
    flowId: string,
    sessionId: string,
    input?: Record<string, unknown>
  ) => {
    // Cancel any existing execution
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState({
      isRunning: true,
      isPaused: false,
      nodeStatuses: new Map(),
      nodeOutputs: new Map(),
      currentNodeId: undefined,
      checkpoint: undefined,
      finalOutput: undefined,
      error: undefined,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/flow-runtime`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'start',
            flow_id: flowId,
            session_id: sessionId,
            input,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start flow');
      }

      // Process SSE stream
      await processSSEStream(response, flowId);

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('[useFlowRuntime] Execution aborted');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, isRunning: false, error: errorMessage }));
      options.onError?.(errorMessage);
      toast({
        title: 'Flow execution error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [options, toast]);

  /**
   * Resume a paused flow with checkpoint response
   */
  const resumeFlow = useCallback(async (
    flowId: string,
    sessionId: string,
    nodeId: string,
    approved: boolean,
    userInput?: string
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      checkpoint: undefined,
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/flow-runtime`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'checkpoint_response',
            flow_id: flowId,
            session_id: sessionId,
            checkpoint_data: {
              node_id: nodeId,
              approved,
              user_input: userInput,
            },
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resume flow');
      }

      await processSSEStream(response, flowId);

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, isRunning: false, error: errorMessage }));
      options.onError?.(errorMessage);
    }
  }, [options]);

  /**
   * Cancel running flow
   */
  const cancelFlow = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (readerRef.current) {
      readerRef.current.cancel();
    }
    setState(prev => ({ ...prev, isRunning: false, isPaused: false }));
  }, []);

  /**
   * Clear execution results (node outputs for edge visualization)
   */
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      nodeStatuses: new Map(),
      nodeOutputs: new Map(),
      finalOutput: undefined,
      error: undefined,
    }));
  }, []);

  /**
   * Process SSE stream from flow-runtime
   */
  const processSSEStream = async (response: Response, flowId: string) => {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    readerRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              setState(prev => ({ ...prev, isRunning: false }));
              return;
            }

            try {
              const event: FlowExecutionEvent = JSON.parse(data);
              handleEvent(event);
              options.onEvent?.(event);
            } catch (e) {
              console.warn('[useFlowRuntime] Failed to parse event:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      readerRef.current = null;
    }
  };

  /**
   * Handle individual SSE events
   */
  const handleEvent = (event: FlowExecutionEvent) => {
    switch (event.type) {
      case 'flow_start':
        setState(prev => ({
          ...prev,
          isRunning: true,
          nodeStatuses: new Map(),
          nodeOutputs: new Map(),
        }));
        break;

      case 'node_start':
        if (event.nodeId) {
          setState(prev => {
            const newStatuses = new Map(prev.nodeStatuses);
            newStatuses.set(event.nodeId!, {
              nodeId: event.nodeId!,
              state: 'running',
              progress: (event.data as { message?: string }).message,
            });
            return {
              ...prev,
              currentNodeId: event.nodeId,
              nodeStatuses: newStatuses,
            };
          });
        }
        break;

      case 'node_progress':
        if (event.nodeId) {
          setState(prev => {
            const newStatuses = new Map(prev.nodeStatuses);
            const existing = newStatuses.get(event.nodeId!) || { nodeId: event.nodeId!, state: 'running' as NodeState };
            newStatuses.set(event.nodeId!, {
              ...existing,
              progress: (event.data as { message?: string }).message,
            });
            return { ...prev, nodeStatuses: newStatuses };
          });
        }
        break;

      case 'node_complete':
        if (event.nodeId) {
          setState(prev => {
            const newStatuses = new Map(prev.nodeStatuses);
            const newOutputs = new Map(prev.nodeOutputs);
            const eventData = event.data as { outputPreview?: unknown; output?: unknown };
            const outputData = eventData.output ?? eventData.outputPreview;
            
            const existing = newStatuses.get(event.nodeId!) || { nodeId: event.nodeId!, state: 'completed' as NodeState };
            newStatuses.set(event.nodeId!, {
              ...existing,
              state: 'completed',
              output: eventData.outputPreview,
            });
            
            // Store full output for edge visualization
            if (outputData !== undefined) {
              newOutputs.set(event.nodeId!, outputData);
            }
            
            return { ...prev, nodeStatuses: newStatuses, nodeOutputs: newOutputs };
          });
        }
        break;

      case 'node_error':
        if (event.nodeId) {
          setState(prev => {
            const newStatuses = new Map(prev.nodeStatuses);
            newStatuses.set(event.nodeId!, {
              nodeId: event.nodeId!,
              state: 'failed',
              error: (event.data as { error?: string }).error,
            });
            return { ...prev, nodeStatuses: newStatuses };
          });
        }
        break;

      case 'checkpoint':
        {
          const checkpointData = event.data as { message?: string };
          setState(prev => ({
            ...prev,
            isPaused: true,
            checkpoint: {
              nodeId: event.nodeId!,
              message: checkpointData.message || 'Checkpoint reached',
            },
          }));
          options.onCheckpoint?.(event.nodeId!, checkpointData.message || 'Checkpoint reached');
        }
        break;

      case 'flow_complete':
        {
          const completeData = event.data as { output?: unknown; checkpoint?: { nodeId: string; message: string } };
          if (completeData.checkpoint) {
            setState(prev => ({
              ...prev,
              isPaused: true,
              checkpoint: completeData.checkpoint,
            }));
            options.onCheckpoint?.(completeData.checkpoint.nodeId, completeData.checkpoint.message);
          } else {
            // Clear nodeOutputs to stop edge pulse animations
            setState(prev => ({
              ...prev,
              isRunning: false,
              nodeOutputs: new Map(),
              finalOutput: completeData.output,
            }));
            options.onComplete?.(completeData.output);
          }
        }
        break;

      case 'flow_error':
        {
          const errorData = event.data as { error?: string };
          setState(prev => ({
            ...prev,
            isRunning: false,
            error: errorData.error,
          }));
          options.onError?.(errorData.error || 'Unknown error');
        }
        break;
    }
  };

  return {
    ...state,
    startFlow,
    resumeFlow,
    cancelFlow,
    clearResults,
  };
}
