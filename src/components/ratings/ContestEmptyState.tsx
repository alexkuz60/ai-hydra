import React from 'react';
import { Crown, Play, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getRatingsText } from './i18n';

interface ContestHistoryItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
  config: { models?: Record<string, unknown> };
}

interface ContestEmptyStateProps {
  isRu: boolean;
  sessionHistory: ContestHistoryItem[];
  onLaunch: () => void;
  onLoadHistory: () => void;
  onLoadSession: (sessionId: string) => void;
}

export function ContestEmptyState({
  isRu,
  sessionHistory,
  onLaunch,
  onLoadHistory,
  onLoadSession,
}: ContestEmptyStateProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">
              {getRatingsText('intelligenceBeautyContest', isRu)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getRatingsText('configureContestAndLaunch', isRu)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={onLaunch} className="gap-2" size="lg">
              <Play className="h-4 w-4" />
              {getRatingsText('launchFromPlan', isRu)}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" onClick={onLoadHistory}>
                  <Archive className="h-4 w-4" />
                  {getRatingsText('loadFromArchive', isRu)}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[70vh]">
                <DialogHeader>
                  <DialogTitle>{getRatingsText('contestArchive', isRu)}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[50vh]">
                  <div className="space-y-2 pr-2">
                    {sessionHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {getRatingsText('noSavedContests', isRu)}
                      </p>
                    ) : (
                      sessionHistory.map(s => (
                        <button
                          key={s.id}
                          onClick={() => onLoadSession(s.id)}
                          className="w-full text-left rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{s.name}</span>
                            <Badge variant={s.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                              {s.status}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString()} • {Object.keys(s.config.models || {}).length} {getRatingsText('models', isRu)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
