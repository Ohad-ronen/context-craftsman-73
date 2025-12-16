import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ExperimentTag {
  id: string;
  experiment_id: string;
  tag_id: string;
  tag?: Tag;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [experimentTags, setExperimentTags] = useState<Map<string, Tag[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching tags:', error);
      return;
    }
    
    setTags(data || []);
  }, []);

  const fetchExperimentTags = useCallback(async () => {
    const { data, error } = await supabase
      .from('experiment_tags')
      .select(`
        id,
        experiment_id,
        tag_id,
        tags:tag_id (id, name, color, created_at)
      `);
    
    if (error) {
      console.error('Error fetching experiment tags:', error);
      return;
    }

    const tagMap = new Map<string, Tag[]>();
    data?.forEach((et: any) => {
      const expId = et.experiment_id;
      const tag = et.tags as Tag;
      if (tag) {
        const existing = tagMap.get(expId) || [];
        tagMap.set(expId, [...existing, tag]);
      }
    });
    
    setExperimentTags(tagMap);
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchTags(), fetchExperimentTags()]);
      setIsLoading(false);
    };
    load();

    // Set up realtime subscription
    const tagsChannel = supabase
      .channel('tags-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, fetchTags)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'experiment_tags' }, fetchExperimentTags)
      .subscribe();

    return () => {
      supabase.removeChannel(tagsChannel);
    };
  }, [fetchTags, fetchExperimentTags]);

  const createTag = async (name: string, color: string = '#6366f1'): Promise<Tag | null> => {
    const { data, error } = await supabase
      .from('tags')
      .insert({ name: name.trim(), color })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tag:', error);
      return null;
    }
    
    return data;
  };

  const deleteTag = async (tagId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);
    
    if (error) {
      console.error('Error deleting tag:', error);
      return false;
    }
    
    return true;
  };

  const addTagToExperiment = async (experimentId: string, tagId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('experiment_tags')
      .insert({ experiment_id: experimentId, tag_id: tagId });
    
    if (error) {
      if (error.code === '23505') return true; // Already exists
      console.error('Error adding tag to experiment:', error);
      return false;
    }
    
    return true;
  };

  const removeTagFromExperiment = async (experimentId: string, tagId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('experiment_tags')
      .delete()
      .eq('experiment_id', experimentId)
      .eq('tag_id', tagId);
    
    if (error) {
      console.error('Error removing tag from experiment:', error);
      return false;
    }
    
    return true;
  };

  const getTagsForExperiment = (experimentId: string): Tag[] => {
    return experimentTags.get(experimentId) || [];
  };

  return {
    tags,
    experimentTags,
    isLoading,
    createTag,
    deleteTag,
    addTagToExperiment,
    removeTagFromExperiment,
    getTagsForExperiment,
    refetch: () => Promise.all([fetchTags(), fetchExperimentTags()]),
  };
}
