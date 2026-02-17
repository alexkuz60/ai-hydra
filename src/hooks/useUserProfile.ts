import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

/** Returns a fresh signed URL for avatar path stored in profiles.avatar_url */
async function resolveAvatarUrl(rawUrl: string | null, userId: string): Promise<string | null> {
  if (!rawUrl) return null;
  // If it's already a full signed URL (legacy 10-year URLs), return as-is
  // New format: store just the path "userId/avatar.jpg"
  if (!rawUrl.startsWith('http')) {
    const { data } = await supabase.storage
      .from('avatars')
      .createSignedUrl(rawUrl, 60 * 60 * 2); // 2-hour signed URL, refreshed on each load
    return data?.signedUrl || null;
  }
  return rawUrl;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const avatarUrl = await resolveAvatarUrl(data?.avatar_url || null, user.id);

      setProfile({
        displayName: data?.display_name || null,
        username: data?.username || null,
        avatarUrl,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    refetch: fetchProfile,
  };
}

