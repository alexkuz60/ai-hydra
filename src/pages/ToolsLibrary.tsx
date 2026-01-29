import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Search, 
  Pencil, 
  Users, 
  Wrench,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type OwnerFilter = 'all' | 'own' | 'shared';

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
  [key: string]: unknown; // Allow index signature for Json compatibility
}

interface CustomTool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt_template: string;
  parameters: ToolParameter[];
  is_shared: boolean;
  usage_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const PARAM_TYPES = [
  { value: 'string', label: 'Текст' },
  { value: 'number', label: 'Число' },
  { value: 'boolean', label: 'Да/Нет' },
];

export default function ToolsLibrary() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Data state
  const [tools, setTools] = useState<CustomTool[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');

  // Create form
  const [createSheet, setCreateSheet] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPromptTemplate, setNewPromptTemplate] = useState('');
  const [newParameters, setNewParameters] = useState<ToolParameter[]>([]);
  const [newIsShared, setNewIsShared] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit sheet
  const [editSheet, setEditSheet] = useState(false);
  const [editingTool, setEditingTool] = useState<CustomTool | null>(null);
  const [editName, setEditName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPromptTemplate, setEditPromptTemplate] = useState('');
  const [editParameters, setEditParameters] = useState<ToolParameter[]>([]);
  const [editIsShared, setEditIsShared] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Delete dialog
  const [toolToDelete, setToolToDelete] = useState<CustomTool | null>(null);

  // Params section expanded
  const [paramsExpanded, setParamsExpanded] = useState(false);
  const [editParamsExpanded, setEditParamsExpanded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchTools();
    }
  }, [user, authLoading, navigate]);

  const fetchTools = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('custom_tools')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Parse parameters from JSON - cast through unknown for type safety
      const parsed = (data || []).map(tool => ({
        ...tool,
        parameters: (Array.isArray(tool.parameters) ? tool.parameters : []) as ToolParameter[]
      }));
      
      setTools(parsed as CustomTool[]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateName = (name: string): string => {
    // Convert to snake_case, remove special chars
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleCreate = async () => {
    if (!user || !newName.trim() || !newDisplayName.trim() || !newDescription.trim() || !newPromptTemplate.trim()) return;
    
    const validatedName = validateName(newName);
    if (!validatedName) {
      toast.error('Имя инструмента должно содержать латинские буквы');
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase
        .from('custom_tools')
        .insert([{
          user_id: user.id,
          name: validatedName,
          display_name: newDisplayName.trim(),
          description: newDescription.trim(),
          prompt_template: newPromptTemplate.trim(),
          parameters: JSON.parse(JSON.stringify(newParameters)),
          is_shared: newIsShared,
        }])
        .select()
        .single();

      if (error) throw error;

      const parsed = {
        ...data,
        parameters: Array.isArray(data.parameters) ? data.parameters : []
      } as CustomTool;

      setTools([parsed, ...tools]);
      resetCreateForm();
      setCreateSheet(false);
      toast.success('Инструмент создан');
    } catch (error: any) {
      if (error.message.includes('unique')) {
        toast.error('Инструмент с таким именем уже существует');
      } else {
        toast.error(error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewName('');
    setNewDisplayName('');
    setNewDescription('');
    setNewPromptTemplate('');
    setNewParameters([]);
    setNewIsShared(false);
    setParamsExpanded(false);
  };

  const openEditSheet = (tool: CustomTool) => {
    setEditingTool(tool);
    setEditName(tool.name);
    setEditDisplayName(tool.display_name);
    setEditDescription(tool.description);
    setEditPromptTemplate(tool.prompt_template);
    setEditParameters([...tool.parameters]);
    setEditIsShared(tool.is_shared);
    setEditParamsExpanded(tool.parameters.length > 0);
    setEditSheet(true);
  };

  const handleUpdate = async () => {
    if (!editingTool || !editName.trim() || !editDisplayName.trim() || !editDescription.trim() || !editPromptTemplate.trim()) return;
    
    const validatedName = validateName(editName);
    if (!validatedName) {
      toast.error('Имя инструмента должно содержать латинские буквы');
      return;
    }

    setUpdating(true);

    try {
      const { error } = await supabase
        .from('custom_tools')
        .update({
          name: validatedName,
          display_name: editDisplayName.trim(),
          description: editDescription.trim(),
          prompt_template: editPromptTemplate.trim(),
          parameters: JSON.parse(JSON.stringify(editParameters)),
          is_shared: editIsShared,
        })
        .eq('id', editingTool.id);

      if (error) throw error;

      setTools(tools.map(t => 
        t.id === editingTool.id 
          ? { 
              ...t, 
              name: validatedName,
              display_name: editDisplayName.trim(),
              description: editDescription.trim(),
              prompt_template: editPromptTemplate.trim(),
              parameters: editParameters,
              is_shared: editIsShared,
              updated_at: new Date().toISOString()
            } 
          : t
      ));
      
      setEditSheet(false);
      setEditingTool(null);
      toast.success('Инструмент обновлён');
    } catch (error: any) {
      if (error.message.includes('unique')) {
        toast.error('Инструмент с таким именем уже существует');
      } else {
        toast.error(error.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!toolToDelete) return;

    try {
      const { error } = await supabase
        .from('custom_tools')
        .delete()
        .eq('id', toolToDelete.id);

      if (error) throw error;

      setTools(tools.filter(t => t.id !== toolToDelete.id));
      toast.success('Инструмент удалён');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setToolToDelete(null);
    }
  };

  // Parameter management
  const addParameter = (isEdit: boolean) => {
    const newParam: ToolParameter = {
      name: '',
      type: 'string',
      description: '',
      required: false,
    };
    if (isEdit) {
      setEditParameters([...editParameters, newParam]);
    } else {
      setNewParameters([...newParameters, newParam]);
    }
  };

  const updateParameter = (index: number, field: keyof ToolParameter, value: any, isEdit: boolean) => {
    if (isEdit) {
      const updated = [...editParameters];
      updated[index] = { ...updated[index], [field]: value };
      setEditParameters(updated);
    } else {
      const updated = [...newParameters];
      updated[index] = { ...updated[index], [field]: value };
      setNewParameters(updated);
    }
  };

  const removeParameter = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditParameters(editParameters.filter((_, i) => i !== index));
    } else {
      setNewParameters(newParameters.filter((_, i) => i !== index));
    }
  };

  // Filter tools
  const filteredTools = tools.filter(tool => {
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesOwner = 
      ownerFilter === 'all' ||
      (ownerFilter === 'own' && tool.user_id === user?.id) ||
      (ownerFilter === 'shared' && tool.is_shared);
    
    return matchesSearch && matchesOwner;
  });

  // Render parameter editor
  const renderParameterEditor = (params: ToolParameter[], isEdit: boolean) => (
    <div className="space-y-3">
      {params.map((param, index) => (
        <div key={index} className="flex gap-2 items-start p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Input
                value={param.name}
                onChange={(e) => updateParameter(index, 'name', validateName(e.target.value), isEdit)}
                placeholder="param_name"
                className="flex-1 font-mono text-sm"
              />
              <Select 
                value={param.type} 
                onValueChange={(v) => updateParameter(index, 'type', v, isEdit)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  {PARAM_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              value={param.description}
              onChange={(e) => updateParameter(index, 'description', e.target.value, isEdit)}
              placeholder="Описание параметра"
              className="text-sm"
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={param.required}
                onCheckedChange={(v) => updateParameter(index, 'required', v, isEdit)}
                id={`req-${index}`}
              />
              <Label htmlFor={`req-${index}`} className="text-xs cursor-pointer">
                Обязательный
              </Label>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeParameter(index, isEdit)}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addParameter(isEdit)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Добавить параметр
      </Button>
    </div>
  );

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Библиотека инструментов</h1>
          <Button onClick={() => setCreateSheet(true)} className="hydra-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск инструментов..."
              className="pl-9"
            />
          </div>

          <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v as OwnerFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="own">Мои</SelectItem>
              <SelectItem value="shared">Общие</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tools List */}
        <div className="space-y-4">
          {filteredTools.length === 0 ? (
            <HydraCard variant="glass" className="p-8 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {tools.length === 0 ? 'Нет созданных инструментов' : 'Ничего не найдено'}
              </p>
            </HydraCard>
          ) : (
            filteredTools.map((tool) => (
              <HydraCard 
                key={tool.id} 
                variant="glass" 
                glow 
                className="p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Wrench className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-medium">{tool.display_name}</h3>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                        {tool.name}
                      </code>
                      {tool.is_shared && (
                        <span title="Общий доступ">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                    
                    {/* Parameters */}
                    {tool.parameters.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tool.parameters.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-mono">
                            {p.name}: {p.type}
                            {p.required && <span className="text-destructive ml-0.5">*</span>}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span>Использований: {tool.usage_count}</span>
                      <span>{format(new Date(tool.updated_at), 'dd.MM.yyyy')}</span>
                    </div>
                  </div>
                  
                  {/* Actions (only for own tools) */}
                  {tool.user_id === user?.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditSheet(tool)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setToolToDelete(tool)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </HydraCard>
            ))
          )}
        </div>

        {/* Create Sheet */}
        <Sheet open={createSheet} onOpenChange={(open) => { setCreateSheet(open); if (!open) resetCreateForm(); }}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Создать инструмент</SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label>Название <span className="text-destructive">*</span></Label>
                  <Input
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Генератор отчётов"
                  />
                </div>

                {/* Technical Name */}
                <div className="space-y-2">
                  <Label>Техническое имя <span className="text-destructive">*</span></Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="report_generator"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Латинские буквы, цифры и подчёркивания
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Описание для модели <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Генерирует отчёт на основе предоставленных данных"
                    className="min-h-[80px]"
                  />
                </div>

                {/* Prompt Template */}
                <div className="space-y-2">
                  <Label>Шаблон промпта <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={newPromptTemplate}
                    onChange={(e) => setNewPromptTemplate(e.target.value)}
                    placeholder="Создай отчёт на тему: {{topic}}&#10;Формат: {{format}}"
                    className="min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Используйте {"{{param_name}}"} для подстановки параметров
                  </p>
                </div>

                {/* Parameters */}
                <Collapsible open={paramsExpanded} onOpenChange={setParamsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto font-medium">
                      Параметры ({newParameters.length})
                      {paramsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    {renderParameterEditor(newParameters, false)}
                  </CollapsibleContent>
                </Collapsible>

                {/* Shared toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="new-shared"
                    checked={newIsShared}
                    onCheckedChange={setNewIsShared}
                  />
                  <Label htmlFor="new-shared" className="cursor-pointer">
                    Общий доступ
                  </Label>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="p-4 border-t">
              <Button
                onClick={handleCreate}
                disabled={creating || !newName.trim() || !newDisplayName.trim() || !newDescription.trim() || !newPromptTemplate.trim()}
                className="w-full"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Создать инструмент
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Edit Sheet */}
        <Sheet open={editSheet} onOpenChange={setEditSheet}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Редактировать инструмент</SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label>Название <span className="text-destructive">*</span></Label>
                  <Input
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Генератор отчётов"
                  />
                </div>

                {/* Technical Name */}
                <div className="space-y-2">
                  <Label>Техническое имя <span className="text-destructive">*</span></Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="report_generator"
                    className="font-mono"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Описание для модели <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Генерирует отчёт на основе предоставленных данных"
                    className="min-h-[80px]"
                  />
                </div>

                {/* Prompt Template */}
                <div className="space-y-2">
                  <Label>Шаблон промпта <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={editPromptTemplate}
                    onChange={(e) => setEditPromptTemplate(e.target.value)}
                    placeholder="Создай отчёт на тему: {{topic}}"
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>

                {/* Parameters */}
                <Collapsible open={editParamsExpanded} onOpenChange={setEditParamsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto font-medium">
                      Параметры ({editParameters.length})
                      {editParamsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    {renderParameterEditor(editParameters, true)}
                  </CollapsibleContent>
                </Collapsible>

                {/* Shared toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="edit-shared"
                    checked={editIsShared}
                    onCheckedChange={setEditIsShared}
                  />
                  <Label htmlFor="edit-shared" className="cursor-pointer">
                    Общий доступ
                  </Label>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="p-4 border-t">
              <Button
                onClick={handleUpdate}
                disabled={updating || !editName.trim() || !editDisplayName.trim() || !editDescription.trim() || !editPromptTemplate.trim()}
                className="w-full"
              >
                {updating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Сохранить
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Delete Dialog */}
        <AlertDialog open={!!toolToDelete} onOpenChange={() => setToolToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить инструмент?</AlertDialogTitle>
              <AlertDialogDescription>
                Инструмент "{toolToDelete?.display_name}" будет удалён безвозвратно.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
