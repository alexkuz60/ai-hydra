import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Check, 
  X, 
  MessageSquare, 
  ChevronDown,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import type { Proposal, ProposalStatus, ProposalPriority } from '@/types/patterns';

interface ProposalApprovalBlockProps {
  proposals: Proposal[];
  onUpdateProposals: (proposals: Proposal[]) => void;
  onRequestDetails?: (proposalIds: string[]) => void;
  isReadOnly?: boolean;
}

const priorityConfig: Record<ProposalPriority, { label: string; color: string; bgColor: string }> = {
  high: { label: 'high', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
  medium: { label: 'medium', color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' },
  low: { label: 'low', color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
};

const statusConfig: Record<ProposalStatus, { icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  approved: { icon: CheckCircle2, color: 'text-hydra-success', bgColor: 'bg-hydra-success/10' },
  rejected: { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  needs_clarification: { icon: AlertCircle, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
};

export function ProposalApprovalBlock({ 
  proposals, 
  onUpdateProposals, 
  onRequestDetails,
  isReadOnly = false 
}: ProposalApprovalBlockProps) {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleComment = useCallback((id: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCommentChange = useCallback((id: string, comment: string) => {
    setCommentDrafts(prev => ({ ...prev, [id]: comment }));
  }, []);

  const handleSaveComment = useCallback((id: string) => {
    const comment = commentDrafts[id];
    if (comment !== undefined) {
      const updated = proposals.map(p => 
        p.id === id ? { ...p, comment } : p
      );
      onUpdateProposals(updated);
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [proposals, commentDrafts, onUpdateProposals]);

  const handleApproveSelected = useCallback(() => {
    const updated = proposals.map(p => 
      selectedIds.has(p.id) ? { ...p, status: 'approved' as ProposalStatus } : p
    );
    onUpdateProposals(updated);
    setSelectedIds(new Set());
  }, [proposals, selectedIds, onUpdateProposals]);

  const handleRejectAll = useCallback(() => {
    const updated = proposals.map(p => ({ ...p, status: 'rejected' as ProposalStatus }));
    onUpdateProposals(updated);
    setSelectedIds(new Set());
  }, [proposals, onUpdateProposals]);

  const handleRequestDetails = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length > 0 && onRequestDetails) {
      onRequestDetails(ids);
    }
  }, [selectedIds, onRequestDetails]);

  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const approvedCount = proposals.filter(p => p.status === 'approved').length;
  const rejectedCount = proposals.filter(p => p.status === 'rejected').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card/50 overflow-hidden mt-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
        <Lightbulb className="h-4 w-4 text-hydra-advisor" />
        <span className="text-sm font-medium">{t('proposals.title')}</span>
        <div className="flex items-center gap-2 ml-auto text-xs">
          {pendingCount > 0 && (
            <Badge variant="secondary" className="gap-1 py-0">
              <Clock className="h-3 w-3" />
              {pendingCount}
            </Badge>
          )}
          {approvedCount > 0 && (
            <Badge variant="secondary" className="gap-1 py-0 bg-hydra-success/20 text-hydra-success border-hydra-success/30">
              <Check className="h-3 w-3" />
              {approvedCount}
            </Badge>
          )}
          {rejectedCount > 0 && (
            <Badge variant="secondary" className="gap-1 py-0 bg-destructive/20 text-destructive border-destructive/30">
              <X className="h-3 w-3" />
              {rejectedCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Proposals list */}
      <div className="divide-y divide-border">
        <AnimatePresence>
          {proposals.map((proposal, index) => {
            const StatusIcon = statusConfig[proposal.status].icon;
            const priorityInfo = proposal.priority ? priorityConfig[proposal.priority] : null;
            const isCommentExpanded = expandedComments.has(proposal.id);
            const currentComment = commentDrafts[proposal.id] ?? proposal.comment ?? '';
            
            return (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "px-4 py-3 transition-colors",
                  statusConfig[proposal.status].bgColor
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox or status icon */}
                  {!isReadOnly && proposal.status === 'pending' ? (
                    <Checkbox
                      checked={selectedIds.has(proposal.id)}
                      onCheckedChange={() => handleToggleSelect(proposal.id)}
                      className="mt-0.5"
                    />
                  ) : (
                    <StatusIcon className={cn("h-4 w-4 mt-0.5", statusConfig[proposal.status].color)} />
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium">{index + 1}. {proposal.title}</span>
                      {priorityInfo && (
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] py-0 px-1.5", priorityInfo.bgColor, priorityInfo.color)}
                        >
                          {t(`proposals.priority.${priorityInfo.label}`)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{proposal.description}</p>
                    
                    {/* Comment section */}
                    {proposal.comment && !isCommentExpanded && (
                      <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">
                        {proposal.comment}
                      </p>
                    )}
                    
                    <Collapsible open={isCommentExpanded}>
                      <CollapsibleContent className="mt-2">
                        <Textarea
                          value={currentComment}
                          onChange={(e) => handleCommentChange(proposal.id, e.target.value)}
                          placeholder={t('proposals.commentPlaceholder')}
                          className="text-xs min-h-[60px]"
                          disabled={isReadOnly}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleComment(proposal.id)}
                            className="h-7 text-xs"
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveComment(proposal.id)}
                            className="h-7 text-xs"
                            disabled={isReadOnly}
                          >
                            {t('common.save')}
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  
                  {/* Comment toggle button */}
                  {!isReadOnly && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleComment(proposal.id)}
                            className={cn(
                              "h-7 w-7",
                              isCommentExpanded && "bg-muted"
                            )}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="text-xs">{t('proposals.addComment')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Actions footer */}
      {!isReadOnly && pendingCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-t border-border">
          <Button
            size="sm"
            onClick={handleApproveSelected}
            disabled={selectedIds.size === 0}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            {t('proposals.approve')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRejectAll}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            {t('proposals.reject')}
          </Button>
          {onRequestDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestDetails}
              disabled={selectedIds.size === 0}
              className="ml-auto gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t('proposals.requestDetails')}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}