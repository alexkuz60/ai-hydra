import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeBypassWrapper } from './NodeBypassWrapper';

interface TranslateNodeProps {
  data: {
    label?: string;
    translateDirection?: 'ru-en' | 'en-ru';
    verifySemantic?: boolean;
    bypassed?: boolean;
  };
  selected?: boolean;
}

export const TranslateNode = memo(({ data, selected }: TranslateNodeProps) => {
  const direction = data.translateDirection || 'ru-en';
  const dirLabel = direction === 'ru-en' ? 'RU → EN' : 'EN → RU';

  return (
    <NodeBypassWrapper bypassed={data.bypassed}>
      <div className={cn(
        "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
        "bg-hydra-translator/10 border-hydra-translator",
        selected && "ring-2 ring-hydra-translator ring-offset-2 ring-offset-background"
      )}>
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-hydra-translator !border-2 !border-background"
        />
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-hydra-translator/20">
            <Languages className="h-4 w-4 text-hydra-translator" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label || 'Перевод'}</div>
            <div className="text-xs text-muted-foreground">{dirLabel}</div>
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-hydra-translator !border-2 !border-background"
        />
      </div>
    </NodeBypassWrapper>
  );
});

TranslateNode.displayName = 'TranslateNode';
