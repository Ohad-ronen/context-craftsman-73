import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ExperimentTemplate {
  id: string;
  name: string;
  goal: string;
  mission: string;
  example: string;
  rules: string;
  use_websearch: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateFormData {
  name: string;
  goal: string;
  mission: string;
  example: string;
  rules: string;
  use_websearch: boolean;
}

export const useExperimentTemplates = () => {
  const [templates, setTemplates] = useState<ExperimentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTemplates = async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('experiment_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates((data as ExperimentTemplate[]) || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();

    // Set up real-time subscription
    const channel = supabase
      .channel('experiment_templates_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'experiment_templates',
        },
        () => {
          fetchTemplates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addTemplate = async (data: TemplateFormData): Promise<ExperimentTemplate | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save templates',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data: newTemplate, error } = await supabase
        .from('experiment_templates')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistically update local state
      setTemplates(prev => [...prev, newTemplate as ExperimentTemplate].sort((a, b) => a.name.localeCompare(b.name)));

      toast({
        title: 'Template Saved',
        description: `"${data.name}" has been saved`,
      });

      return newTemplate as ExperimentTemplate;
    } catch (error) {
      console.error('Error adding template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, data: Partial<TemplateFormData>): Promise<ExperimentTemplate | null> => {
    try {
      const { data: updated, error } = await supabase
        .from('experiment_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Template Updated',
        description: 'Template has been updated',
      });

      return updated as ExperimentTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('experiment_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Template Deleted',
        description: 'Template has been removed',
      });

      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
};
