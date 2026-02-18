import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Message, MessageMetadata } from '@/types/messages';
import type { Json } from '@/integrations/supabase/types';
import type { Proposal } from '@/types/patterns';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseMessagesProps {
  sessionId: string | null;
  onBeforeDeleteMessage?: (messageId: string) => Promise<void>;
  onAIMessageReceived?: (message: Message) => void;
}

interface UseMessagesReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  displayedMessages: Message[];
  filteredParticipant: string | null;
  setFilteredParticipant: React.Dispatch<React.SetStateAction<string | null>>;
  activeParticipant: string | null;
  setActiveParticipant: React.Dispatch<React.SetStateAction<string | null>>;
  handleDeleteMessage: (messageId: string) => Promise<void>;
  handleDeleteMessageGroup: (userMessageId: string) => Promise<void>;
  handleRatingChange: (messageId: string, rating: number) => Promise<void>;
  handleLikertRate: (messageId: string, value: number) => Promise<void>;
  handleUpdateProposals: (messageId: string, proposals: Proposal[]) => Promise<void>;
  handleChecklistChange: (messageId: string, checklistState: Record<number, boolean>) => Promise<void>;
  fetchMessages: (taskId: string) => Promise<void>;
}

export function useMessages({ sessionId, onBeforeDeleteMessage }: UseMessagesProps): UseMessagesReturn {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredParticipant, setFilteredParticipant] = useState<string | null>(null);
  const [activeParticipant, setActiveParticipant] = useState<string | null>(null);

  // Fetch messages for a session
  const fetchMessages = useCallback(async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!sessionId) return;

    // Fetch initial messages
    fetchMessages(sessionId);

    const channel = supabase
      .channel(`messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Insert message in correct position based on created_at
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(m => m.id === newMessage.id)) return prev;
            
            // Find correct insertion position based on created_at
            const newTimestamp = new Date(newMessage.created_at).getTime();
            const insertIndex = prev.findIndex(m => 
              new Date(m.created_at).getTime() > newTimestamp
            );
            
            if (insertIndex === -1) {
              // Add to end
              return [...prev, newMessage];
            } else {
              // Insert at correct position
              const newArray = [...prev];
              newArray.splice(insertIndex, 0, newMessage);
              return newArray;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchMessages]);

  // Delete a single message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      // Clean up related memory chunks before deleting the message
      if (onBeforeDeleteMessage) {
        try {
          await onBeforeDeleteMessage(messageId);
        } catch (memoryError) {
          // Log but don't block message deletion
          console.warn('[Messages] Failed to clean up memory for message:', messageId, memoryError);
        }
      }
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(msgs => msgs.filter(m => m.id !== messageId));
      toast.success(t('messages.deleted'));
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [t, onBeforeDeleteMessage]);

  // Delete a user message and all AI responses until the next user message
  const handleDeleteMessageGroup = useCallback(async (userMessageId: string) => {
    const userMsgIndex = messages.findIndex(m => m.id === userMessageId);
    if (userMsgIndex === -1 || messages[userMsgIndex].role !== 'user') return;

    // Find all messages to delete: user message + subsequent AI responses
    const idsToDelete: string[] = [userMessageId];
    for (let i = userMsgIndex + 1; i < messages.length; i++) {
      if (messages[i].role === 'user') break;
      idsToDelete.push(messages[i].id);
    }

    try {
      // Clean up related memory chunks before deleting messages
      if (onBeforeDeleteMessage) {
        for (const id of idsToDelete) {
          try {
            await onBeforeDeleteMessage(id);
          } catch (memoryError) {
            console.warn('[Messages] Failed to clean up memory for message:', id, memoryError);
          }
        }
      }
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      setMessages(msgs => msgs.filter(m => !idsToDelete.includes(m.id)));
      toast.success(t('messages.groupDeleted'));
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [messages, t, onBeforeDeleteMessage]);

  // Update message rating
  const handleRatingChange = useCallback(async (messageId: string, rating: number) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const currentMetadata = (message?.metadata as MessageMetadata) || {};

      const { error } = await supabase
        .from('messages')
        .update({
          metadata: { ...currentMetadata, rating } as unknown as Json
        })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(msgs => msgs.map(m =>
        m.id === messageId
          ? { ...m, metadata: { ...currentMetadata, rating } }
          : m
      ));
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [messages]);

  // Update message Likert rating (0-5 scale)
  const handleLikertRate = useCallback(async (messageId: string, value: number) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const currentMetadata = (message?.metadata as MessageMetadata) || {};

      const { error } = await supabase
        .from('messages')
        .update({
          metadata: { ...currentMetadata, user_likert: value } as unknown as Json
        })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(msgs => msgs.map(m =>
        m.id === messageId
          ? { ...m, metadata: { ...currentMetadata, user_likert: value } }
          : m
      ));
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [messages]);

  // Update message proposals (for Supervisor Approval feature)
  const handleUpdateProposals = useCallback(async (messageId: string, proposals: Proposal[]) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const currentMetadata = (message?.metadata as MessageMetadata) || {};

      const updatedMetadata = { ...currentMetadata, proposals, proposals_updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from('messages')
        .update({ metadata: updatedMetadata as unknown as Json })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(msgs => msgs.map(m =>
        m.id === messageId
          ? { ...m, metadata: updatedMetadata }
          : m
      ));
      
      // Count approved/rejected
      const approved = proposals.filter(p => p.status === 'approved').length;
      const rejected = proposals.filter(p => p.status === 'rejected').length;
      
      if (approved > 0 || rejected > 0) {
        const parts: string[] = [];
        if (approved > 0) parts.push(`${approved} утв.`);
        if (rejected > 0) parts.push(`${rejected} откл.`);
        toast.success(`Предложения обновлены: ${parts.join(', ')}`);
      }
    } catch (error: any) {
      console.error('[Messages] Failed to update proposals:', error);
      toast.error('Ошибка сохранения предложений');
    }
  }, [messages]);

  // Update checklist state in message metadata
  const handleChecklistChange = useCallback(async (messageId: string, checklistState: Record<number, boolean>) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const currentMetadata = (message?.metadata as MessageMetadata) || {};

      const updatedMetadata = { ...currentMetadata, checklist_state: checklistState };

      const { error } = await supabase
        .from('messages')
        .update({ metadata: updatedMetadata as unknown as Json })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state immediately
      setMessages(msgs => msgs.map(m =>
        m.id === messageId
          ? { ...m, metadata: updatedMetadata }
          : m
      ));
    } catch (error: any) {
      console.error('[Messages] Failed to update checklist state:', error);
    }
  }, [messages]);
  // Filter messages based on selected participant
  const displayedMessages = useMemo(() => {
    if (!filteredParticipant) return messages;

    const targetMessage = messages.find(m => m.id === filteredParticipant);
    if (!targetMessage) return messages;

    if (targetMessage.role === 'user') {
      return messages.filter(m => m.role === 'user');
    } else {
      return messages.filter(m => m.model_name === targetMessage.model_name);
    }
  }, [messages, filteredParticipant]);

  return {
    messages,
    setMessages,
    displayedMessages,
    filteredParticipant,
    setFilteredParticipant,
    activeParticipant,
    setActiveParticipant,
    handleDeleteMessage,
    handleDeleteMessageGroup,
    handleRatingChange,
    handleLikertRate,
    handleUpdateProposals,
    handleChecklistChange,
    fetchMessages,
  };
}
