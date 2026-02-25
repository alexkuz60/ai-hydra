import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { MessageLink, MessageLinkType } from '@/types/messages';

interface UseMessageLinksProps {
  /** Session ID to scope link queries (loads links for all messages in session) */
  sessionId: string | null;
  /** Optional secondary session ID (D-chat) to include cross-chat links */
  dChatSessionId?: string | null;
}

interface UseMessageLinksReturn {
  links: MessageLink[];
  isLoading: boolean;
  /** Create a link between two messages */
  createLink: (
    sourceId: string,
    targetId: string,
    linkType: MessageLinkType,
    weight?: number | null,
    metadata?: Record<string, unknown>,
  ) => Promise<MessageLink | null>;
  /** Create multiple links at once (e.g. forward_to_dchat batch) */
  createLinks: (
    items: Array<{
      source_message_id: string;
      target_message_id: string;
      link_type: MessageLinkType;
      weight?: number | null;
      metadata?: Record<string, unknown>;
    }>
  ) => Promise<MessageLink[]>;
  /** Update weight (e.g. after Arbiter evaluation) */
  updateWeight: (linkId: string, weight: number) => Promise<void>;
  /** Delete a link */
  deleteLink: (linkId: string) => Promise<void>;
  /** Get all links for a specific message */
  getLinksForMessage: (messageId: string) => MessageLink[];
  /** Get cross-chat links (forward/return) */
  getCrossChatLinks: () => MessageLink[];
  /** Refresh links from DB */
  refresh: () => Promise<void>;
}

export function useMessageLinks({
  sessionId,
  dChatSessionId,
}: UseMessageLinksProps): UseMessageLinksReturn {
  const [links, setLinks] = useState<MessageLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch links for all messages in session(s)
  const fetchLinks = useCallback(async () => {
    if (!sessionId) {
      setLinks([]);
      return;
    }
    setIsLoading(true);
    try {
      // Get message IDs for this session
      const sessionIds = [sessionId, dChatSessionId].filter(Boolean) as string[];

      const { data: messageRows, error: msgError } = await supabase
        .from('messages')
        .select('id')
        .in('session_id', sessionIds);

      if (msgError) throw msgError;
      const messageIds = (messageRows || []).map(r => r.id);
      if (messageIds.length === 0) {
        setLinks([]);
        return;
      }

      // Fetch links where source OR target is in our messages
      // Split into two queries to work within Supabase filter limitations
      const [{ data: sourceLinks, error: e1 }, { data: targetLinks, error: e2 }] = await Promise.all([
        supabase
          .from('message_links')
          .select('*')
          .in('source_message_id', messageIds),
        supabase
          .from('message_links')
          .select('*')
          .in('target_message_id', messageIds),
      ]);

      if (e1) throw e1;
      if (e2) throw e2;

      // Deduplicate
      const map = new Map<string, MessageLink>();
      for (const l of [...(sourceLinks || []), ...(targetLinks || [])]) {
        map.set(l.id, l as unknown as MessageLink);
      }
      setLinks(Array.from(map.values()));
    } catch (error) {
      console.error('[useMessageLinks] Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, dChatSessionId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const createLink = useCallback(async (
    sourceId: string,
    targetId: string,
    linkType: MessageLinkType,
    weight?: number | null,
    metadata?: Record<string, unknown>,
  ): Promise<MessageLink | null> => {
    try {
      const { data, error } = await supabase
        .from('message_links')
        .insert({
          source_message_id: sourceId,
          target_message_id: targetId,
          link_type: linkType,
          weight: weight ?? null,
          metadata: (metadata ?? {}) as Json,
        } as any)
        .select()
        .single();

      if (error) throw error;
      const link = data as unknown as MessageLink;
      setLinks(prev => [...prev, link]);
      return link;
    } catch (error) {
      console.error('[useMessageLinks] Failed to create link:', error);
      return null;
    }
  }, []);

  const createLinks = useCallback(async (
    items: Array<{
      source_message_id: string;
      target_message_id: string;
      link_type: MessageLinkType;
      weight?: number | null;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<MessageLink[]> => {
    if (items.length === 0) return [];
    try {
      const rows = items.map(item => ({
        source_message_id: item.source_message_id,
        target_message_id: item.target_message_id,
        link_type: item.link_type,
        weight: item.weight ?? null,
        metadata: (item.metadata ?? {}) as Json,
      }));

      const { data, error } = await supabase
        .from('message_links')
        .insert(rows as any)
        .select();

      if (error) throw error;
      const newLinks = (data || []) as unknown as MessageLink[];
      setLinks(prev => [...prev, ...newLinks]);
      return newLinks;
    } catch (error) {
      console.error('[useMessageLinks] Failed to create batch links:', error);
      return [];
    }
  }, []);

  const updateWeight = useCallback(async (linkId: string, weight: number) => {
    try {
      const { error } = await supabase
        .from('message_links')
        .update({ weight })
        .eq('id', linkId);

      if (error) throw error;
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, weight } : l));
    } catch (error) {
      console.error('[useMessageLinks] Failed to update weight:', error);
    }
  }, []);

  const deleteLink = useCallback(async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('message_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      setLinks(prev => prev.filter(l => l.id !== linkId));
    } catch (error) {
      console.error('[useMessageLinks] Failed to delete link:', error);
    }
  }, []);

  const getLinksForMessage = useCallback((messageId: string): MessageLink[] => {
    return links.filter(l =>
      l.source_message_id === messageId || l.target_message_id === messageId
    );
  }, [links]);

  const getCrossChatLinks = useCallback((): MessageLink[] => {
    return links.filter(l =>
      l.link_type === 'forward_to_dchat' || l.link_type === 'return_from_dchat'
    );
  }, [links]);

  return {
    links,
    isLoading,
    createLink,
    createLinks,
    updateWeight,
    deleteLink,
    getLinksForMessage,
    getCrossChatLinks,
    refresh: fetchLinks,
  };
}
