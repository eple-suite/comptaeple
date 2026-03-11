// Hook for CRUD operations on voyages with Supabase persistence
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { toast } from 'sonner';

export interface VoyageDB {
  id: string;
  establishment_id: string;
  user_id: string;
  destination: string;
  pays: string;
  intitule: string | null;
  date_depart: string;
  date_retour: string;
  nb_eleves: number;
  nb_accompagnateurs: number;
  budget_total: number;
  participation_familles: number;
  subventions: number;
  charge_etablissement: number;
  autofinancement: number;
  statut: string;
  transport: number;
  hebergement: number;
  restauration: number;
  activites: number;
  assurance: number;
  divers: number;
  regie_avances: number;
  professeur: string;
  classe: string;
  objectif_pedagogique: string | null;
  subvention_collectivite: number;
  subvention_etat: number;
  subvention_autre: number;
  date_vote_ca: string | null;
  date_limite_inscription: string | null;
  transport_type: string | null;
  type_voyage: string | null;
  code_activite_gfc: string | null;
  lieu_depart: string | null;
  horaires_depart: string | null;
  horaires_retour: string | null;
  moyen_transport: string | null;
  type_hebergement: string | null;
  contact_urgence: string | null;
  tel_urgence: string | null;
  version_statut: string;
  validateur_id: string | null;
  date_validation: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipantDB {
  id: string;
  voyage_id: string;
  nom: string;
  prenom: string;
  classe: string;
  regime: string;
  responsable: string | null;
  email_responsable: string | null;
  tel_responsable: string | null;
  participation_due: number;
  autorisation_parentale: boolean;
  fiche_sanitaire: boolean;
  assurance_rc: boolean;
  passeport: boolean;
  date_inscription: string | null;
  created_at: string;
}

export interface PaiementDB {
  id: string;
  participant_id: string;
  voyage_id: string;
  date_paiement: string;
  montant: number;
  mode: string;
  reference: string | null;
  encaisse: boolean;
  fonds_social: boolean;
  observations: string | null;
  created_at: string;
}

export function useVoyages() {
  const { user } = useAuth();
  const { selectedEstablishment } = useEstablishment();
  const queryClient = useQueryClient();
  const estId = selectedEstablishment?.id;

  const { data: voyages = [], isLoading, refetch } = useQuery({
    queryKey: ['voyages', estId],
    queryFn: async () => {
      if (!estId) return [];
      const { data, error } = await supabase
        .from('voyages' as any)
        .select('*')
        .eq('establishment_id', estId)
        .order('date_depart', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as VoyageDB[];
    },
    enabled: !!user && !!estId,
  });

  const createVoyage = useMutation({
    mutationFn: async (voyage: Partial<VoyageDB>) => {
      if (!user || !estId) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('voyages' as any)
        .insert({ ...voyage, establishment_id: estId, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as VoyageDB;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voyages', estId] });
      toast.success('Voyage créé avec succès');
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const updateVoyage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VoyageDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('voyages' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as VoyageDB;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voyages', estId] });
      toast.success('Voyage mis à jour');
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const deleteVoyage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('voyages' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voyages', estId] });
      toast.success('Voyage supprimé');
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  // Cumul annuel par catégorie pour marchés publics
  const getCumulAnnuel = useCallback((exercice: number) => {
    const voyagesExercice = voyages.filter(v => {
      const year = new Date(v.date_depart).getFullYear();
      return year === exercice && v.statut !== 'annule';
    });
    return {
      transport: voyagesExercice.reduce((s, v) => s + v.transport, 0),
      hebergement: voyagesExercice.reduce((s, v) => s + v.hebergement, 0),
      restauration: voyagesExercice.reduce((s, v) => s + v.restauration, 0),
      activites: voyagesExercice.reduce((s, v) => s + v.activites, 0),
      assurance: voyagesExercice.reduce((s, v) => s + v.assurance, 0),
      divers: voyagesExercice.reduce((s, v) => s + v.divers, 0),
      total: voyagesExercice.reduce((s, v) => s + v.budget_total, 0),
      nbVoyages: voyagesExercice.length,
    };
  }, [voyages]);

  return {
    voyages,
    isLoading,
    refetch,
    createVoyage,
    updateVoyage,
    deleteVoyage,
    getCumulAnnuel,
  };
}

export function useVoyageParticipants(voyageId: string | null) {
  const { user } = useAuth();

  const { data: participants = [], isLoading, refetch } = useQuery({
    queryKey: ['voyage-participants', voyageId],
    queryFn: async () => {
      if (!voyageId) return [];
      const { data, error } = await supabase
        .from('voyage_participants' as any)
        .select('*')
        .eq('voyage_id', voyageId)
        .order('nom');
      if (error) throw error;
      return (data || []) as unknown as ParticipantDB[];
    },
    enabled: !!user && !!voyageId,
  });

  return { participants, isLoading, refetch };
}

export function useVoyagePaiements(voyageId: string | null) {
  const { user } = useAuth();

  const { data: paiements = [], isLoading, refetch } = useQuery({
    queryKey: ['voyage-paiements', voyageId],
    queryFn: async () => {
      if (!voyageId) return [];
      const { data, error } = await supabase
        .from('voyage_paiements' as any)
        .select('*')
        .eq('voyage_id', voyageId)
        .order('date_paiement', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PaiementDB[];
    },
    enabled: !!user && !!voyageId,
  });

  return { paiements, isLoading, refetch };
}
