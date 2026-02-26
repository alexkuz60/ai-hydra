import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Check, X, RotateCcw, ChevronRight, Pencil, FolderOpen,
  ListChecks, MessageSquare, Save, XCircle, Plus, FolderPlus, Type, Trash2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ApprovalSection, ApprovalStatus } from '@/lib/strategySectionParser';
import { computeApprovalDiff } from '@/lib/strategySectionParser';
import {
  containsMarkdownTable, splitBodyAroundTable, parseMarkdownTable,
  serializeMarkdownTable, MarkdownTableEditor,
} from './MarkdownTableEditor';

interface AddLabels {
  section: { ru: string; en: string };
  item: { ru: string; en: string };
  newSectionTitle: (num: number, lang: string) => string;
  newItemTitle: (lang: string) => string;
  source: ApprovalSection['source'];
}

const STRATEGY_LABELS: AddLabels = {
  section: { ru: 'Добавить фазу', en: 'Add phase' },
  item: { ru: 'Добавить аспект', en: 'Add aspect' },
  newSectionTitle: (num, lang) => lang === 'ru' ? `Фаза ${num}: Новая фаза` : `Phase ${num}: New phase`,
  newItemTitle: (lang) => lang === 'ru' ? 'Новый аспект' : 'New aspect',
  source: 'strategist',
};

const VISION_LABELS: AddLabels = {
  section: { ru: 'Добавить раздел', en: 'Add section' },
  item: { ru: 'Добавить пункт', en: 'Add item' },
  newSectionTitle: (num, lang) => lang === 'ru' ? `Раздел ${num}` : `Section ${num}`,
  newItemTitle: (lang) => lang === 'ru' ? 'Новый пункт' : 'New item',
  source: 'visionary',
};

export { STRATEGY_LABELS, VISION_LABELS };

type ToolbarAction = 'rename' | 'edit' | 'comment';

interface ToolbarSignal {
  action: ToolbarAction;
  tick: number;
}

interface ApprovalSectionEditorProps {
  sections: ApprovalSection[];
  onSectionsChange: (sections: ApprovalSection[]) => void;
  readOnly?: boolean;
  showAddButtons?: boolean | AddLabels;
}

