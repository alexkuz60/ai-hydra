import React from 'react';
import { Edge } from '@xyflow/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Trash2, Link2 } from 'lucide-react';
import {
  FlowEdgeData,
  EdgeLineType,
  FlowDataType,
  EDGE_LINE_OPTIONS,
  DATA_TYPE_OPTIONS,
  FLOW_DATA_COLORS,
} from '@/types/edgeTypes';

interface EdgePropertiesPanelProps {
  selectedEdge: Edge;
  onClose: () => void;
  onUpdateEdge: (edgeId: string, data: FlowEdgeData) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export function EdgePropertiesPanel({
  selectedEdge,
  onClose,
  onUpdateEdge,
  onDeleteEdge,
}: EdgePropertiesPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const edgeData: FlowEdgeData = selectedEdge.data || {};

  const handleDataChange = (updates: Partial<FlowEdgeData>) => {
    onUpdateEdge(selectedEdge.id, { ...edgeData, ...updates });
  };

  const handleDelete = () => {
    onDeleteEdge(selectedEdge.id);
    onClose();
  };

  return (
    <div className="w-72 bg-card border-l border-border p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">
            {isRu ? 'Свойства связи' : 'Edge Properties'}
          </h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Edge Info */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
        <div>{isRu ? 'Источник' : 'Source'}: <span className="text-foreground">{selectedEdge.source}</span></div>
        <div>{isRu ? 'Цель' : 'Target'}: <span className="text-foreground">{selectedEdge.target}</span></div>
      </div>

      {/* Label */}
      <div className="space-y-2">
        <Label className="text-xs">{isRu ? 'Подпись' : 'Label'}</Label>
        <Input
          value={edgeData.label || ''}
          onChange={(e) => handleDataChange({ label: e.target.value })}
          placeholder={isRu ? 'Добавить подпись...' : 'Add label...'}
          className="h-8 text-sm"
        />
      </div>

      {/* Line Type */}
      <div className="space-y-2">
        <Label className="text-xs">{isRu ? 'Тип линии' : 'Line Type'}</Label>
        <Select
          value={edgeData.lineType || 'smoothstep'}
          onValueChange={(value) => handleDataChange({ lineType: value as EdgeLineType })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDGE_LINE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {isRu ? option.labelRu : option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Type */}
      <div className="space-y-2">
        <Label className="text-xs">{isRu ? 'Тип данных' : 'Data Type'}</Label>
        <Select
          value={edgeData.dataType || 'any'}
          onValueChange={(value) => handleDataChange({ dataType: value as FlowDataType })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATA_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: `hsl(${FLOW_DATA_COLORS[option.value]})` }}
                  />
                  {isRu ? option.labelRu : option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{isRu ? 'Толщина' : 'Stroke Width'}</Label>
          <span className="text-xs text-muted-foreground">{edgeData.strokeWidth || 2}px</span>
        </div>
        <Slider
          value={[edgeData.strokeWidth || 2]}
          onValueChange={([value]) => handleDataChange({ strokeWidth: value })}
          min={1}
          max={6}
          step={1}
          className="w-full"
        />
      </div>

      {/* Animation Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">{isRu ? 'Анимация' : 'Animation'}</Label>
        <Switch
          checked={edgeData.animated ?? true}
          onCheckedChange={(checked) => handleDataChange({ animated: checked })}
        />
      </div>

      {/* Delete Button */}
      <div className="mt-auto pt-4 border-t border-border">
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          {isRu ? 'Удалить связь' : 'Delete Edge'}
        </Button>
      </div>
    </div>
  );
}
