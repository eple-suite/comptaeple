export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      balances: {
        Row: {
          account_label: string
          account_number: string
          balance: number
          created_at: string
          credit: number
          debit: number
          establishment_id: string
          id: string
          year: number
        }
        Insert: {
          account_label?: string
          account_number: string
          balance?: number
          created_at?: string
          credit?: number
          debit?: number
          establishment_id: string
          id?: string
          year: number
        }
        Update: {
          account_label?: string
          account_number?: string
          balance?: number
          created_at?: string
          credit?: number
          debit?: number
          establishment_id?: string
          id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "balances_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      cofieple_exercises: {
        Row: {
          bfr: number
          caf: number
          created_at: string
          exercice: number
          fdr: number
          id: string
          jours_autonomie: number
          niveau_risque: string | null
          reserves: number
          reserves_srh: number
          reserves_ss_specialite: number
          resultat_budgetaire: number
          resultat_comptable: number
          score_risque: number | null
          taux_exec_charges: number
          taux_exec_produits: number
          total_amortissements: number
          total_charges_prev: number
          total_charges_reel: number
          total_immo: number
          total_produits_prev: number
          total_produits_reel: number
          tresorerie: number
          type_budget: string
          uai: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bfr?: number
          caf?: number
          created_at?: string
          exercice: number
          fdr?: number
          id?: string
          jours_autonomie?: number
          niveau_risque?: string | null
          reserves?: number
          reserves_srh?: number
          reserves_ss_specialite?: number
          resultat_budgetaire?: number
          resultat_comptable?: number
          score_risque?: number | null
          taux_exec_charges?: number
          taux_exec_produits?: number
          total_amortissements?: number
          total_charges_prev?: number
          total_charges_reel?: number
          total_immo?: number
          total_produits_prev?: number
          total_produits_reel?: number
          tresorerie?: number
          type_budget?: string
          uai: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bfr?: number
          caf?: number
          created_at?: string
          exercice?: number
          fdr?: number
          id?: string
          jours_autonomie?: number
          niveau_risque?: string | null
          reserves?: number
          reserves_srh?: number
          reserves_ss_specialite?: number
          resultat_budgetaire?: number
          resultat_comptable?: number
          score_risque?: number | null
          taux_exec_charges?: number
          taux_exec_produits?: number
          total_amortissements?: number
          total_charges_prev?: number
          total_charges_reel?: number
          total_immo?: number
          total_produits_prev?: number
          total_produits_reel?: number
          tresorerie?: number
          type_budget?: string
          uai?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cofieple_extra_indicators: {
        Row: {
          commentaire_caf: string | null
          commentaire_fdr: string | null
          commentaire_general: string | null
          commentaire_tresorerie: string | null
          conso_eau: number | null
          conso_electricite: number | null
          conso_gaz: number | null
          cout_denrees_repas: number | null
          created_at: string
          effectif_boursiers: number | null
          effectif_dp: number | null
          effectif_eleves: number | null
          effectif_externes: number | null
          effectif_internes: number | null
          effectif_personnel: number | null
          etp_ressources_propres: number | null
          exercice: number
          id: string
          montant_fonds_social: number | null
          nb_repas_commensaux: number | null
          nb_repas_servis: number | null
          prix_moyen_repas: number | null
          surface_batiments: number | null
          tarif_internat: number | null
          taux_occupation_internat: number | null
          taux_passage: number | null
          taux_reussite_bac: number | null
          uai: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commentaire_caf?: string | null
          commentaire_fdr?: string | null
          commentaire_general?: string | null
          commentaire_tresorerie?: string | null
          conso_eau?: number | null
          conso_electricite?: number | null
          conso_gaz?: number | null
          cout_denrees_repas?: number | null
          created_at?: string
          effectif_boursiers?: number | null
          effectif_dp?: number | null
          effectif_eleves?: number | null
          effectif_externes?: number | null
          effectif_internes?: number | null
          effectif_personnel?: number | null
          etp_ressources_propres?: number | null
          exercice: number
          id?: string
          montant_fonds_social?: number | null
          nb_repas_commensaux?: number | null
          nb_repas_servis?: number | null
          prix_moyen_repas?: number | null
          surface_batiments?: number | null
          tarif_internat?: number | null
          taux_occupation_internat?: number | null
          taux_passage?: number | null
          taux_reussite_bac?: number | null
          uai: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commentaire_caf?: string | null
          commentaire_fdr?: string | null
          commentaire_general?: string | null
          commentaire_tresorerie?: string | null
          conso_eau?: number | null
          conso_electricite?: number | null
          conso_gaz?: number | null
          cout_denrees_repas?: number | null
          created_at?: string
          effectif_boursiers?: number | null
          effectif_dp?: number | null
          effectif_eleves?: number | null
          effectif_externes?: number | null
          effectif_internes?: number | null
          effectif_personnel?: number | null
          etp_ressources_propres?: number | null
          exercice?: number
          id?: string
          montant_fonds_social?: number | null
          nb_repas_commensaux?: number | null
          nb_repas_servis?: number | null
          prix_moyen_repas?: number | null
          surface_batiments?: number | null
          tarif_internat?: number | null
          taux_occupation_internat?: number | null
          taux_passage?: number | null
          taux_reussite_bac?: number | null
          uai?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cofieple_import_logs: {
        Row: {
          budget_type: string
          created_at: string
          exercice: number
          file_exercice_detected: number | null
          file_name: string
          file_opale_detected: string | null
          file_type: string
          file_type_detected: string | null
          file_uai_detected: string | null
          id: string
          opale_number: string | null
          reject_reason: string | null
          result: string
          rows_count: number
          uai: string
          user_id: string
        }
        Insert: {
          budget_type?: string
          created_at?: string
          exercice: number
          file_exercice_detected?: number | null
          file_name: string
          file_opale_detected?: string | null
          file_type: string
          file_type_detected?: string | null
          file_uai_detected?: string | null
          id?: string
          opale_number?: string | null
          reject_reason?: string | null
          result: string
          rows_count?: number
          uai: string
          user_id: string
        }
        Update: {
          budget_type?: string
          created_at?: string
          exercice?: number
          file_exercice_detected?: number | null
          file_name?: string
          file_opale_detected?: string | null
          file_type?: string
          file_type_detected?: string | null
          file_uai_detected?: string | null
          id?: string
          opale_number?: string | null
          reject_reason?: string | null
          result?: string
          rows_count?: number
          uai?: string
          user_id?: string
        }
        Relationships: []
      }
      establishments: {
        Row: {
          academy: string
          city: string
          created_at: string
          id: string
          name: string
          opale_number: string
          type: string
          uai: string
          updated_at: string
        }
        Insert: {
          academy?: string
          city?: string
          created_at?: string
          id?: string
          name: string
          opale_number?: string
          type?: string
          uai: string
          updated_at?: string
        }
        Update: {
          academy?: string
          city?: string
          created_at?: string
          id?: string
          name?: string
          opale_number?: string
          type?: string
          uai?: string
          updated_at?: string
        }
        Relationships: []
      }
      indicators: {
        Row: {
          bfr: number | null
          charges_weight: number | null
          created_at: string
          establishment_id: string
          exercise_result: number | null
          fdr: number | null
          id: string
          operating_days: number | null
          recovery_rate: number | null
          srh_weight: number | null
          treasury: number | null
          year: number
        }
        Insert: {
          bfr?: number | null
          charges_weight?: number | null
          created_at?: string
          establishment_id: string
          exercise_result?: number | null
          fdr?: number | null
          id?: string
          operating_days?: number | null
          recovery_rate?: number | null
          srh_weight?: number | null
          treasury?: number | null
          year: number
        }
        Update: {
          bfr?: number | null
          charges_weight?: number | null
          created_at?: string
          establishment_id?: string
          exercise_result?: number | null
          fdr?: number | null
          id?: string
          operating_days?: number | null
          recovery_rate?: number | null
          srh_weight?: number | null
          treasury?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicators_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          uai: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          uai?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          uai?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academy: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academy?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          academy?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_establishments: {
        Row: {
          establishment_id: string
          id: string
          user_id: string
        }
        Insert: {
          establishment_id: string
          id?: string
          user_id: string
        }
        Update: {
          establishment_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_establishments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "agent"],
    },
  },
} as const
