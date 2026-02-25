import { useMemo, useCallback } from 'react';
import type { Message, MessageGraphNode } from '@/types/messages';
import type { MessageLink } from '@/types/messages';

interface RequestGroup {
  id: string;
  userMessage: Message;
  nodes: MessageGraphNode[];
  crossChatLinks: MessageLink[];
  bestPathScore: number | null;
  alternativePaths: Array<{
    description: string;
    score: number;
  }>;
}

interface UseMessageGraphReturn {
  /** Messages grouped by user request, each with a response tree */
  requestGroups: RequestGroup[];
  /** Build a tree of MessageGraphNodes for a given request group */
  getTreeForRequest: (requestGroupId: string) => MessageGraphNode[];
  /** Flat list of all graph nodes for search/filter */
  allNodes: MessageGraphNode[];
  /** Get the path from root to a specific message */
  getPathToMessage: (messageId: string) => Message[];
  /** Calculate aggregated score along a path */
  calculatePathScore: (path: Message[], links: MessageLink[]) => number | null;
}

/**
 * Builds a decision tree graph from flat messages + links.
 * Core engine for the Navigator component.
 */
export function useMessageGraph(
  messages: Message[],
  links: MessageLink[],
): UseMessageGraphReturn {

  // Index: messageId -> children
  const childrenMap = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const msg of messages) {
      if (msg.parent_message_id) {
        const siblings = map.get(msg.parent_message_id) || [];
        siblings.push(msg);
        map.set(msg.parent_message_id, siblings);
      }
    }
    return map;
  }, [messages]);

  // Index: messageId -> outgoing links
  const outgoingLinksMap = useMemo(() => {
    const map = new Map<string, MessageLink[]>();
    for (const link of links) {
      const arr = map.get(link.source_message_id) || [];
      arr.push(link);
      map.set(link.source_message_id, arr);
    }
    return map;
  }, [links]);

  // Index: messageId -> incoming links
  const incomingLinksMap = useMemo(() => {
    const map = new Map<string, MessageLink[]>();
    for (const link of links) {
      const arr = map.get(link.target_message_id) || [];
      arr.push(link);
      map.set(link.target_message_id, arr);
    }
    return map;
  }, [links]);

  // Build tree node recursively
  const buildNode = useCallback((message: Message, depth: number, visited: Set<string>): MessageGraphNode => {
    if (visited.has(message.id)) {
      return { message, children: [], links: [], depth, pathScore: null };
    }
    visited.add(message.id);

    const children = (childrenMap.get(message.id) || [])
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(child => buildNode(child, depth + 1, visited));

    const nodeLinks = [
      ...(outgoingLinksMap.get(message.id) || []),
      ...(incomingLinksMap.get(message.id) || []),
    ];

    // Path score: average of evaluation weights on this branch
    const evaluationLinks = nodeLinks.filter(l => l.link_type === 'evaluation' && l.weight != null);
    const pathScore = evaluationLinks.length > 0
      ? evaluationLinks.reduce((sum, l) => sum + (l.weight || 0), 0) / evaluationLinks.length
      : null;

    return { message, children, links: nodeLinks, depth, pathScore };
  }, [childrenMap, outgoingLinksMap, incomingLinksMap]);

  // Group messages by request (user messages)
  const requestGroups = useMemo<RequestGroup[]>(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    const groups: RequestGroup[] = [];

    for (const userMsg of userMessages) {
      const groupId = userMsg.request_group_id || userMsg.id;
      const visited = new Set<string>();

      // Find direct children (responses to this user message)
      const directResponses = messages.filter(m =>
        m.parent_message_id === userMsg.id ||
        (m.request_group_id === groupId && m.role !== 'user' && !m.parent_message_id)
      );

      // If no graph structure yet, fall back to sequential grouping
      const responseNodes: MessageGraphNode[] = directResponses.length > 0
        ? directResponses.map(m => buildNode(m, 1, visited))
        : [];

      // Cross-chat links for this group
      const groupMessageIds = new Set([userMsg.id, ...directResponses.map(m => m.id)]);
      const crossChatLinks = links.filter(l =>
        (l.link_type === 'forward_to_dchat' || l.link_type === 'return_from_dchat') &&
        (groupMessageIds.has(l.source_message_id) || groupMessageIds.has(l.target_message_id))
      );

      // Calculate best/alternative paths
      const allScores = responseNodes
        .map(n => n.pathScore)
        .filter((s): s is number => s !== null)
        .sort((a, b) => b - a);

      groups.push({
        id: groupId,
        userMessage: userMsg,
        nodes: responseNodes,
        crossChatLinks,
        bestPathScore: allScores[0] ?? null,
        alternativePaths: allScores.slice(1).map((score, i) => ({
          description: `Alternative path ${i + 1}`,
          score,
        })),
      });
    }

    return groups;
  }, [messages, links, buildNode]);

  // Flat list of all nodes
  const allNodes = useMemo(() => {
    const flat: MessageGraphNode[] = [];
    const flatten = (node: MessageGraphNode) => {
      flat.push(node);
      node.children.forEach(flatten);
    };
    requestGroups.forEach(g => g.nodes.forEach(flatten));
    return flat;
  }, [requestGroups]);

  // Get tree for a specific request group
  const getTreeForRequest = useCallback((requestGroupId: string): MessageGraphNode[] => {
    const group = requestGroups.find(g => g.id === requestGroupId);
    return group?.nodes || [];
  }, [requestGroups]);

  // Get path from root to a message
  const getPathToMessage = useCallback((messageId: string): Message[] => {
    const path: Message[] = [];
    let current = messages.find(m => m.id === messageId);
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current);
      if (current.parent_message_id) {
        current = messages.find(m => m.id === current!.parent_message_id);
      } else {
        break;
      }
    }
    return path;
  }, [messages]);

  // Calculate score for a path
  const calculatePathScore = useCallback((path: Message[], pathLinks: MessageLink[]): number | null => {
    const pathIds = new Set(path.map(m => m.id));
    const relevantLinks = pathLinks.filter(l =>
      l.link_type === 'evaluation' &&
      l.weight != null &&
      (pathIds.has(l.source_message_id) || pathIds.has(l.target_message_id))
    );

    if (relevantLinks.length === 0) return null;
    return relevantLinks.reduce((sum, l) => sum + (l.weight || 0), 0) / relevantLinks.length;
  }, []);

  return {
    requestGroups,
    getTreeForRequest,
    allNodes,
    getPathToMessage,
    calculatePathScore,
  };
}
