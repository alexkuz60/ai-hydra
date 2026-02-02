import { useCallback, useRef, useState } from 'react';
import { Node, Edge } from '@xyflow/react';

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseFlowHistoryOptions {
  maxHistory?: number;
}

interface UseFlowHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  pushState: (state: HistoryState) => void;
  clear: () => void;
}

export function useFlowHistory(options: UseFlowHistoryOptions = {}): UseFlowHistoryReturn {
  const { maxHistory = 50 } = options;
  
  // Use refs to avoid re-renders on every state push
  const undoStack = useRef<HistoryState[]>([]);
  const redoStack = useRef<HistoryState[]>([]);
  
  // State to trigger re-renders when can undo/redo changes
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateCanFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const pushState = useCallback((state: HistoryState) => {
    // Deep clone to avoid reference issues
    const clonedState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    };

    undoStack.current.push(clonedState);

    // Limit history size
    if (undoStack.current.length > maxHistory) {
      undoStack.current.shift();
    }

    // Clear redo stack when new state is pushed
    redoStack.current = [];
    
    updateCanFlags();
  }, [maxHistory, updateCanFlags]);

  const undo = useCallback((): HistoryState | null => {
    if (undoStack.current.length === 0) return null;

    const previousState = undoStack.current.pop()!;
    
    // We need to save current state to redo stack BEFORE returning
    // This will be handled by the caller
    updateCanFlags();
    
    return previousState;
  }, [updateCanFlags]);

  const redo = useCallback((): HistoryState | null => {
    if (redoStack.current.length === 0) return null;

    const nextState = redoStack.current.pop()!;
    updateCanFlags();
    
    return nextState;
  }, [updateCanFlags]);

  const pushToRedo = useCallback((state: HistoryState) => {
    const clonedState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    };
    redoStack.current.push(clonedState);
    updateCanFlags();
  }, [updateCanFlags]);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    updateCanFlags();
  }, [updateCanFlags]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clear,
    // Expose pushToRedo for internal use
    ...(({ pushToRedo }) as any),
  };
}

// Extended return type with pushToRedo
export interface UseFlowHistoryReturnExtended extends UseFlowHistoryReturn {
  pushToRedo: (state: HistoryState) => void;
}

export function useFlowHistoryExtended(options: UseFlowHistoryOptions = {}): UseFlowHistoryReturnExtended {
  const { maxHistory = 50 } = options;
  
  const undoStack = useRef<HistoryState[]>([]);
  const redoStack = useRef<HistoryState[]>([]);
  
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateCanFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const pushState = useCallback((state: HistoryState) => {
    const clonedState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    };

    undoStack.current.push(clonedState);

    if (undoStack.current.length > maxHistory) {
      undoStack.current.shift();
    }

    redoStack.current = [];
    updateCanFlags();
  }, [maxHistory, updateCanFlags]);

  const pushToRedo = useCallback((state: HistoryState) => {
    const clonedState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    };
    redoStack.current.push(clonedState);
    updateCanFlags();
  }, [updateCanFlags]);

  const undo = useCallback((): HistoryState | null => {
    if (undoStack.current.length === 0) return null;
    return undoStack.current.pop()!;
  }, []);

  const redo = useCallback((): HistoryState | null => {
    if (redoStack.current.length === 0) return null;
    return redoStack.current.pop()!;
  }, []);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    updateCanFlags();
  }, [updateCanFlags]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    pushToRedo,
    clear,
  };
}
