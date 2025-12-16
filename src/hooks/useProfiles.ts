import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url')
          .order('display_name', { ascending: true });

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const searchProfiles = (query: string): Profile[] => {
    if (!query) return profiles;
    const lowerQuery = query.toLowerCase();
    return profiles.filter(
      (p) =>
        p.display_name?.toLowerCase().includes(lowerQuery) ||
        p.email?.toLowerCase().includes(lowerQuery)
    );
  };

  return { profiles, isLoading, searchProfiles };
}
