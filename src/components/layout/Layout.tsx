import React, { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background hydra-neural-bg">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
