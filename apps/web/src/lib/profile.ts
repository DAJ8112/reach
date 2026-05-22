import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import type { Profile, ProfileUpdate } from '@reach/shared';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await api<Profile>('/api/profile');
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (patch: ProfileUpdate) => {
    const updated = await api<Profile>('/api/profile', { method: 'PATCH', body: patch });
    setProfile(updated);
    return updated;
  }, []);

  return { profile, loading, error, reload, save };
}
