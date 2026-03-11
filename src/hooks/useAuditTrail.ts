// Hook for COFIEPLE audit trail — immutable log of all actions
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AuditActionType = 'import' | 'edit_note' | 'generate_ai' | 'validate' | 'export_pdf' | 'export_csv';

export interface AuditEntry {
  action_type: AuditActionType;
  action_detail: string;
  uai: string;
  exercice: number;
  section_id?: string;
  metadata?: Record<string, any>;
}

export function useAuditTrail() {
  const { user, profile } = useAuth();

  const logAction = useCallback(async (entry: AuditEntry) => {
    if (!user) return;
    const userName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : user.email || 'Inconnu';

    try {
      await supabase.from('cofieple_audit_trail' as any).insert({
        user_id: user.id,
        user_name: userName,
        uai: entry.uai,
        exercice: entry.exercice,
        action_type: entry.action_type,
        action_detail: entry.action_detail,
        section_id: entry.section_id || null,
        metadata: entry.metadata || {},
      });
    } catch (e) {
      console.error('Audit trail log error:', e);
    }
  }, [user, profile]);

  const getLastModification = useCallback(async (uai: string, exercice: number, sectionId: string) => {
    if (!user) return null;
    try {
      const { data } = await supabase
        .from('cofieple_audit_trail' as any)
        .select('user_name, created_at')
        .eq('uai', uai)
        .eq('exercice', exercice)
        .eq('section_id', sectionId)
        .in('action_type', ['edit_note', 'generate_ai'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as unknown as { user_name: string; created_at: string } | null;
    } catch {
      return null;
    }
  }, [user]);

  const getAuditHistory = useCallback(async (uai: string, exercice: number) => {
    if (!user) return [];
    try {
      const { data } = await supabase
        .from('cofieple_audit_trail' as any)
        .select('*')
        .eq('uai', uai)
        .eq('exercice', exercice)
        .order('created_at', { ascending: false })
        .limit(200);
      return (data || []) as any[];
    } catch {
      return [];
    }
  }, [user]);

  return { logAction, getLastModification, getAuditHistory };
}
