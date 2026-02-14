import React, { createContext, useContext } from 'react';
import { useContestConfig } from '@/hooks/useContestConfig';

type ContestConfigContextValue = ReturnType<typeof useContestConfig>;

const ContestConfigContext = createContext<ContestConfigContextValue | null>(null);

export function ContestConfigProvider({ children }: { children: React.ReactNode }) {
  const value = useContestConfig();
  return (
    <ContestConfigContext.Provider value={value}>
      {children}
    </ContestConfigContext.Provider>
  );
}

/**
 * Use shared contest config from the nearest ContestConfigProvider.
 * Falls back to a fresh useContestConfig() if no provider is found,
 * so components remain usable outside the provider tree.
 */
export function useContestConfigContext(): ContestConfigContextValue {
  const ctx = useContext(ContestConfigContext);
  if (!ctx) {
    throw new Error('useContestConfigContext must be used within a ContestConfigProvider');
  }
  return ctx;
}
