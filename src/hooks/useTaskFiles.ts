import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { sanitizeFileName } from '@/lib/fileUtils';

export interface TaskFile {
  id: string;
  session_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

export function useTaskFiles(sessionId: string | null) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!sessionId || !user) { setFiles([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_files')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setFiles((data || []) as TaskFile[]);
    } catch (e: any) {
      console.error('Failed to fetch task files:', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = useCallback(async (file: File) => {
    if (!sessionId || !user) return;
    setUploading(true);
    try {
      const safeName = sanitizeFileName(file.name);
      const path = `${user.id}/${sessionId}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: insertData, error: insertError } = await supabase
        .from('task_files')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || null,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      await fetchFiles();
      toast.success(`Файл "${file.name}" загружен`);

      // Trigger background digest generation
      if (insertData?.id) {
        supabase.functions.invoke('digest-file', {
          body: { task_file_id: insertData.id, session_id: sessionId, language },
        }).then(() => {
          console.log(`[digest] Generated for ${file.name}`);
        }).catch(e => {
          console.warn(`[digest] Failed for ${file.name}:`, e);
        });
      }
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [sessionId, user, fetchFiles, language]);

  const deleteFile = useCallback(async (fileId: string, filePath: string) => {
    try {
      await supabase.storage.from('task-files').remove([filePath]);
      await supabase.from('task_files').delete().eq('id', fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('Файл удалён');
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  }, []);

  

  const getSignedUrl = useCallback(async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('task-files')
      .createSignedUrl(filePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  }, []);

  return { files, loading, uploading, uploadFile, deleteFile, getSignedUrl };
}
