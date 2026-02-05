 import { useState, useCallback, useEffect } from 'react';
 
 interface InputAreaSizeState {
   height: number;
   isCollapsed: boolean;
 }
 
 const DEFAULT_HEIGHT = 25; // percentage (panel size)
 const MIN_HEIGHT = 10;
 const MAX_HEIGHT = 40;
 
 export function useInputAreaSize(storageKey: string) {
   const [state, setState] = useState<InputAreaSizeState>(() => {
     try {
       const saved = localStorage.getItem(storageKey);
       if (saved) {
         const parsed = JSON.parse(saved);
         return {
           height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, parsed.height ?? DEFAULT_HEIGHT)),
           isCollapsed: parsed.isCollapsed ?? false,
         };
       }
     } catch {
       // ignore parse errors
     }
     return { height: DEFAULT_HEIGHT, isCollapsed: false };
   });
 
   // Persist to localStorage on change
   useEffect(() => {
     try {
       localStorage.setItem(storageKey, JSON.stringify(state));
     } catch {
       // ignore storage errors
     }
   }, [storageKey, state]);
 
   const setHeight = useCallback((height: number) => {
     setState(prev => ({
       ...prev,
       height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height)),
     }));
   }, []);
 
   const toggleCollapsed = useCallback(() => {
     setState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }));
   }, []);
 
   const setCollapsed = useCallback((isCollapsed: boolean) => {
     setState(prev => ({ ...prev, isCollapsed }));
   }, []);
 
   return {
     height: state.height,
     isCollapsed: state.isCollapsed,
     setHeight,
     toggleCollapsed,
     setCollapsed,
   };
 }