import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FlowDiagram, FlowNodeData, FlowDiagramSource } from '@/types/flow';
import { Node, Edge, Viewport } from '@xyflow/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';

export function useFlowDiagrams() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const queryClient = useQueryClient();

  const { data: allDiagrams = [], isLoading } = useQuery({
    queryKey: ['flow-diagrams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('flow_diagrams')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Parse JSONB fields
      return (data || []).map((d: any) => ({
        ...d,
        nodes: (d.nodes || []) as Node[],
        edges: (d.edges || []) as Edge[],
        viewport: (d.viewport || { x: 0, y: 0, zoom: 1 }) as Viewport,
        source: (d.source || 'user') as FlowDiagramSource,
      })) as FlowDiagram[];
    },
    enabled: !!user,
  });

  // Filter out pattern-generated diagrams for non-admins in the "Open" list
  const diagrams = isAdmin 
    ? allDiagrams 
    : allDiagrams.filter(d => d.source !== 'pattern');

  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      nodes,
      edges,
      viewport,
      is_shared,
      source,
    }: Partial<FlowDiagram> & { name: string }) => {
      if (!user) throw new Error('Not authenticated');

      const payload = {
        name,
        description,
        nodes: nodes as any,
        edges: edges as any,
        viewport: viewport as any,
        is_shared: is_shared || false,
        source: source || 'user',
        user_id: user.id,
      };

      if (id) {
        // Update existing
        const { data, error } = await supabase
          .from('flow_diagrams')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('flow_diagrams')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-diagrams'] });
      toast({
        description: 'Диаграмма сохранена',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: `Ошибка сохранения: ${error.message}`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flow_diagrams')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-diagrams'] });
      toast({
        description: 'Диаграмма удалена',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        description: `Ошибка удаления: ${error.message}`,
      });
    },
  });

  return {
    diagrams,
    isLoading,
    saveDiagram: saveMutation.mutateAsync,
    deleteDiagram: deleteMutation.mutate,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Export to Mermaid helper
export function exportToMermaid(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) return 'graph TD\n    A[Empty diagram]';

  let mermaid = 'graph TD\n';

  // Map node IDs to shorter Mermaid-friendly IDs
  const idMap = new Map<string, string>();
  nodes.forEach((node, index) => {
    idMap.set(node.id, String.fromCharCode(65 + (index % 26)) + (index >= 26 ? index : ''));
  });

  // Add nodes
  nodes.forEach((node) => {
    const mermaidId = idMap.get(node.id)!;
    const nodeData = node.data as FlowNodeData | undefined;
    const label = nodeData?.label || node.type || 'Node';
    
    let shape: [string, string];
    switch (node.type) {
      case 'condition':
        shape = ['{', '}'];
        break;
      case 'input':
        shape = ['([', '])'];
        break;
      case 'output':
        shape = ['[[', ']]'];
        break;
      case 'model':
        shape = ['((', '))'];
        break;
      case 'tool':
        shape = ['>>', ']'];
        break;
      default:
        shape = ['[', ']'];
    }
    
    mermaid += `    ${mermaidId}${shape[0]}${label}${shape[1]}\n`;
  });

  // Add edges
  edges.forEach((edge) => {
    const source = idMap.get(edge.source);
    const target = idMap.get(edge.target);
    if (source && target) {
      const label = edge.label ? `|${edge.label}|` : '';
      mermaid += `    ${source} -->${label} ${target}\n`;
    }
  });

  return mermaid;
}
