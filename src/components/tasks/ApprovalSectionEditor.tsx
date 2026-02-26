import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Check, X, RotateCcw, ChevronRight, Pencil, FolderOpen,
  ListChecks, MessageSquare, Save, XCircle, Plus, FolderPlus,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ApprovalSection, ApprovalStatus } from '@/lib/strategySectionParser';
import { computeApprovalDiff } from '@/lib/strategySectionParser';

interface ApprovalSectionEditorProps {
  sections: ApprovalSection[];
  onSectionsChange: (sections: ApprovalSection[]) => void;
  readOnly?: boolean;
}

export function ApprovalSectionEditor({ sections, onSectionsChange, readOnly }: ApprovalSectionEditorProps) {
  const { language } = useLanguage();
  const diff = computeApprovalDiff(sections);

  const addPhase = () => {
    const phaseNum = sections.filter(s => s.depth === 0).length + 1;
    const newPhase: ApprovalSection = {
      id: `new_phase_${Date.now()}`,
      title: language === 'ru' ? `Фаза ${phaseNum}: Новая фаза` : `Phase ${phaseNum}: New phase`,
      body: '',
      originalBody: '',
      status: 'pending',
      userComment: '',
      depth: 0,
      children: [],
      source: 'strategist',
    };
    onSectionsChange([...sections, newPhase]);
  };

  const addAspect = () => {
    const newAspect: ApprovalSection = {
      id: `new_aspect_${Date.now()}`,
      title: language === 'ru' ? 'Новый аспект' : 'New aspect',
      body: '',
      originalBody: '',
      status: 'pending',
      userComment: '',
      depth: 0,
      children: [],
      source: 'strategist',
    };
    onSectionsChange([...sections, newAspect]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 text-sm text-muted-foreground mb-3 shrink-0">
        <ListChecks className="h-4 w-4" />
        <span>{language === 'ru' ? 'Всего' : 'Total'}: {diff.total}</span>
        {diff.approved > 0 && <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-500">✓ {diff.approved}</Badge>}
        {diff.rejected > 0 && <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">✗ {diff.rejected}</Badge>}
        {diff.rework > 0 && <Badge variant="outline" className="text-xs border-hydra-warning/50 text-hydra-warning">↻ {diff.rework}</Badge>}
        {diff.edited > 0 && <Badge variant="outline" className="text-xs border-primary/50 text-primary">✎ {diff.edited}</Badge>}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-3">
          {sections.map((section, idx) => (
            <SectionNode
              key={section.id}
              section={section}
              readOnly={readOnly}
              onChange={(updated) => {
                const next = [...sections];
                next[idx] = updated;
                onSectionsChange(next);
              }}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Add buttons */}
      {!readOnly && (
        <div className="flex items-center gap-2 pt-3 shrink-0 border-t border-border/40 mt-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addPhase}>
            <FolderPlus className="h-3.5 w-3.5" />
            {language === 'ru' ? 'Добавить фазу' : 'Add phase'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addAspect}>
            <Plus className="h-3.5 w-3.5" />
            {language === 'ru' ? 'Добавить аспект' : 'Add aspect'}
          </Button>
        </div>
      )}
    </div>
  );
}

interface SectionNodeProps {
  section: ApprovalSection;
  readOnly?: boolean;
  onChange: (section: ApprovalSection) => void;
}

function SectionNode({ section, readOnly, onChange }: SectionNodeProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bodyDraft, setBodyDraft] = useState(section.body);
  const [showComment, setShowComment] = useState(false);
  const [commentDraft, setCommentDraft] = useState(section.userComment);
  const isAspect = section.depth === 0;

  const statusColors: Record<ApprovalStatus, string> = {
    pending: 'border-l-muted-foreground/30',
    approved: 'border-l-emerald-500',
    rejected: 'border-l-destructive',
    rework: 'border-l-hydra-warning',
  };

  const statusBg: Record<ApprovalStatus, string> = {
    pending: '',
    approved: 'bg-emerald-500/5',
    rejected: 'bg-destructive/5',
    rework: 'bg-hydra-warning/5',
  };

  const setStatus = (status: ApprovalStatus) => {
    const updated = { ...section, status };
    // Also apply to all children if approving/rejecting an aspect
    if (isAspect && section.children.length > 0) {
      updated.children = section.children.map(c => ({ ...c, status }));
    }
    onChange(updated);
  };

  const handleBodyChange = (body: string) => {
    onChange({ ...section, body });
  };

  const handleCommentChange = (userComment: string) => {
    onChange({ ...section, userComment });
  };

  const handleChildChange = (childIdx: number, child: ApprovalSection) => {
    const children = [...section.children];
    children[childIdx] = child;
    onChange({ ...section, children });
  };

  return (
    <div className={cn(
      'border-l-2 rounded-r-md transition-colors',
      statusColors[section.status],
      statusBg[section.status],
      isAspect ? 'ml-0' : 'ml-4',
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-1.5 px-3 py-2">
          {/* Expand toggle */}
          {(isAspect && section.children.length > 0) && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-0.5">
                <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-90')} />
              </Button>
            </CollapsibleTrigger>
          )}

          {/* Icon */}
          {isAspect ? (
            <FolderOpen className="h-4 w-4 mt-1 shrink-0 text-primary" />
          ) : (
            <div className="w-4 h-4 mt-1 shrink-0" />
          )}

          {/* Title + body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'text-base font-medium',
                section.status === 'rejected' && 'line-through text-muted-foreground',
              )}>
                {section.title}
              </span>
              {section.status !== 'pending' && (
                <StatusBadge status={section.status} />
              )}
              {section.body !== section.originalBody && section.status === 'approved' && (
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                  {language === 'ru' ? 'изменено' : 'edited'}
                </Badge>
              )}
            </div>

            {/* Body text */}
            {section.body && (
              isEditing ? (
                <div className="mt-2 space-y-1.5">
                  <Textarea
                    value={bodyDraft}
                    onChange={(e) => setBodyDraft(e.target.value)}
                    className="text-sm min-h-[60px] resize-y"
                    autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1 text-emerald-500"
                      onClick={() => {
                        handleBodyChange(bodyDraft);
                        setIsEditing(false);
                      }}
                    >
                      <Save className="h-3 w-3" />
                      {language === 'ru' ? 'Сохранить' : 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1 text-muted-foreground"
                      onClick={() => {
                        setBodyDraft(section.body);
                        setIsEditing(false);
                      }}
                    >
                      <XCircle className="h-3 w-3" />
                      {language === 'ru' ? 'Отмена' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={cn(
                  'text-sm text-muted-foreground mt-1 whitespace-pre-wrap cursor-pointer hover:text-foreground transition-colors',
                  section.status === 'rejected' && 'line-through',
                )}
                  onClick={() => !readOnly && setIsEditing(true)}
                  title={language === 'ru' ? 'Нажмите для редактирования' : 'Click to edit'}
                >
                  {section.body.length > 200 ? section.body.substring(0, 200) + '...' : section.body}
                </p>
              )
            )}

            {/* User comment for reject/rework */}
            {showComment && (
              <div className="mt-2 space-y-1.5">
                <Textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={language === 'ru' ? 'Комментарий (причина отклонения / уточнение)...' : 'Comment (rejection reason / clarification)...'}
                  className="text-sm min-h-[40px] resize-y border-hydra-warning/30"
                  autoFocus
                />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-emerald-500"
                    onClick={() => {
                      handleCommentChange(commentDraft);
                      setShowComment(false);
                    }}
                  >
                    <Save className="h-3 w-3" />
                    {language === 'ru' ? 'Сохранить' : 'Save'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-muted-foreground"
                    onClick={() => {
                      setCommentDraft(section.userComment);
                      setShowComment(false);
                    }}
                  >
                    <XCircle className="h-3 w-3" />
                    {language === 'ru' ? 'Отмена' : 'Cancel'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!readOnly && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-7 w-7', section.status === 'approved' && 'text-emerald-500')}
                    onClick={() => setStatus(section.status === 'approved' ? 'pending' : 'approved')}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{language === 'ru' ? 'Утвердить' : 'Approve'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-7 w-7', section.status === 'rejected' && 'text-destructive')}
                    onClick={() => {
                      setStatus(section.status === 'rejected' ? 'pending' : 'rejected');
                      if (section.status !== 'rejected') setShowComment(true);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{language === 'ru' ? 'Отклонить' : 'Reject'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-7 w-7', section.status === 'rework' && 'text-hydra-warning')}
                    onClick={() => {
                      setStatus(section.status === 'rework' ? 'pending' : 'rework');
                      if (section.status !== 'rework') setShowComment(true);
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{language === 'ru' ? 'На доработку' : 'Rework'}</TooltipContent>
              </Tooltip>

              {section.body && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{language === 'ru' ? 'Редактировать' : 'Edit'}</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowComment(!showComment)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{language === 'ru' ? 'Комментарий' : 'Comment'}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Children */}
        {section.children.length > 0 && (
          <CollapsibleContent>
            <div className="pl-2 pb-2 space-y-0.5">
              {section.children.map((child, idx) => (
                <SectionNode
                  key={child.id}
                  section={child}
                  readOnly={readOnly}
                  onChange={(c) => handleChildChange(idx, c)}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const labels: Record<ApprovalStatus, { ru: string; en: string; cls: string }> = {
    pending: { ru: 'ожидает', en: 'pending', cls: 'text-muted-foreground border-muted-foreground/30' },
    approved: { ru: '✓', en: '✓', cls: 'text-emerald-500 border-emerald-500/40' },
    rejected: { ru: '✗', en: '✗', cls: 'text-destructive border-destructive/40' },
    rework: { ru: '↻', en: '↻', cls: 'text-hydra-warning border-hydra-warning/40' },
  };
  const { language } = useLanguage();
  const cfg = labels[status];
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1 py-0', cfg.cls)}>
      {language === 'ru' ? cfg.ru : cfg.en}
    </Badge>
  );
}

export default ApprovalSectionEditor;
