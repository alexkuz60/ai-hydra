import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export type DeletionMode = 'clean' | 'keep';

interface UseTaskDeletionProps {
  userId: string | undefined;
  onTaskDeleted: (taskId: string) => void;
}

export function useTaskDeletion({ userId, onTaskDeleted }: UseTaskDeletionProps) {
  const { t } = useLanguage();
  const [deleting, setDeleting] = useState(false);

  /**
   * Delete a single task with optional memory cleanup.
   * 'clean' = remove session_memory, role_memory, model_statistics, task_files + storage
   * 'keep'  = remove only messages, task_files + storage, session itself
   */
  const deleteTask = useCallback(async (sessionId: string, mode: DeletionMode) => {
    if (!userId) return;
    setDeleting(true);

    try {
      // 1. Delete files from storage
      const { data: files } = await supabase
        .from('task_files')
        .select('id, file_path')
        .eq('session_id', sessionId);

      if (files && files.length > 0) {
        const paths = files.map(f => f.file_path);
        const fileIds = files.map(f => f.id);
        await supabase.storage.from('task-files').remove(paths);
        // Delete file digests first (FK dependency)
        await supabase.from('file_digests').delete().in('task_file_id', fileIds);
        await supabase.from('task_files').delete().eq('session_id', sessionId);
      }

      if (mode === 'clean') {
        // 2. Delete session_memory (RAG segments)
        await supabase.from('session_memory').delete().eq('session_id', sessionId);

        // 3. Delete role_memory linked to this session
        await supabase.from('role_memory').delete().eq('source_session_id', sessionId);

        // 4. Delete model_statistics for this session
        await supabase.from('model_statistics').delete().eq('session_id', sessionId);
      }

      // 5. Delete all messages
      await supabase.from('messages').delete().eq('session_id', sessionId);

      // 6. Delete the session itself
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) throw error;

      onTaskDeleted(sessionId);
      toast.success(
        mode === 'clean'
          ? t('tasks.deletedWithCleanup')
          : t('tasks.deletedKeepMemory')
      );
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  }, [userId, onTaskDeleted, t]);

  /**
   * Bulk delete all tasks for the user with full cleanup.
   */
  const deleteAllTasks = useCallback(async () => {
    if (!userId) return;
    setDeleting(true);

    try {
      // Get all user sessions (excluding system tasks)
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_system', false);

      if (!sessions || sessions.length === 0) {
        toast.info(t('tasks.empty'));
        setDeleting(false);
        return;
      }

      const sessionIds = sessions.map(s => s.id);

      // 1. Delete all task files from storage
      const { data: allFiles } = await supabase
        .from('task_files')
        .select('id, file_path')
        .in('session_id', sessionIds);

      if (allFiles && allFiles.length > 0) {
        const paths = allFiles.map(f => f.file_path);
        const fileIds = allFiles.map(f => f.id);
        // Storage remove has a limit, batch by 100
        for (let i = 0; i < paths.length; i += 100) {
          await supabase.storage.from('task-files').remove(paths.slice(i, i + 100));
        }
        // Delete file digests first (FK dependency)
        for (let i = 0; i < fileIds.length; i += 50) {
          await supabase.from('file_digests').delete().in('task_file_id', fileIds.slice(i, i + 50));
        }
        for (let i = 0; i < sessionIds.length; i += 50) {
          await supabase.from('task_files').delete().in('session_id', sessionIds.slice(i, i + 50));
        }
      }

      // 2. Clean session_memory
      for (let i = 0; i < sessionIds.length; i += 50) {
        await supabase.from('session_memory').delete().in('session_id', sessionIds.slice(i, i + 50));
      }

      // 3. Clean role_memory
      for (let i = 0; i < sessionIds.length; i += 50) {
        await supabase.from('role_memory').delete().in('source_session_id', sessionIds.slice(i, i + 50));
      }

      // 4. Clean model_statistics
      for (let i = 0; i < sessionIds.length; i += 50) {
        await supabase.from('model_statistics').delete().in('session_id', sessionIds.slice(i, i + 50));
      }

      // 5. Delete all messages
      for (let i = 0; i < sessionIds.length; i += 50) {
        await supabase.from('messages').delete().in('session_id', sessionIds.slice(i, i + 50));
      }

      // 6. Delete all sessions
      await supabase.from('sessions').delete().eq('user_id', userId).eq('is_system', false);

      onTaskDeleted('__all__');
      toast.success(t('tasks.allDeleted'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  }, [userId, onTaskDeleted, t]);

  return { deleteTask, deleteAllTasks, deleting };
}
