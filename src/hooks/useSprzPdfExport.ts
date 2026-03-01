import { useCallback, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SprzPdfDocument, type SprzPdfData, type PdfTheme } from '@/lib/sprzPdfTemplate';
import { normalizeTypeIds } from '@/lib/sprzTaxonomy';

interface UseSprzPdfExportOptions {
  planId: string;
  lang: 'ru' | 'en';
}

export function useSprzPdfExport({ planId, lang }: UseSprzPdfExportOptions) {
  const [generating, setGenerating] = useState(false);

  const exportPdf = useCallback(async (theme: PdfTheme = 'dark') => {
    if (generating) return;
    setGenerating(true);

    try {
      // 1. Fetch plan
      const { data: plan, error: planError } = await supabase
        .from('strategic_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) throw new Error('Plan not found');

      const meta = (plan.metadata as Record<string, any>) || {};

      // 2. Fetch sessions for this plan
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, title, title_en, description, description_en, updated_at')
        .eq('plan_id', planId)
        .order('sort_order');

      // 3. Fetch conclusions
      const { data: conclusions } = await supabase
        .from('plan_conclusions')
        .select('content, content_en, is_pinned, created_at')
        .eq('session_id', planId)
        .order('created_at', { ascending: false })
        .limit(20);

      // 4. Fetch concept responses (vision, patent) from concept session
      let visionContent: string | undefined;
      let patentContent: string | undefined;

      const { data: conceptSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('plan_id', planId)
        .or('title.ilike.%цели и концепция%,title.ilike.%goals and concept%')
        .limit(1)
        .maybeSingle();

      if (conceptSession) {
        const { data: conceptMsgs } = await supabase
          .from('messages')
          .select('content, content_en, metadata, role')
          .eq('session_id', conceptSession.id)
          .neq('role', 'user')
          .order('created_at', { ascending: false })
          .limit(50);

        if (conceptMsgs) {
          const isRuLocal = lang === 'ru';
          const visionMsg = conceptMsgs.find((m: any) => (m.metadata as any)?.concept_type === 'visionary');
          const patentMsg = conceptMsgs.find((m: any) => (m.metadata as any)?.concept_type === 'patent');
          if (visionMsg) visionContent = (isRuLocal ? visionMsg.content : visionMsg.content_en) || visionMsg.content;
          if (patentMsg) patentContent = (isRuLocal ? patentMsg.content : patentMsg.content_en) || patentMsg.content;
        }
      }

      // Build sections from metadata
      const approvalSections = (meta.approvalSections || []).map((sec: any) => ({
        title: sec.title || '',
        body: sec.body || '',
        status: sec.status || 'pending',
        source: sec.source || 'strategist',
        children: (sec.children || []).map((c: any) => ({
          title: c.title || '',
          body: c.body || '',
          status: c.status || 'pending',
        })),
      }));

      const isRu = lang === 'ru';
      const pdfData: SprzPdfData = {
        title: (isRu ? plan.title : plan.title_en) || plan.title,
        goal: (isRu ? plan.goal : plan.goal_en) || plan.goal || '',
        progress: plan.progress || 0,
        status: plan.status,
        typeIds: normalizeTypeIds(meta.sprzType),
        subtypeIds: Array.isArray(meta.sprzSubtype) ? meta.sprzSubtype : [],
        createdAt: plan.created_at,
        lang,
        theme,
        visionContent,
        approvalSections,
        patentContent,
        sessions: (sessions || []).map(s => ({
          title: (isRu ? s.title : s.title_en) || s.title,
          description: (isRu ? s.description : s.description_en) || s.description || undefined,
          updatedAt: new Date(s.updated_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US'),
        })),
        conclusions: (conclusions || []).map(c => ({
          content: (isRu ? c.content : c.content_en) || c.content,
          isPinned: c.is_pinned,
          createdAt: new Date(c.created_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US'),
        })),
      };

      // 4. Generate PDF blob
      const blob = await pdf(
        React.createElement(SprzPdfDocument, { data: pdfData }) as any
      ).toBlob();

      // 5. Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SPRS_${plan.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(isRu ? 'PDF-презентация скачана' : 'PDF presentation downloaded');
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error(lang === 'ru' ? 'Ошибка генерации PDF' : 'PDF generation error');
    } finally {
      setGenerating(false);
    }
  }, [planId, lang, generating]);

  return { exportPdf, generating };
}
