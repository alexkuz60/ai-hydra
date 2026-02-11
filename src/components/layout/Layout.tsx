import React, { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface LayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
}

export function Layout({ children, headerActions }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background hydra-neural-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Compact header with sidebar trigger */}
          <header className="h-10 flex items-center border-b border-border/50 px-2 bg-background/50 backdrop-blur-sm relative z-20">
            <SidebarTrigger className="text-muted-foreground hover:text-primary" />
            {headerActions && (
              <div className="flex-1 flex items-center justify-end gap-2 px-2">
                {headerActions}
              </div>
            )}
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
