import React, { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background hydra-neural-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Compact header with sidebar trigger */}
          <header className="h-10 flex items-center border-b border-border/50 px-2 bg-background/50 backdrop-blur-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-primary" />
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
