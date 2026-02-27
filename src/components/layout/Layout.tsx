import React, { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
  defaultSidebarOpen?: boolean;
  hideHeader?: boolean;
}

function LayoutHeader({ headerActions }: { headerActions?: ReactNode }) {
  const { state } = useSidebar();
  const isExpanded = state === 'expanded';

  return (
    <header className="h-10 flex items-center border-b border-border/50 px-2 bg-background/50 backdrop-blur-sm relative z-20">
      {!isExpanded && <SidebarTrigger className="text-muted-foreground hover:text-primary" />}
      <div className="flex-1 flex items-center justify-end gap-2 px-2">
        {headerActions}
        {isExpanded && <SidebarTrigger className="text-muted-foreground hover:text-primary" />}
      </div>
    </header>
  );
}

export function Layout({ children, headerActions, defaultSidebarOpen = true, hideHeader = false }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="min-h-screen flex w-full bg-background hydra-neural-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          {!hideHeader && <LayoutHeader headerActions={headerActions} />}
          <main className={cn("flex-1 flex flex-col min-h-0 overflow-hidden", hideHeader && "min-h-screen")}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
