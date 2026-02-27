import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, UserCheck, UserMinus, FlaskConical, Ghost, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getModelShortName } from '@/components/warroom/permodel/types';
import type { AgentRole } from '@/config/roles';
import { s } from './i18n';

interface AssignmentRecord {
  id: string;
  role: string;
  model_id: string;
  interview_session_id: string | null;
  interview_avg_score: number | null;
  assigned_at: string;
  removed_at: string | null;
  removal_reason: string | null;
  is_synthetic: boolean;
  metadata: Record<string, unknown> | null;
}

interface RoleAssignmentHistoryProps {
  role: AgentRole;
}

const reasonConfig: Record<string, { icon: typeof UserCheck; labelKey: 'replaced' | 'manual' | 'retestFailed'; color: string }> = {
  replaced: { icon: UserMinus, labelKey: 'replaced', color: 'text-destructive' },
  manual: { icon: RefreshCw, labelKey: 'manual', color: 'text-muted-foreground' },
  retest_failed: { icon: FlaskConical, labelKey: 'retestFailed', color: 'text-hydra-warning' },
};

export function RoleAssignmentHistory({ role }: RoleAssignmentHistoryProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const [records, setRecords] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    supabase
      .from('role_assignment_history')
      .select('*')
      .eq('role', role)
      .eq('user_id', user.id)
      .order('assigned_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data) {
          setRecords(data as AssignmentRecord[]);
        }
        setLoading(false);
      });
  }, [role, user?.id]);

  if (loading) {
    return (
      <div className="space-y-3">
         <h3 className="text-base font-medium text-muted-foreground flex items-center gap-2">
          <History className="h-5 w-5" />
          {s('assignmentHistory', isRu)}
        </h3>
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-3">
         <h3 className="text-base font-medium text-muted-foreground flex items-center gap-2">
          <History className="h-5 w-5" />
          {s('assignmentHistory', isRu)}
        </h3>
        <p className="text-sm text-muted-foreground italic">
          {s('noAssignments', isRu)}
        </p>
      </div>
    );
  }

  const activeRecord = records.find(r => !r.removed_at);

  return (
    <div className="space-y-3">
       <h3 className="text-base font-medium text-muted-foreground flex items-center gap-2">
        <History className="h-5 w-5" />
        {s('assignmentHistory', isRu)}
        <Badge variant="outline" className="text-[10px] ml-auto">{records.length}</Badge>
      </h3>

      <ScrollArea className="max-h-[240px]">
        <div className="space-y-2">
          {records.map((record) => {
            const isActive = record.id === activeRecord?.id;
            const reason = record.removal_reason ? reasonConfig[record.removal_reason] : null;
            const ReasonIcon = reason?.icon;

            return (
              <div
                key={record.id}
                className={cn(
                  "rounded-lg border p-3 text-base transition-colors",
                  isActive ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20",
                  record.is_synthetic && "opacity-60"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {record.is_synthetic && (
                      <Ghost className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-mono text-sm truncate">{getModelShortName(record.model_id)}</span>
                    {isActive && (
                      <Badge variant="default" className="text-[10px] py-0 gap-1">
                        <UserCheck className="h-2.5 w-2.5" />
                        {s('active', isRu)}
                      </Badge>
                    )}
                  </div>

                  {record.interview_avg_score != null && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-mono shrink-0",
                        record.interview_avg_score >= 7 ? "text-primary border-primary/30" :
                        record.interview_avg_score >= 5 ? "text-hydra-warning border-hydra-warning/30" :
                        "text-destructive border-destructive/30"
                      )}
                    >
                      {record.interview_avg_score.toFixed(1)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                  <span>
                    {new Date(record.assigned_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
                      day: 'numeric', month: 'short', year: '2-digit'
                    })}
                    {record.removed_at && (
                      <>
                        {' → '}
                        {new Date(record.removed_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
                          day: 'numeric', month: 'short', year: '2-digit'
                        })}
                      </>
                    )}
                  </span>

                  {reason && ReasonIcon && (
                    <span className={cn("flex items-center gap-1", reason.color)}>
                      <ReasonIcon className="h-3 w-3" />
                      {s(reason.labelKey, isRu)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
