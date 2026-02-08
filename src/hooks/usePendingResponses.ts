import { useState, useEffect, useCallback, useRef } from 'react';
import { PendingResponseState, RequestStartInfo } from '@/types/pending';
import { useStreamingResponses } from '@/hooks/useStreamingResponses';

interface UsePendingResponsesOptions {
  sessionId: string | null;
  userId: string | null;
  selectedModels: string[];
  useHybridStreaming: boolean;
  timeoutSeconds: number;
  onMessageSaved: () => void;
}

export function usePendingResponses({
  sessionId,
  userId,
  selectedModels,
  useHybridStreaming,
  timeoutSeconds,
  onMessageSaved,
}: UsePendingResponsesOptions) {
  const [pendingResponses, setPendingResponses] = useState<Map<string, PendingResponseState>>(new Map());

  // Hybrid streaming hook
  const {
    streamingResponses,
    pendingResponses: streamingPendingResponses,
    startStreaming,
    stopStreaming,
    stopAllStreaming,
    clearCompleted,
  } = useStreamingResponses({
    sessionId,
    userId,
    onMessageSaved,
  });

  // Auto-clear completed streaming responses after a delay
  useEffect(() => {
    const completedResponses = Array.from(streamingResponses.values()).filter(r => !r.isStreaming);
    if (completedResponses.length > 0) {
      const timer = setTimeout(() => clearCompleted(), 500);
      return () => clearTimeout(timer);
    }
  }, [streamingResponses, clearCompleted]);

  // Callback for request start - initialize skeleton indicators
  const handleRequestStart = useCallback((models: RequestStartInfo[]) => {
    if (useHybridStreaming) return;
    
    const now = Date.now();
    const newPending = new Map<string, PendingResponseState>();
    models.forEach(m => {
      newPending.set(m.modelId, {
        modelId: m.modelId,
        modelName: m.modelName,
        role: m.role,
        status: 'sent',
        startTime: now,
        elapsedSeconds: 0,
      });
    });
    setPendingResponses(newPending);
  }, [useHybridStreaming]);

  // Callback for request errors
  const handleRequestError = useCallback((failedModelIds: string[]) => {
    setPendingResponses(prev => {
      const updated = new Map(prev);
      failedModelIds.forEach(modelId => updated.delete(modelId));
      return updated;
    });
  }, []);

  // Timer to update elapsed time
  useEffect(() => {
    if (pendingResponses.size === 0) return;
    
    const interval = setInterval(() => {
      setPendingResponses(prev => {
        const updated = new Map(prev);
        const now = Date.now();
        
        for (const [key, value] of updated) {
          const elapsed = Math.floor((now - value.startTime) / 1000);
          let status: PendingResponseState['status'] = 'sent';
          
          if (elapsed >= timeoutSeconds) status = 'timedout';
          else if (elapsed >= 5) status = 'waiting';
          else if (elapsed >= 2) status = 'confirmed';
          
          updated.set(key, { ...value, elapsedSeconds: elapsed, status });
        }
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pendingResponses.size, timeoutSeconds]);

  // Remove pending when AI message arrives
  const clearPendingForMessages = useCallback((messages: Array<{ role: string; model_name: string | null }>) => {
    if (pendingResponses.size === 0 || messages.length === 0) return;
    
    const recentMessages = messages.slice(-pendingResponses.size * 2);
    
    setPendingResponses(prev => {
      const updated = new Map(prev);
      let changed = false;
      
      for (const msg of recentMessages) {
        if (msg.role !== 'user' && msg.model_name) {
          for (const [key, value] of updated) {
            if (value.modelName === msg.model_name || 
                key.includes(msg.model_name) ||
                msg.model_name.includes(value.modelName)) {
              updated.delete(key);
              changed = true;
              break;
            }
          }
        }
      }
      
      return changed ? updated : prev;
    });
  }, [pendingResponses.size]);

  // Track previous selectedModels to detect removed models
  const prevSelectedModelsRef = useRef<string[]>(selectedModels);
  
  useEffect(() => {
    const prevModels = prevSelectedModelsRef.current;
    const removedModels = prevModels.filter(id => !selectedModels.includes(id));
    prevSelectedModelsRef.current = selectedModels;
    
    if (removedModels.length === 0) return;
    
    setPendingResponses(prev => {
      const updated = new Map(prev);
      let changed = false;
      for (const removedId of removedModels) {
        if (updated.has(removedId)) {
          updated.delete(removedId);
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  }, [selectedModels]);

  // Remove specific pending
  const dismissPending = useCallback((modelId: string) => {
    setPendingResponses(prev => {
      const updated = new Map(prev);
      updated.delete(modelId);
      return updated;
    });
  }, []);

  // Combine pending from both sources
  const combinedPendingResponses = new Map([
    ...pendingResponses,
    ...streamingPendingResponses,
  ]);

  // Filter to only show models in current task
  const filteredPendingResponses = new Map(
    [...combinedPendingResponses].filter(([modelId]) => 
      selectedModels.includes(modelId) || modelId.includes('consultant')
    )
  );

  const filteredStreamingResponses = new Map(
    [...streamingResponses].filter(([modelId]) => 
      selectedModels.includes(modelId)
    )
  );

  return {
    // State
    filteredPendingResponses,
    filteredStreamingResponses,
    streamingResponses,
    // Actions
    handleRequestStart,
    handleRequestError,
    startStreaming,
    stopStreaming,
    stopAllStreaming,
    dismissPending,
    clearPendingForMessages,
  };
}
