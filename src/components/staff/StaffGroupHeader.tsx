import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffGroupHeaderProps {
  expanded: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  guideId: string;
  nested?: boolean;
  actions?: React.ReactNode;
  selected?: boolean;
}

export function StaffGroupHeader({
  expanded, onToggle, icon, label, count, guideId, nested, actions, selected,
}: StaffGroupHeaderProps) {
  return (
    <TableRow
      className={cn("hover:bg-muted/40 cursor-pointer", nested ? "bg-muted/15" : "bg-muted/30", selected && "bg-primary/10 hover:bg-primary/15")}
      onClick={onToggle}
      data-guide={guideId}
    >
      <TableCell colSpan={2} className="py-2">
        <div className={cn("flex items-center gap-2 text-sm font-medium text-muted-foreground", nested && "pl-4")}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {icon}
          <span className="flex-1 truncate">{label}</span>
          {actions}
          <Badge variant="outline" className="text-xs">{count}</Badge>
        </div>
      </TableCell>
    </TableRow>
  );
}
