import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FileDigest {
  id: string;
  task_file_id: string;
  session_id: string;
  digest: string;
  digest_type: string;
  source_file_name: string | null;
  source_mime_type: string | null;
  token_estimate: number;
  created_at: string;
}

export function useFileDigests(sessionId: string | null) {
  const { user } = useAuth();
  const [digests, setDigests] = useState<FileDigest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDigests = useCallback(async () => {
    if (!sessionId || !user) { setDigests([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('file_digests')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setDigests((data || []) as FileDigest[]);
    } catch (e) {
      console.error('Failed to fetch file digests:', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user]);

  useEffect(() => { fetchDigests(); }, [fetchDigests]);

  /** Get combined digest text for pipeline context */
  const getCombinedDigest = useCallback((): string => {
    if (digests.length === 0) return '';
    return digests
      .map(d => `### ${d.source_file_name || 'Файл'} (${d.digest_type})\n${d.digest}`)
      .join('\n\n');
  }, [digests]);

  /** Trigger digest generation for a specific file */
  const generateDigest = useCallback(async (taskFileId: string, language: string = 'ru') => {
    if (!sessionId) return;
    try {
      const { data, error } = await supabase.functions.invoke('digest-file', {
        body: { task_file_id: taskFileId, session_id: sessionId, language },
      });
      if (error) throw error;
      await fetchDigests();
      return data;
    } catch (e) {
      console.error('Failed to generate digest:', e);
      throw e;
    }
  }, [sessionId, fetchDigests]);

  return { digests, loading, fetchDigests, getCombinedDigest, generateDigest };
}
