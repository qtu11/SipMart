import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook để listen Supabase Realtime changes
 */
export function useSupabaseRealtime<T>(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    async function setupRealtime() {
      try {
        // Initial fetch
        let query = supabase.from(table).select('*');
        if (filter) {
          query = query.eq(filter.split('=')[0], filter.split('=')[1]);
        }
        
        const { data: initialData, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        setData((initialData as T[]) || []);
        setLoading(false);

        // Setup Realtime subscription
        channel = supabase
          .channel(`${table}_changes`)
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: table,
              filter: filter,
            },
            (payload) => {
              console.log('Realtime change:', payload);

              if (callback) {
                callback(payload);
              }

              // Update local state
              if (payload.eventType === 'INSERT') {
                setData((prev) => [...prev, payload.new as T]);
              } else if (payload.eventType === 'UPDATE') {
                setData((prev) =>
                  prev.map((item: any) =>
                    item.id === payload.new.id ? (payload.new as T) : item
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setData((prev) =>
                  prev.filter((item: any) => item.id !== payload.old.id)
                );
              }
            }
          )
          .subscribe();

        // Channel subscription is async, state will update automatically
      } catch (err) {
        console.error(`Error setting up realtime for ${table}:`, err);
        setError(err as Error);
        setLoading(false);
      }
    }

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, filter, callback]);

  return { data, loading, error };
}

/**
 * Hook để listen single record changes
 */
export function useSupabaseRealtimeRecord<T>(
  table: string,
  recordId: string,
  idColumn: string = 'id'
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    async function setupRealtime() {
      try {
        // Initial fetch
        const { data: initialData, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq(idColumn, recordId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        
        setData(initialData as T);
        setLoading(false);

        // Setup Realtime subscription
        channel = supabase
          .channel(`${table}_${recordId}_changes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: `${idColumn}=eq.${recordId}`,
            },
            (payload) => {
              if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                setData(payload.new as T);
              } else if (payload.eventType === 'DELETE') {
                setData(null);
              }
            }
          )
          .subscribe();

        // Channel subscription is async, state will update automatically
      } catch (err) {
        console.error(`Error setting up realtime for ${table}.${recordId}:`, err);
        setError(err as Error);
        setLoading(false);
      }
    }

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, recordId, idColumn]);

  return { data, loading, error };
}

