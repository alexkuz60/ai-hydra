import React, { useMemo, useState } from 'react';
import { FieldError } from '@/components/ui/FieldError';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentRole } from '@/config/roles';
import { RoleSelectOptions, RoleDisplay } from '@/components/ui/RoleSelectItem';
import type { PromptFormData, PromptLanguage } from '@/hooks/usePromptsCRUD';
import { generatePromptName } from '@/hooks/usePromptsCRUD';
import PromptSectionsEditor from '@/components/staff/PromptSectionsEditor';
import { parsePromptSections, sectionsToPrompt, PromptSection, getDefaultSections } from '@/lib/promptSectionParser';

interface ValidationErrors {
  nickname?: string;
  content?: string;
}

function validateForm(formData: PromptFormData, t: (key: string) => string): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (!formData.nickname.trim()) {
    errors.nickname = t('roleLibrary.validation.nameRequired');
  } else if (formData.nickname.length > 50) {
    errors.nickname = t('roleLibrary.validation.nameTooLong');
  }
  
  if (!formData.content.trim()) {
    errors.content = t('roleLibrary.validation.contentRequired');
  }
  
  return errors;
}




interface AdvancedPromptEditorProps {
  formData: PromptFormData;
  onChange: (data: PromptFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEditing: boolean;
}

export function AdvancedPromptEditor({
  formData,
  onChange,
  onSave,
  onCancel,
  saving,
  isEditing,
}: AdvancedPromptEditorProps) {
  const { t } = useLanguage();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Parse content into sections (or get defaults for new prompts)
  const { title: parsedTitle, sections: parsedSections } = useMemo(() => {
    if (formData.content.trim()) {
      return parsePromptSections(formData.content);
    }
    // For new prompts, return default empty sections structure
    return { title: '', sections: getDefaultSections() };
  }, [formData.content]);

  // Local title state for editor (synced to formData on change)
  const [editorTitle, setEditorTitle] = useState(parsedTitle);
  const [editorSections, setEditorSections] = useState<PromptSection[]>(parsedSections);

  // Sync parsed content when formData.content changes externally
  React.useEffect(() => {
    if (formData.content.trim()) {
      const { title, sections } = parsePromptSections(formData.content);
      setEditorTitle(title);
      setEditorSections(sections);
    } else {
      setEditorTitle('');
      setEditorSections(getDefaultSections());
    }
  }, [formData.content]);

  const errors = useMemo(() => validateForm(formData, t), [formData, t]);
  const isValid = Object.keys(errors).length === 0;

  const shouldShowError = (field: string) => touched[field] || submitAttempted;

  const markTouched = (field: string) => {
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  };

  const updateField = <K extends keyof PromptFormData>(field: K, value: PromptFormData[K]) => {
    const updated = { ...formData, [field]: value };
    
    // Auto-generate technical name when nickname, role or language changes
    if (field === 'nickname' || field === 'role' || field === 'language') {
      const nickname = field === 'nickname' ? (value as string) : updated.nickname;
      const role = field === 'role' ? (value as AgentRole) : updated.role;
      const language = field === 'language' ? (value as PromptLanguage) : updated.language;
      updated.name = generatePromptName(nickname, role, language, false);
    }
    
    onChange(updated);
  };

  // Handle sections editor changes
  const handleTitleChange = (newTitle: string) => {
    setEditorTitle(newTitle);
    // Reassemble content with new title
    const newContent = sectionsToPrompt(newTitle, editorSections);
    updateField('content', newContent);
  };

  const handleSectionsChange = (newSections: PromptSection[]) => {
    setEditorSections(newSections);
    // Reassemble content with new sections
    const newContent = sectionsToPrompt(editorTitle, newSections);
    updateField('content', newContent);
  };

  const handleSave = () => {
    setSubmitAttempted(true);
    if (isValid) {
      onSave();
    }
  };

  return (
    <div className="h-full flex flex-col" data-guide="prompt-advanced-editor">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold">
          {isEditing ? t('roleLibrary.edit') : t('roleLibrary.new')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 mr-1" />
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Save className="h-4 w-4 mr-2" />
            {t('common.save')}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Metadata row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nickname (display name) */}
            <div className="space-y-2">
              <Label>{t('roleLibrary.nickname')} <span className="text-destructive">*</span></Label>
              <Input
                value={formData.nickname}
                onChange={(e) => updateField('nickname', e.target.value)}
                onBlur={() => markTouched('nickname')}
                placeholder={t('roleLibrary.nicknamePlaceholder')}
                className={cn(
                  shouldShowError('nickname') && errors.nickname && 'border-destructive focus-visible:ring-destructive'
                )}
              />
              {shouldShowError('nickname') && <FieldError error={errors.nickname} />}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>{t('roleLibrary.role')}</Label>
              <Select value={formData.role} onValueChange={(v) => updateField('role', v as AgentRole)}>
                <SelectTrigger>
                  <SelectValue>
                    <RoleDisplay role={formData.role} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <RoleSelectOptions />
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>{t('roleLibrary.language')}</Label>
              <Select value={formData.language} onValueChange={(v) => updateField('language', v as PromptLanguage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="auto">{t('roleLibrary.languageAuto')}</SelectItem>
                  <SelectItem value="ru">{t('roleLibrary.languageRu')}</SelectItem>
                  <SelectItem value="en">{t('roleLibrary.languageEn')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Shared switch */}
            <div className="space-y-2">
              <Label>{t('roleLibrary.isShared')}</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch
                  id="prompt-shared"
                  checked={formData.is_shared}
                  onCheckedChange={(v) => updateField('is_shared', v)}
                />
                <Label htmlFor="prompt-shared" className="cursor-pointer text-sm text-muted-foreground">
                  {formData.is_shared ? t('common.yes') : t('common.no')}
                </Label>
              </div>
            </div>
          </div>

          {/* Technical name preview */}
          {formData.nickname.trim() && (
            <p className="text-xs text-muted-foreground">
              {t('roleLibrary.technicalName')}: <code className="bg-muted px-1.5 py-0.5 rounded">{formData.name}</code>
            </p>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('roleLibrary.description')}</Label>
            <Input
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder={t('roleLibrary.descriptionPlaceholder')}
            />
          </div>

          {/* Sections Editor */}
          <div className="space-y-2">
            <Label>{t('roleLibrary.content')} <span className="text-destructive">*</span></Label>
            {shouldShowError('content') && errors.content && (
              <FieldError error={errors.content} />
            )}
             <div className={cn(
               "border rounded-lg p-4",
               shouldShowError('content') && errors.content && 'border-destructive'
             )} data-guide="prompt-sections-editor">
               <PromptSectionsEditor
                title={editorTitle}
                sections={editorSections}
                onTitleChange={handleTitleChange}
                onSectionsChange={handleSectionsChange}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
