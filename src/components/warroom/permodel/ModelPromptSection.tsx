import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { RotateCcw } from 'lucide-react';
import { ChevronDown, ChevronUp, Copy, Pencil, Save, Undo2, Library, Clipboard, Trash2 } from 'lucide-react';
import { IconButtonWithTooltip } from '@/components/ui/IconButtonWithTooltip';
import { PromptLibraryPicker } from '../PromptLibraryPicker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { estimateTokens, formatPrice, getModelPricing, type SingleModelSettings, type AgentRole, DEFAULT_SYSTEM_PROMPTS } from './types';

interface ModelPromptSectionProps {
  modelId: string;
  modelSettings: SingleModelSettings;
  onUpdate: (patch: Partial<SingleModelSettings>) => void;
  onReset: () => void;
  onCopyToAll?: () => void;
  showCopyToAll: boolean;
  editingPromptModel: string | null;
  setEditingPromptModel: (id: string | null) => void;
  originalPrompts: Record<string, string>;
  setOriginalPrompts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  expandedPrompts: Record<string, boolean>;
  setExpandedPrompts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function ModelPromptSection({
  modelId, modelSettings, onUpdate, onReset, onCopyToAll, showCopyToAll,
  editingPromptModel, setEditingPromptModel,
  originalPrompts, setOriginalPrompts,
  expandedPrompts, setExpandedPrompts,
}: ModelPromptSectionProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savePromptName, setSavePromptName] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const promptTokens = estimateTokens(modelSettings.systemPrompt);
  const pricing = getModelPricing(modelId);
  const promptCost = pricing ? (promptTokens / 1_000_000) * pricing.input : null;

  const handleStartEdit = () => {
    setOriginalPrompts(prev => ({ ...prev, [modelId]: modelSettings.systemPrompt }));
    setEditingPromptModel(modelId);
  };

  const handleRevert = () => {
    const original = originalPrompts[modelId];
    if (original !== undefined) {
      onUpdate({ systemPrompt: original });
      setOriginalPrompts(prev => { const n = { ...prev }; delete n[modelId]; return n; });
    } else {
      onUpdate({ systemPrompt: DEFAULT_SYSTEM_PROMPTS[modelSettings.role] });
    }
    setEditingPromptModel(null);
    toast.success(t('settings.promptReverted'));
  };

  const handleSave = async () => {
    if (!user || !savePromptName.trim()) return;
    setSavingPrompt(true);
    try {
      const { error } = await supabase.from('prompt_library').insert({
        user_id: user.id, name: savePromptName.trim(), role: modelSettings.role, content: modelSettings.systemPrompt,
      });
      if (error) throw error;
      toast.success(t('settings.promptSaved'));
      setSaveDialogOpen(false);
      setEditingPromptModel(null);
      setOriginalPrompts(prev => { const n = { ...prev }; delete n[modelId]; return n; });
    } catch (error: any) { toast.error(error.message); } finally { setSavingPrompt(false); }
  };

  const handleApplyFromLibrary = (prompt: { content: string; role: AgentRole }) => {
    onUpdate({ role: prompt.role, systemPrompt: prompt.content });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{t('settings.rolePrompt')}</Label>
        <div className="flex items-center gap-2">
          {promptTokens > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono">
              ~{promptTokens} {t('settings.promptTokens')}
              {promptCost !== null && ` • ${formatPrice(promptCost)}`}
            </span>
          )}
          {editingPromptModel === modelId && (
            <span className="text-[10px] text-primary font-medium">{t('settings.promptEditing')}</span>
          )}
          {modelSettings.systemPrompt.length > 150 && (
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setExpandedPrompts(prev => ({ ...prev, [modelId]: !prev[modelId] }))}>
              {expandedPrompts[modelId] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {editingPromptModel === modelId ? (
        <Textarea
          value={modelSettings.systemPrompt}
          onChange={e => onUpdate({ systemPrompt: e.target.value })}
          className="min-h-[100px] max-h-[200px] text-xs resize-none overflow-y-auto hydra-scrollbar"
          placeholder={t('settings.systemPromptPlaceholder')}
          autoFocus
        />
      ) : (
        <div
          className={cn(
            "bg-muted/50 rounded-md p-2 text-xs cursor-pointer hover:bg-muted/70 transition-colors",
            expandedPrompts[modelId] ? "max-h-[200px] overflow-y-auto hydra-scrollbar" : "max-h-[60px] overflow-hidden"
          )}
          onClick={handleStartEdit}
        >
          <p className="whitespace-pre-wrap text-muted-foreground">{modelSettings.systemPrompt || t('settings.systemPromptPlaceholder')}</p>
          {!expandedPrompts[modelId] && modelSettings.systemPrompt.length > 150 && <span className="text-primary text-[10px]">...</span>}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => { navigator.clipboard.writeText(modelSettings.systemPrompt); toast.success(t('settings.promptCopied')); }} disabled={!modelSettings.systemPrompt}>
          <Copy className="h-3 w-3 mr-1" />{t('settings.copyPrompt')}
        </Button>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={async () => { try { const text = await navigator.clipboard.readText(); if (text) { handleStartEdit(); onUpdate({ systemPrompt: text }); toast.success(t('settings.promptPasted')); } } catch { toast.error('Clipboard access denied'); } }}>
          <Clipboard className="h-3 w-3 mr-1" />{t('settings.pastePrompt')}
        </Button>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-destructive hover:text-destructive" onClick={() => { handleStartEdit(); onUpdate({ systemPrompt: '' }); toast.success(t('settings.promptCleared')); }} disabled={!modelSettings.systemPrompt}>
          <Trash2 className="h-3 w-3 mr-1" />{t('settings.clearPrompt')}
        </Button>
      </div>

      {/* Library & action buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button variant="outline" size="sm" className="h-9" onClick={() => setLibraryOpen(true)}>
          <Library className="h-4 w-4 mr-2" />{t('settings.loadFromLibrary')}
        </Button>
        <Button variant="default" size="sm" className="h-9" onClick={() => { setSavePromptName(''); setSaveDialogOpen(true); }}>
          <Save className="h-4 w-4 mr-2" />{t('settings.savePrompt')}
        </Button>
        <IconButtonWithTooltip icon={Undo2} tooltip={t('settings.revertPrompt')} onClick={handleRevert} />
        <IconButtonWithTooltip icon={RotateCcw} tooltip={t('settings.reset')} onClick={onReset} />
        {showCopyToAll && onCopyToAll && (
          <Button variant="outline" size="sm" className="h-9" onClick={onCopyToAll}>
            <Copy className="h-4 w-4 mr-2" />{t('settings.copyToAll')}
          </Button>
        )}
      </div>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('settings.savePrompt')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('settings.promptName')}</Label>
              <Input value={savePromptName} onChange={e => setSavePromptName(e.target.value)} placeholder={t('settings.promptNamePlaceholder')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!savePromptName.trim() || savingPrompt}>{savingPrompt ? t('common.loading') : t('profile.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Library picker */}
      <PromptLibraryPicker open={libraryOpen} onOpenChange={setLibraryOpen} onSelect={handleApplyFromLibrary} currentRole={modelSettings.role} />
    </div>
  );
}
