import React, { forwardRef, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wrench, Pencil, X, Save, Loader2 } from 'lucide-react';
import { 
  ROLE_CONFIG, 
  DEFAULT_SYSTEM_PROMPTS, 
  type AgentRole 
} from '@/config/roles';
import { cn } from '@/lib/utils';

interface RoleDetailsPanelProps {
  selectedRole: AgentRole | null;
}

const RoleDetailsPanel = forwardRef<HTMLDivElement, RoleDetailsPanelProps>(
  ({ selectedRole }, ref) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    
    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [promptName, setPromptName] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Reset edit state when role changes
    useEffect(() => {
      setIsEditing(false);
      setEditedPrompt('');
      setPromptName('');
      setIsShared(false);
    }, [selectedRole]);

    const handleStartEdit = () => {
      if (!selectedRole) return;
      const defaultPrompt = DEFAULT_SYSTEM_PROMPTS[selectedRole];
      setEditedPrompt(defaultPrompt);
      setPromptName(`${t(ROLE_CONFIG[selectedRole].label)} - Custom`);
      setIsEditing(true);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditedPrompt('');
      setPromptName('');
      setIsShared(false);
    };

    const handleSaveToLibrary = async () => {
      if (!user || !selectedRole || !promptName.trim() || !editedPrompt.trim()) {
        toast.error(t('common.error'));
        return;
      }

      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('prompt_library')
          .insert([{
            user_id: user.id,
            name: promptName.trim(),
            description: t(ROLE_CONFIG[selectedRole].description),
            content: editedPrompt.trim(),
            role: selectedRole,
            is_shared: isShared,
          }]);

        if (error) throw error;

        toast.success(t('staffRoles.promptSaved'));
        setIsEditing(false);
        setEditedPrompt('');
        setPromptName('');
        setIsShared(false);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsSaving(false);
      }
    };

    if (!selectedRole) {
      return (
        <div ref={ref} className="h-full flex items-center justify-center p-6">
          <p className="text-muted-foreground text-center">
            {t('staffRoles.selectRole')}
          </p>
        </div>
      );
    }

    const config = ROLE_CONFIG[selectedRole];
    const IconComponent = config.icon;
    const systemPrompt = DEFAULT_SYSTEM_PROMPTS[selectedRole];

    return (
      <div ref={ref} className="h-full flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header with icon and name */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                `bg-${config.color.replace('text-', '')}/10`
              )}>
                <IconComponent className={cn("h-7 w-7", config.color)} />
              </div>
              <div className="flex-1">
                <h2 className={cn("text-xl font-semibold", config.color)}>
                  {t(config.label)}
                </h2>
                <code className="text-xs text-muted-foreground font-mono">
                  {selectedRole}
                </code>
              </div>
              {config.isTechnicalStaff && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="gap-1.5">
                        <Wrench className="h-3 w-3" />
                        {t('staffRoles.technicalStaff')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{t('staffRoles.technicalStaffHint')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('staffRoles.roleDescription')}
              </h3>
              <p className="text-sm leading-relaxed">
                {t(config.description)}
              </p>
            </div>

            {/* System Prompt */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('staffRoles.systemPrompt')}
                </h3>
                {!isEditing && user && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleStartEdit}
                    className="gap-1.5 h-7 text-xs"
                  >
                    <Pencil className="h-3 w-3" />
                    {t('staffRoles.editAndSave')}
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Prompt Name */}
                  <div className="space-y-2">
                    <Label className="text-xs">{t('staffRoles.promptName')}</Label>
                    <Input
                      value={promptName}
                      onChange={(e) => setPromptName(e.target.value)}
                      placeholder={t('roleLibrary.namePlaceholder')}
                    />
                  </div>

                  {/* Editable Prompt */}
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder={t('roleLibrary.contentPlaceholder')}
                  />

                  {/* Shared toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="prompt-shared"
                      checked={isShared}
                      onCheckedChange={setIsShared}
                    />
                    <Label htmlFor="prompt-shared" className="text-sm cursor-pointer">
                      {t('roleLibrary.isShared')}
                    </Label>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={handleSaveToLibrary}
                      disabled={isSaving || !promptName.trim() || !editedPrompt.trim()}
                      className="gap-1.5"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t('staffRoles.saveToLibrary')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="gap-1.5"
                    >
                      <X className="h-4 w-4" />
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                    {systemPrompt}
                  </pre>
                </div>
              )}
            </div>

            {/* Technical Staff Checkbox */}
            <div className="flex items-center gap-3 pt-2">
              <Checkbox 
                id="technicalStaff" 
                checked={config.isTechnicalStaff}
                disabled
              />
              <label 
                htmlFor="technicalStaff" 
                className="text-sm text-muted-foreground cursor-default"
              >
                {t('staffRoles.technicalStaff')}
              </label>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }
);

RoleDetailsPanel.displayName = 'RoleDetailsPanel';

export default RoleDetailsPanel;
