import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Minus, Save, XCircle, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

/* ── Markdown ↔ Table Data ── */

export interface TableData {
  headers: string[];
  rows: string[][];
}

/** Detect if text contains a markdown table */
export function containsMarkdownTable(text: string): boolean {
  if (!text) return false;
  const lines = text.trim().split('\n');
  // Need at least header + separator + 1 row
  if (lines.length < 3) return false;
  return lines[0].includes('|') && /^\|?\s*[-:]+/.test(lines[1]);
}

/** Split body into { before, table, after } parts */
export function splitBodyAroundTable(body: string): {
  before: string;
  tableMarkdown: string;
  after: string;
} {
  const lines = body.split('\n');
  let tableStart = -1;
  let tableEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (tableStart === -1) {
      // Look for first table row (header)
      if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1].trim())) {
        tableStart = i;
      }
    } else {
      // Inside table — stop when line doesn't contain pipe
      if (!line.includes('|') || line === '') {
        tableEnd = i;
        break;
      }
    }
  }

  if (tableStart === -1) return { before: body, tableMarkdown: '', after: '' };
  if (tableEnd === -1) tableEnd = lines.length;

  return {
    before: lines.slice(0, tableStart).join('\n'),
    tableMarkdown: lines.slice(tableStart, tableEnd).join('\n'),
    after: lines.slice(tableEnd).join('\n'),
  };
}

/** Parse markdown table string into TableData */
export function parseMarkdownTable(md: string): TableData | null {
  const lines = md.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;

  const parseLine = (line: string): string[] =>
    line.split('|').map(c => c.trim()).filter((_, i, arr) => {
      // Remove empty first/last from leading/trailing pipes
      if (i === 0 && !arr[0]) return false;
      if (i === arr.length - 1 && !arr[arr.length - 1]) return false;
      return true;
    });

  const headers = parseLine(lines[0]);
  // Skip separator line (lines[1])
  const rows = lines.slice(2).map(parseLine);

  // Normalize column count
  const colCount = headers.length;
  const normalizedRows = rows.map(row => {
    if (row.length < colCount) return [...row, ...Array(colCount - row.length).fill('')];
    if (row.length > colCount) return row.slice(0, colCount);
    return row;
  });

  return { headers, rows: normalizedRows };
}

/** Serialize TableData back to markdown */
export function serializeMarkdownTable(data: TableData): string {
  const { headers, rows } = data;
  if (headers.length === 0) return '';

  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const rowMax = rows.reduce((max, row) => Math.max(max, (row[i] || '').length), 0);
    return Math.max(h.length, rowMax, 3);
  });

  const pad = (text: string, width: number) => text.padEnd(width);

  const headerLine = '| ' + headers.map((h, i) => pad(h, colWidths[i])).join(' | ') + ' |';
  const sepLine = '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |';
  const rowLines = rows.map(
    row => '| ' + row.map((c, i) => pad(c || '', colWidths[i])).join(' | ') + ' |'
  );

  return [headerLine, sepLine, ...rowLines].join('\n');
}

/* ── Visual Table Editor ── */

interface MarkdownTableEditorProps {
  tableData: TableData;
  onSave: (data: TableData) => void;
  onCancel: () => void;
}

export function MarkdownTableEditor({ tableData, onSave, onCancel }: MarkdownTableEditorProps) {
  const { language } = useLanguage();
  const [data, setData] = useState<TableData>(() => ({
    headers: [...tableData.headers],
    rows: tableData.rows.map(r => [...r]),
  }));

  const updateHeader = useCallback((colIdx: number, value: string) => {
    setData(prev => ({
      ...prev,
      headers: prev.headers.map((h, i) => i === colIdx ? value : h),
    }));
  }, []);

  const updateCell = useCallback((rowIdx: number, colIdx: number, value: string) => {
    setData(prev => ({
      ...prev,
      rows: prev.rows.map((row, ri) =>
        ri === rowIdx ? row.map((c, ci) => ci === colIdx ? value : c) : row
      ),
    }));
  }, []);

  const addRow = useCallback(() => {
    setData(prev => ({
      ...prev,
      rows: [...prev.rows, Array(prev.headers.length).fill('')],
    }));
  }, []);

  const removeRow = useCallback((rowIdx: number) => {
    setData(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== rowIdx),
    }));
  }, []);

  const addColumn = useCallback(() => {
    setData(prev => ({
      headers: [...prev.headers, language === 'ru' ? 'Столбец' : 'Column'],
      rows: prev.rows.map(row => [...row, '']),
    }));
  }, [language]);

  const removeColumn = useCallback((colIdx: number) => {
    if (data.headers.length <= 1) return;
    setData(prev => ({
      headers: prev.headers.filter((_, i) => i !== colIdx),
      rows: prev.rows.map(row => row.filter((_, i) => i !== colIdx)),
    }));
  }, [data.headers.length]);

  return (
    <div className="space-y-2 mt-2" onClick={e => e.stopPropagation()}>
      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {data.headers.map((header, colIdx) => (
                <TableHead key={colIdx} className="p-1 min-w-[100px]">
                  <div className="flex items-center gap-0.5">
                    <Input
                      value={header}
                      onChange={(e) => updateHeader(colIdx, e.target.value)}
                      className="h-7 text-xs font-semibold border-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 px-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 opacity-40 hover:opacity-100 hover:text-destructive"
                      onClick={() => removeColumn(colIdx)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="p-1 w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIdx) => (
              <TableRow key={rowIdx} className="hover:bg-muted/20">
                {row.map((cell, colIdx) => (
                  <TableCell key={colIdx} className="p-1">
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      className="h-7 text-xs border-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 px-1"
                    />
                  </TableCell>
                ))}
                <TableCell className="p-1 w-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-40 hover:opacity-100 hover:text-destructive"
                    onClick={() => removeRow(rowIdx)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Row/Column add buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={addRow}>
          <Plus className="h-3 w-3" />
          {language === 'ru' ? 'Строка' : 'Row'}
        </Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={addColumn}>
          <Plus className="h-3 w-3" />
          {language === 'ru' ? 'Столбец' : 'Column'}
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-emerald-500" onClick={() => onSave(data)}>
          <Save className="h-3 w-3" />{language === 'ru' ? 'Сохранить' : 'Save'}
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={onCancel}>
          <XCircle className="h-3 w-3" />{language === 'ru' ? 'Отмена' : 'Cancel'}
        </Button>
      </div>
    </div>
  );
}