export function ApprovalSectionEditor({ sections, onSectionsChange, readOnly, showAddButtons }: ApprovalSectionEditorProps) {
  const { language } = useLanguage();
  const diff = computeApprovalDiff(sections);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toolbarSignal, setToolbarSignal] = useState<ToolbarSignal>({ action: 'edit', tick: 0 });

  const addLabels: AddLabels | null = showAddButtons
    ? (typeof showAddButtons === 'object' ? showAddButtons : STRATEGY_LABELS)
    : null;

  const selectedPhaseIdx = sections.findIndex(s => s.id === selectedId);
  const selectedParentIdx = selectedPhaseIdx >= 0 ? selectedPhaseIdx : sections.findIndex(s => s.children.some(c => c.id === selectedId));

  // Find selected section
  const findSelected = (): { section: ApprovalSection; path: [number] | [number, number] } | null => {
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].id === selectedId) return { section: sections[i], path: [i] };
      for (let j = 0; j < sections[i].children.length; j++) {
        if (sections[i].children[j].id === selectedId) return { section: sections[i].children[j], path: [i, j] };
      }
    }
    return null;
  };
  const selected = findSelected();

  const updateSelected = (updater: (s: ApprovalSection) => ApprovalSection) => {
    if (!selected) return;
    const next = [...sections];
    if (selected.path.length === 1) {
      next[selected.path[0]] = updater(next[selected.path[0]]);
    } else {
      const [pi, ci] = selected.path as [number, number];
      const parent = { ...next[pi], children: [...next[pi].children] };
      parent.children[ci] = updater(parent.children[ci]);
      next[pi] = parent;
    }
    onSectionsChange(next);
  };

  const setSelectedStatus = (status: ApprovalStatus) => {
    updateSelected((s) => {
      const updated = { ...s, status };
      if (s.depth === 0 && s.children.length > 0) {
        updated.children = s.children.map(c => ({ ...c, status }));
      }
      return updated;
    });
  };

  const fireToolbar = (action: ToolbarAction) => {
    if (!selected) return;
    setToolbarSignal({ action, tick: Date.now() });
  };

  const deleteSelected = () => {
    if (!selected || selected.section.status !== 'rejected') return;
    const next = [...sections];
    if (selected.path.length === 1) {
      next.splice(selected.path[0], 1);
    } else {
      const [pi, ci] = selected.path as [number, number];
      const parent = { ...next[pi], children: [...next[pi].children] };
      parent.children.splice(ci, 1);
      next[pi] = parent;
    }
    setSelectedId(null);
    onSectionsChange(next);
  };

  const addSection = () => {
    if (!addLabels) return;
    const num = sections.filter(s => s.depth === 0).length + 1;
    const title = addLabels.newSectionTitle(num, language);
    const newSection: ApprovalSection = {
      id: `new_section_${Date.now()}`, title, originalTitle: title,
      body: '', originalBody: '', status: 'pending', userComment: '', depth: 0, children: [], source: addLabels.source,
    };
    const next = [...sections];
    const insertIdx = selectedParentIdx >= 0 ? selectedParentIdx + 1 : next.length;
    next.splice(insertIdx, 0, newSection);
    onSectionsChange(next);
    setSelectedId(newSection.id);
  };

  const addItem = () => {
    if (!addLabels) return;
    const itemTitle = addLabels.newItemTitle(language);
    const newItem: ApprovalSection = {
      id: `new_item_${Date.now()}`, title: itemTitle, originalTitle: itemTitle,
      body: '', originalBody: '', status: 'pending', userComment: '', depth: 1, children: [], source: addLabels.source,
    };
    const targetIdx = selectedParentIdx >= 0 ? selectedParentIdx : sections.length - 1;
    if (targetIdx >= 0) {
      const next = [...sections];
      const phase = next[targetIdx];
      next[targetIdx] = { ...phase, children: [...phase.children, newItem] };
      onSectionsChange(next);
      setSelectedId(newItem.id);
    } else {
      onSectionsChange([{ ...newItem, depth: 0 }]);
      setSelectedId(newItem.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar + toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 text-sm text-muted-foreground mb-3 shrink-0">
        <ListChecks className="h-4 w-4" />
        <span>{language === 'ru' ? 'Всего' : 'Total'}: {diff.total}</span>
        {diff.approved > 0 && <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-500">✓ {diff.approved}</Badge>}
        {diff.rejected > 0 && <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">✗ {diff.rejected}</Badge>}
        {diff.rework > 0 && <Badge variant="outline" className="text-xs border-hydra-warning/50 text-hydra-warning">↻ {diff.rework}</Badge>}
        {diff.edited > 0 && <Badge variant="outline" className="text-xs border-primary/50 text-primary">✎ {diff.edited}</Badge>}

        {!readOnly && (
          <div className="flex items-center gap-0.5 ml-auto shrink-0">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn('h-7 w-7', !selected && 'opacity-30 pointer-events-none', selected?.section.status === 'approved' && 'text-emerald-500')}
                onClick={() => selected && setSelectedStatus(selected.section.status === 'approved' ? 'pending' : 'approved')}>
                <Check className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>{language === 'ru' ? 'Утвердить' : 'Approve'}</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn('h-7 w-7', !selected && 'opacity-30 pointer-events-none', selected?.section.status === 'rejected' && 'text-destructive')}
                onClick={() => selected && setSelectedStatus(selected.section.status === 'rejected' ? 'pending' : 'rejected')}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>{language === 'ru' ? 'Отклонить' : 'Reject'}</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn('h-7 w-7', !selected && 'opacity-30 pointer-events-none', selected?.section.status === 'rework' && 'text-hydra-warning')}
                onClick={() => selected && setSelectedStatus(selected.section.status === 'rework' ? 'pending' : 'rework')}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>{language === 'ru' ? 'На доработку' : 'Rework'}</TooltipContent></Tooltip>

            <div className="w-px h-4 bg-border/50 mx-0.5" />

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn('h-7 w-7', !selected && 'opacity-30 pointer-events-none')} onClick={() => fireToolbar('rename')}>
                <Type className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>{language === 'ru' ? 'Переименовать' : 'Rename'}</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn('h-7 w-7', !selected && 'opacity-30 pointer-events-none')} onClick={() => fireToolbar('edit')}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>{language === 'ru' ? 'Редактировать' : 'Edit'}</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn('h-7 w-7', !selected && 'opacity-30 pointer-events-none')} onClick={() => fireToolbar('comment')}>
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>{language === 'ru' ? 'Комментарий' : 'Comment'}</TooltipContent></Tooltip>

            <div className="w-px h-4 bg-border/50 mx-0.5" />

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon"
                className={cn('h-7 w-7', (!selected || selected.section.status !== 'rejected') && 'opacity-30 pointer-events-none', 'hover:text-destructive')}
                onClick={deleteSelected}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>{language === 'ru' ? 'Удалить отклонённое' : 'Delete rejected'}</TooltipContent></Tooltip>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-3">
          {sections.map((section, idx) => (
            <SectionNode
              key={section.id}
              section={section}
              selectedId={selectedId}
              onSelect={setSelectedId}
              toolbarSignal={toolbarSignal}
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
      {!readOnly && addLabels && (
        <div className="flex items-center gap-2 pt-3 shrink-0 border-t border-border/40 mt-2">
          {selectedId && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground mr-1">
              {language === 'ru' ? 'Вставка в:' : 'Insert at:'}{' '}
              {(() => {
                const phase = sections.find(s => s.id === selectedId);
                if (phase) return phase.title;
                for (const s of sections) {
                  const child = s.children.find(c => c.id === selectedId);
                  if (child) return `${s.title} → ${child.title}`;
                }
                return '?';
              })()}
            </Badge>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addSection}>
            <FolderPlus className="h-3.5 w-3.5" />
            {language === 'ru' ? addLabels.section.ru : addLabels.section.en}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" />
            {language === 'ru' ? addLabels.item.ru : addLabels.item.en}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Section Node (no action buttons — driven by toolbar) ─── */

interface SectionNodeProps {
  section: ApprovalSection;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  toolbarSignal: ToolbarSignal;
  onChange: (section: ApprovalSection) => void;
}

function SectionNode({ section, selectedId, onSelect, toolbarSignal, onChange }: SectionNodeProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bodyDraft, setBodyDraft] = useState(section.body);
  const [showComment, setShowComment] = useState(false);
  const [commentDraft, setCommentDraft] = useState(section.userComment);
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);
  const isPhase = section.depth === 0;
  const isSelected = selectedId === section.id;

  // React to toolbar signals when this node is selected
  useEffect(() => {
    if (!isSelected || toolbarSignal.tick === 0) return;
    if (toolbarSignal.action === 'rename') { setIsRenaming(true); setTitleDraft(section.title); }
    if (toolbarSignal.action === 'edit') { setIsEditing(true); setBodyDraft(section.body); }
    if (toolbarSignal.action === 'comment') { setShowComment(true); setCommentDraft(section.userComment); }
  }, [toolbarSignal.tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusColors: Record<ApprovalStatus, string> = {
    pending: 'border-l-muted-foreground/30', approved: 'border-l-emerald-500',
    rejected: 'border-l-destructive', rework: 'border-l-hydra-warning',
  };
  const statusBg: Record<ApprovalStatus, string> = {
    pending: '', approved: 'bg-emerald-500/5', rejected: 'bg-destructive/5', rework: 'bg-hydra-warning/5',
  };

  const handleChildChange = (childIdx: number, child: ApprovalSection) => {
    const children = [...section.children];
    children[childIdx] = child;
    onChange({ ...section, children });
  };

  return (
    <div
      className={cn(
        'border-l-2 rounded-r-md transition-colors cursor-pointer',
        statusColors[section.status], statusBg[section.status],
        isPhase ? 'ml-0' : 'ml-4',
        isSelected && 'ring-1 ring-primary/50 bg-primary/5',
      )}
      onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : section.id); }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-1.5 px-3 py-2">
          {(isPhase && section.children.length > 0) && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-0.5">
                <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-90')} />
              </Button>
            </CollapsibleTrigger>
          )}

          {isPhase ? (
            <FolderOpen className="h-4 w-4 mt-1 shrink-0 text-primary" />
          ) : (
            <div className="w-4 h-4 mt-1 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isRenaming ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} className="h-7 text-sm flex-1" autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { onChange({ ...section, title: titleDraft }); setIsRenaming(false); }
                      else if (e.key === 'Escape') { setTitleDraft(section.title); setIsRenaming(false); }
                    }} />
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-500" onClick={() => { onChange({ ...section, title: titleDraft }); setIsRenaming(false); }}>
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => { setTitleDraft(section.title); setIsRenaming(false); }}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <span className={cn('text-base font-medium', section.status === 'rejected' && 'line-through text-muted-foreground')}>
                  {section.title}
                </span>
              )}
              {!isRenaming && section.status !== 'pending' && <StatusBadge status={section.status} />}
              {!isRenaming && section.body !== section.originalBody && section.status === 'approved' && (
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                  {language === 'ru' ? 'изменено' : 'edited'}
                </Badge>
              )}
            </div>

            {/* Body */}
            {(section.body || isEditing) && (() => {
              const hasTable = containsMarkdownTable(section.body);
              if (isEditing && hasTable) {
                const { before, tableMarkdown, after } = splitBodyAroundTable(bodyDraft);
                const parsed = parseMarkdownTable(tableMarkdown);
                if (parsed) {
                  return (
                    <div className="mt-2">
                      {before.trim() && (
                        <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{before.trim()}</p>
                      )}
                      <MarkdownTableEditor
                        tableData={parsed}
                        onSave={(data) => {
                          const newTable = serializeMarkdownTable(data);
                          const parts = [before.trim(), newTable, after.trim()].filter(Boolean);
                          onChange({ ...section, body: parts.join('\n\n') });
                          setIsEditing(false);
                        }}
                        onCancel={() => { setBodyDraft(section.body); setIsEditing(false); }}
                      />
                      {after.trim() && (
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{after.trim()}</p>
                      )}
                    </div>
                  );
                }
              }

              if (isEditing) {
                return (
                  <div className="mt-2 space-y-1.5">
                    <Textarea value={bodyDraft} onChange={(e) => setBodyDraft(e.target.value)} className="text-sm min-h-[60px] resize-y"
                      placeholder={language === 'ru' ? 'Описание задачи...' : 'Task description...'} autoFocus />
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-emerald-500" onClick={() => { onChange({ ...section, body: bodyDraft }); setIsEditing(false); }}>
                        <Save className="h-3 w-3" />{language === 'ru' ? 'Сохранить' : 'Save'}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={() => { setBodyDraft(section.body); setIsEditing(false); }}>
                        <XCircle className="h-3 w-3" />{language === 'ru' ? 'Отмена' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <p className={cn('text-sm text-muted-foreground mt-1 whitespace-pre-wrap', section.status === 'rejected' && 'line-through')}>
                  {section.body!.length > 200 ? section.body!.substring(0, 200) + '...' : section.body}
                </p>
              );
            })()}

            {/* Comment */}
            {showComment && (
              <div className="mt-2 space-y-1.5">
                <Textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={language === 'ru' ? 'Комментарий (причина отклонения / уточнение)...' : 'Comment (rejection reason / clarification)...'}
                  className="text-sm min-h-[40px] resize-y border-hydra-warning/30" autoFocus />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-emerald-500" onClick={() => { onChange({ ...section, userComment: commentDraft }); setShowComment(false); }}>
                    <Save className="h-3 w-3" />{language === 'ru' ? 'Сохранить' : 'Save'}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={() => { setCommentDraft(section.userComment); setShowComment(false); }}>
                    <XCircle className="h-3 w-3" />{language === 'ru' ? 'Отмена' : 'Cancel'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {section.children.length > 0 && (
          <CollapsibleContent>
            <div className="pl-2 pb-2 space-y-0.5">
              {section.children.map((child, idx) => (
                <SectionNode key={child.id} section={child} selectedId={selectedId} onSelect={onSelect}
                  toolbarSignal={toolbarSignal} onChange={(c) => handleChildChange(idx, c)} />
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
