import React, { useState } from 'react';
import { Download, FileText, FileDown, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { hydrapediaSections } from '@/content/hydrapedia';
import { useUserRoles } from '@/hooks/useUserRoles';
import jsPDF from 'jspdf';

function collectMarkdown(lang: 'ru' | 'en', isAdmin: boolean): string {
  const sections = hydrapediaSections.filter(s => !s.adminOnly || isAdmin);
  return sections.map(s => s.content[lang]).join('\n\n---\n\n');
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')        // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')     // bold
    .replace(/\*(.+?)\*/g, '$1')         // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // images
    .replace(/^\s*[-*+]\s+/gm, '• ')    // bullets
    .replace(/^\s*\d+\.\s+/gm, '')      // ordered
    .replace(/^\|.*\|$/gm, '')          // tables
    .replace(/^[-|:\s]+$/gm, '')        // table sep
    .replace(/^>\s*/gm, '')             // blockquotes
    .replace(/\n{3,}/g, '\n\n');
}

async function exportMarkdown(lang: 'ru' | 'en', isAdmin: boolean) {
  const md = collectMarkdown(lang, isAdmin);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hydrapedia_${lang}.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(lang === 'ru' ? 'Markdown скачан' : 'Markdown downloaded');
}

async function exportPDF(lang: 'ru' | 'en', isAdmin: boolean) {
  const md = collectMarkdown(lang, isAdmin);
  const plainText = stripMarkdown(md);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(20);
  doc.text('Hydrapedia', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(
    lang === 'ru' ? 'Экспорт документации' : 'Documentation Export',
    105, 28, { align: 'center' }
  );
  doc.text(new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US'), 105, 34, { align: 'center' });

  // Body — jsPDF default font doesn't support Cyrillic well.
  // We output as best-effort plain-text; for full Cyrillic fidelity the Markdown export is recommended.
  doc.setFontSize(10);
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  const lines = doc.splitTextToSize(plainText, maxWidth);

  let y = 44;
  const lineHeight = 4.5;
  const pageHeight = doc.internal.pageSize.getHeight();

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(`hydrapedia_${lang}.pdf`);
  toast.success(lang === 'ru' ? 'PDF скачан' : 'PDF downloaded');
}

export function HydrapediaExport() {
  const { isAdmin } = useUserRoles();
  const [busy, setBusy] = useState(false);

  const handle = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          className="hidden sm:flex items-center gap-2 text-primary border-primary/50 hover:bg-primary/10 hover:border-primary"
        >
          <Download className="h-4 w-4" />
          <span className="text-xs">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <FileDown className="h-3.5 w-3.5" /> Markdown (.md)
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handle(() => exportMarkdown('ru', isAdmin))}>
          <Languages className="h-4 w-4 mr-2" /> Русский
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle(() => exportMarkdown('en', isAdmin))}>
          <Languages className="h-4 w-4 mr-2" /> English
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <FileText className="h-3.5 w-3.5" /> PDF
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handle(() => exportPDF('ru', isAdmin))}>
          <Languages className="h-4 w-4 mr-2" /> Русский
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle(() => exportPDF('en', isAdmin))}>
          <Languages className="h-4 w-4 mr-2" /> English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
