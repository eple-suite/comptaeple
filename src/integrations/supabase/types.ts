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
      cofieple_audit_trail: {
        Row: {
          action_detail: string
          action_type: string
          created_at: string
          exercice: number
          id: string
          metadata: Json | null
          section_id: string | null
          uai: string
          user_id: string
          user_name: string
        }
        Insert: {
          action_detail?: string
          action_type: string
          created_at?: string
          exercice: number
          id?: string
          metadata?: Json | null
          section_id?: string | null
          uai: string
          user_id: string
          user_name?: string
        }
        Update: {
          action_detail?: string
          action_type?: string
          created_at?: string
          exercice?: number
          id?: string
          metadata?: Json | null
          section_id?: string | null
          uai?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      cofieple_codes_activite: {
        Row: {
          actif: boolean
          categorie_analyse: string
          code: string
          created_at: string
          domaine: string
          exercice: number
          id: string
          libelle: string
          ordre: number
          service: string
          uai: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actif?: boolean
          categorie_analyse?: string
          code: string
          created_at?: string
          domaine?: string
          exercice: number
          id?: string
          libelle?: string
          ordre?: number
          service?: string
          uai: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actif?: boolean
          categorie_analyse?: string
          code?: string
          created_at?: string
          domaine?: string
          exercice?: number
          id?: string
          libelle?: string
          ordre?: number
          service?: string
          uai?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cofieple_comptes_sens_normal: {
        Row: {
          actif: boolean
          commentaire: string
          compte_prefix: string
          created_at: string
          gravite_violation: string
          id: string
          libelle: string
          sens_normal: string
          source: string
          uai: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actif?: boolean
          commentaire?: string
          compte_prefix: string
          created_at?: string
          gravite_violation?: string
          id?: string
          libelle?: string
          sens_normal?: string
          source?: string
          uai: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actif?: boolean
          commentaire?: string
          compte_prefix?: string
          created_at?: string
          gravite_violation?: string
          id?: string
          libelle?: string
          sens_normal?: string
          source?: string
          uai?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          jours_tresorerie: number
          niveau_risque: string | null
          reserves: number
          reserves_srh: number
          reserves_ss_specialite: number
          resultat_budgetaire: number
          resultat_comptable: number
          score_risque: number | null
          taux_exec_charges: number
          taux_exec_produits: number
          tmcap: number
          tmnr: number
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
          jours_tresorerie?: number
          niveau_risque?: string | null
          reserves?: number
          reserves_srh?: number
          reserves_ss_specialite?: number
          resultat_budgetaire?: number
          resultat_comptable?: number
          score_risque?: number | null
          taux_exec_charges?: number
          taux_exec_produits?: number
          tmcap?: number
          tmnr?: number
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
          jours_tresorerie?: number
          niveau_risque?: string | null
          reserves?: number
          reserves_srh?: number
          reserves_ss_specialite?: number
          resultat_budgetaire?: number
          resultat_comptable?: number
          score_risque?: number | null
          taux_exec_charges?: number
          taux_exec_produits?: number
          tmcap?: number
          tmnr?: number
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
      cofieple_snapshots: {
        Row: {
          budget_type: string
          created_at: string
          exercice: number
          id: string
          snapshot_data: Json
          uai: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_type?: string
          created_at?: string
          exercice: number
          id?: string
          snapshot_data?: Json
          uai: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_type?: string
          created_at?: string
          exercice?: number
          id?: string
          snapshot_data?: Json
          uai?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      establishment_annexes: {
        Row: {
          annexe_establishment_id: string
          budget_type: string
          compte_185_solde: number
          created_at: string
          id: string
          support_establishment_id: string
        }
        Insert: {
          annexe_establishment_id: string
          budget_type?: string
          compte_185_solde?: number
          created_at?: string
          id?: string
          support_establishment_id: string
        }
        Update: {
          annexe_establishment_id?: string
          budget_type?: string
          compte_185_solde?: number
          created_at?: string
          id?: string
          support_establishment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_annexes_annexe_establishment_id_fkey"
            columns: ["annexe_establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishment_annexes_support_establishment_id_fkey"
            columns: ["support_establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_branding: {
        Row: {
          address: string
          city: string
          created_at: string
          email: string
          establishment_id: string
          footer_text: string
          full_name: string
          id: string
          logo_url: string | null
          phone: string
          postal_code: string
          primary_color: string
          signataire_agent_comptable: string
          signataire_ordonnateur: string
          updated_at: string
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          email?: string
          establishment_id: string
          footer_text?: string
          full_name?: string
          id?: string
          logo_url?: string | null
          phone?: string
          postal_code?: string
          primary_color?: string
          signataire_agent_comptable?: string
          signataire_ordonnateur?: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email?: string
          establishment_id?: string
          footer_text?: string
          full_name?: string
          id?: string
          logo_url?: string | null
          phone?: string
          postal_code?: string
          primary_color?: string
          signataire_agent_comptable?: string
          signataire_ordonnateur?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_branding_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          academy: string
          agent_comptable: string
          city: string
          created_at: string
          id: string
          name: string
          opale_number: string
          ordonnateur: string
          secretaire_general: string
          type: string
          uai: string
          updated_at: string
        }
        Insert: {
          academy?: string
          agent_comptable?: string
          city?: string
          created_at?: string
          id?: string
          name: string
          opale_number?: string
          ordonnateur?: string
          secretaire_general?: string
          type?: string
          uai: string
          updated_at?: string
        }
        Update: {
          academy?: string
          agent_comptable?: string
          city?: string
          created_at?: string
          id?: string
          name?: string
          opale_number?: string
          ordonnateur?: string
          secretaire_general?: string
          type?: string
          uai?: string
          updated_at?: string
        }
        Relationships: []
      }
      fs_commissions: {
        Row: {
          annee_scolaire: string
          created_at: string
          date_commission: string
          dossiers_examines_count: number
          establishment_id: string
          id: string
          membres_presents: Json
          observations: string | null
          proces_verbal_url: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annee_scolaire?: string
          created_at?: string
          date_commission: string
          dossiers_examines_count?: number
          establishment_id: string
          id?: string
          membres_presents?: Json
          observations?: string | null
          proces_verbal_url?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annee_scolaire?: string
          created_at?: string
          date_commission?: string
          dossiers_examines_count?: number
          establishment_id?: string
          id?: string
          membres_presents?: Json
          observations?: string | null
          proces_verbal_url?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fs_commissions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_decisions: {
        Row: {
          annee_scolaire: string
          code_activite_opale: string
          commission_id: string | null
          compte_imputation_opale: string | null
          created_at: string
          date_decision: string
          date_mandatement: string | null
          decision_chef_etablissement_pdf_url: string | null
          eleve_id: string
          establishment_id: string
          id: string
          modalite_attribution: string
          modalite_versement: string
          montant: number
          motif: string
          nature_aide: string
          notification_famille_pdf_url: string | null
          numero_decision: string
          numero_mandat: string | null
          organisme_tiers_nom: string | null
          organisme_tiers_siret: string | null
          piece_comptable_pdf_url: string | null
          pieces_justificatives_urls: Json
          statut: string
          type_fonds: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annee_scolaire?: string
          code_activite_opale?: string
          commission_id?: string | null
          compte_imputation_opale?: string | null
          created_at?: string
          date_decision: string
          date_mandatement?: string | null
          decision_chef_etablissement_pdf_url?: string | null
          eleve_id: string
          establishment_id: string
          id?: string
          modalite_attribution: string
          modalite_versement: string
          montant: number
          motif?: string
          nature_aide: string
          notification_famille_pdf_url?: string | null
          numero_decision: string
          numero_mandat?: string | null
          organisme_tiers_nom?: string | null
          organisme_tiers_siret?: string | null
          piece_comptable_pdf_url?: string | null
          pieces_justificatives_urls?: Json
          statut?: string
          type_fonds: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annee_scolaire?: string
          code_activite_opale?: string
          commission_id?: string | null
          compte_imputation_opale?: string | null
          created_at?: string
          date_decision?: string
          date_mandatement?: string | null
          decision_chef_etablissement_pdf_url?: string | null
          eleve_id?: string
          establishment_id?: string
          id?: string
          modalite_attribution?: string
          modalite_versement?: string
          montant?: number
          motif?: string
          nature_aide?: string
          notification_famille_pdf_url?: string | null
          numero_decision?: string
          numero_mandat?: string | null
          organisme_tiers_nom?: string | null
          organisme_tiers_siret?: string | null
          piece_comptable_pdf_url?: string | null
          pieces_justificatives_urls?: Json
          statut?: string
          type_fonds?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fs_decisions_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "fs_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fs_decisions_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "fs_eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fs_decisions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_eleves: {
        Row: {
          actif: boolean
          adresse_postale: Json | null
          annee_scolaire: string
          classe: string
          created_at: string
          date_naissance: string | null
          demi_pensionnaire: boolean
          echelon_bourse: number | null
          establishment_id: string
          filiere: string | null
          id: string
          ine: string | null
          interne: boolean
          niveau: string | null
          nom: string
          prenom: string
          responsables_legaux: Json
          statut_boursier: boolean
          updated_at: string
          user_id: string
          voie: string
        }
        Insert: {
          actif?: boolean
          adresse_postale?: Json | null
          annee_scolaire?: string
          classe?: string
          created_at?: string
          date_naissance?: string | null
          demi_pensionnaire?: boolean
          echelon_bourse?: number | null
          establishment_id: string
          filiere?: string | null
          id?: string
          ine?: string | null
          interne?: boolean
          niveau?: string | null
          nom: string
          prenom: string
          responsables_legaux?: Json
          statut_boursier?: boolean
          updated_at?: string
          user_id: string
          voie?: string
        }
        Update: {
          actif?: boolean
          adresse_postale?: Json | null
          annee_scolaire?: string
          classe?: string
          created_at?: string
          date_naissance?: string | null
          demi_pensionnaire?: boolean
          echelon_bourse?: number | null
          establishment_id?: string
          filiere?: string | null
          id?: string
          ine?: string | null
          interne?: boolean
          niveau?: string | null
          nom?: string
          prenom?: string
          responsables_legaux?: Json
          statut_boursier?: boolean
          updated_at?: string
          user_id?: string
          voie?: string
        }
        Relationships: [
          {
            foreignKeyName: "fs_eleves_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_reliquats_ouverture: {
        Row: {
          annee_civile: number
          bop: string
          compte: string
          created_at: string
          establishment_id: string
          id: string
          libelle_dispositif: string | null
          montant: number
          nature: string | null
          user_id: string
        }
        Insert: {
          annee_civile: number
          bop: string
          compte: string
          created_at?: string
          establishment_id: string
          id?: string
          libelle_dispositif?: string | null
          montant: number
          nature?: string | null
          user_id: string
        }
        Update: {
          annee_civile?: number
          bop?: string
          compte?: string
          created_at?: string
          establishment_id?: string
          id?: string
          libelle_dispositif?: string | null
          montant?: number
          nature?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fs_reliquats_ouverture_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_subventions_rectorat: {
        Row: {
          annee_scolaire: string
          bop: string
          compte_imputation: string
          created_at: string
          date_notification: string | null
          date_versement_tresor: string
          est_avance_annee_suivante: boolean
          establishment_id: string
          id: string
          libelle_notification: string | null
          montant: number
          nature: string | null
          user_id: string
        }
        Insert: {
          annee_scolaire?: string
          bop: string
          compte_imputation: string
          created_at?: string
          date_notification?: string | null
          date_versement_tresor: string
          est_avance_annee_suivante?: boolean
          establishment_id: string
          id?: string
          libelle_notification?: string | null
          montant: number
          nature?: string | null
          user_id: string
        }
        Update: {
          annee_scolaire?: string
          bop?: string
          compte_imputation?: string
          created_at?: string
          date_notification?: string | null
          date_versement_tresor?: string
          est_avance_annee_suivante?: boolean
          establishment_id?: string
          id?: string
          libelle_notification?: string | null
          montant?: number
          nature?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fs_subventions_rectorat_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
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
      mp_familles_achat: {
        Row: {
          actif: boolean
          code: string
          created_at: string
          groupe: string
          id: string
          libelle: string
          ordre: number
          type_marche: string
        }
        Insert: {
          actif?: boolean
          code: string
          created_at?: string
          groupe?: string
          id?: string
          libelle: string
          ordre?: number
          type_marche: string
        }
        Update: {
          actif?: boolean
          code?: string
          created_at?: string
          groupe?: string
          id?: string
          libelle?: string
          ordre?: number
          type_marche?: string
        }
        Relationships: []
      }
      mp_fournisseurs: {
        Row: {
          actif: boolean
          adresse: string
          code_postal: string
          contact_email: string
          contact_nom: string
          contact_tel: string
          created_at: string
          establishment_id: string
          familles_principales: Json
          id: string
          notes: string
          raison_sociale: string
          siret: string | null
          updated_at: string
          user_id: string
          ville: string
        }
        Insert: {
          actif?: boolean
          adresse?: string
          code_postal?: string
          contact_email?: string
          contact_nom?: string
          contact_tel?: string
          created_at?: string
          establishment_id: string
          familles_principales?: Json
          id?: string
          notes?: string
          raison_sociale: string
          siret?: string | null
          updated_at?: string
          user_id: string
          ville?: string
        }
        Update: {
          actif?: boolean
          adresse?: string
          code_postal?: string
          contact_email?: string
          contact_nom?: string
          contact_tel?: string
          created_at?: string
          establishment_id?: string
          familles_principales?: Json
          id?: string
          notes?: string
          raison_sociale?: string
          siret?: string | null
          updated_at?: string
          user_id?: string
          ville?: string
        }
        Relationships: []
      }
      mp_marches: {
        Row: {
          allotissement: boolean
          base_legale: string
          chapitre_budgetaire: string
          checklist_validation: Json
          clauses_sociales: string
          code_activite: string
          compte_imputation: string
          contraintes: string
          created_at: string
          criteres: Json
          cumul_meme_famille_12m: number
          cumul_total_12m: number
          date_attribution: string | null
          date_emission_besoin: string
          date_engagement: string | null
          date_fin_execution: string | null
          date_livraison_souhaitee: string | null
          date_notification: string | null
          date_notification_cible: string | null
          demandeur: string
          description: string
          duree_mois: number
          establishment_id: string
          exigences_environnementales: string
          famille_code: string
          fournisseur_attributaire_id: string | null
          historique: Json
          id: string
          justification_lot_unique: string
          libelle: string
          methode_estimation: string
          methode_notation_prix: string
          montant_estime_ht: number
          montant_estime_ttc: number
          montant_realise: number
          montant_total_ht: number
          previsionnel_12m_suivants: number
          procedure_calculee: string
          quantites: string
          reconductions_duree_mois: number
          reconductions_nb: number
          reference_interne: string
          service_demandeur: string
          specifications: string
          statut: string
          taux_tva: number
          type_marche: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allotissement?: boolean
          base_legale?: string
          chapitre_budgetaire?: string
          checklist_validation?: Json
          clauses_sociales?: string
          code_activite?: string
          compte_imputation?: string
          contraintes?: string
          created_at?: string
          criteres?: Json
          cumul_meme_famille_12m?: number
          cumul_total_12m?: number
          date_attribution?: string | null
          date_emission_besoin: string
          date_engagement?: string | null
          date_fin_execution?: string | null
          date_livraison_souhaitee?: string | null
          date_notification?: string | null
          date_notification_cible?: string | null
          demandeur?: string
          description?: string
          duree_mois?: number
          establishment_id: string
          exigences_environnementales?: string
          famille_code?: string
          fournisseur_attributaire_id?: string | null
          historique?: Json
          id?: string
          justification_lot_unique?: string
          libelle: string
          methode_estimation?: string
          methode_notation_prix?: string
          montant_estime_ht?: number
          montant_estime_ttc?: number
          montant_realise?: number
          montant_total_ht?: number
          previsionnel_12m_suivants?: number
          procedure_calculee?: string
          quantites?: string
          reconductions_duree_mois?: number
          reconductions_nb?: number
          reference_interne: string
          service_demandeur?: string
          specifications?: string
          statut?: string
          taux_tva?: number
          type_marche: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allotissement?: boolean
          base_legale?: string
          chapitre_budgetaire?: string
          checklist_validation?: Json
          clauses_sociales?: string
          code_activite?: string
          compte_imputation?: string
          contraintes?: string
          created_at?: string
          criteres?: Json
          cumul_meme_famille_12m?: number
          cumul_total_12m?: number
          date_attribution?: string | null
          date_emission_besoin?: string
          date_engagement?: string | null
          date_fin_execution?: string | null
          date_livraison_souhaitee?: string | null
          date_notification?: string | null
          date_notification_cible?: string | null
          demandeur?: string
          description?: string
          duree_mois?: number
          establishment_id?: string
          exigences_environnementales?: string
          famille_code?: string
          fournisseur_attributaire_id?: string | null
          historique?: Json
          id?: string
          justification_lot_unique?: string
          libelle?: string
          methode_estimation?: string
          methode_notation_prix?: string
          montant_estime_ht?: number
          montant_estime_ttc?: number
          montant_realise?: number
          montant_total_ht?: number
          previsionnel_12m_suivants?: number
          procedure_calculee?: string
          quantites?: string
          reconductions_duree_mois?: number
          reconductions_nb?: number
          reference_interne?: string
          service_demandeur?: string
          specifications?: string
          statut?: string
          taux_tva?: number
          type_marche?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mp_marches_bdc: {
        Row: {
          created_at: string
          date_emission: string
          fournisseur_id: string | null
          id: string
          marche_id: string
          montant_ht: number
          montant_ttc: number
          numero: string
          observations: string
          statut: string
        }
        Insert: {
          created_at?: string
          date_emission: string
          fournisseur_id?: string | null
          id?: string
          marche_id: string
          montant_ht?: number
          montant_ttc?: number
          numero: string
          observations?: string
          statut?: string
        }
        Update: {
          created_at?: string
          date_emission?: string
          fournisseur_id?: string | null
          id?: string
          marche_id?: string
          montant_ht?: number
          montant_ttc?: number
          numero?: string
          observations?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_marches_bdc_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "mp_marches"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_marches_jalons: {
        Row: {
          created_at: string
          date_prevue: string
          date_realisee: string | null
          id: string
          libelle: string
          marche_id: string
          observations: string
          ordre: number
          responsable: string
          statut: string
        }
        Insert: {
          created_at?: string
          date_prevue: string
          date_realisee?: string | null
          id?: string
          libelle: string
          marche_id: string
          observations?: string
          ordre?: number
          responsable?: string
          statut?: string
        }
        Update: {
          created_at?: string
          date_prevue?: string
          date_realisee?: string | null
          id?: string
          libelle?: string
          marche_id?: string
          observations?: string
          ordre?: number
          responsable?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_marches_jalons_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "mp_marches"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_marches_lots: {
        Row: {
          created_at: string
          criteres: Json
          description: string
          fournisseur_attributaire_id: string | null
          id: string
          marche_id: string
          montant_attribue: number
          montant_estime_ht: number
          numero: number
          titre: string
        }
        Insert: {
          created_at?: string
          criteres?: Json
          description?: string
          fournisseur_attributaire_id?: string | null
          id?: string
          marche_id: string
          montant_attribue?: number
          montant_estime_ht?: number
          numero: number
          titre: string
        }
        Update: {
          created_at?: string
          criteres?: Json
          description?: string
          fournisseur_attributaire_id?: string | null
          id?: string
          marche_id?: string
          montant_attribue?: number
          montant_estime_ht?: number
          numero?: number
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_marches_lots_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "mp_marches"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_marches_pieces: {
        Row: {
          created_by: string | null
          generated_at: string
          id: string
          marche_id: string
          nom_fichier: string
          type_piece: string
          url_fichier: string | null
        }
        Insert: {
          created_by?: string | null
          generated_at?: string
          id?: string
          marche_id: string
          nom_fichier: string
          type_piece: string
          url_fichier?: string | null
        }
        Update: {
          created_by?: string | null
          generated_at?: string
          id?: string
          marche_id?: string
          nom_fichier?: string
          type_piece?: string
          url_fichier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mp_marches_pieces_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "mp_marches"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_seuils_ccp: {
        Row: {
          base_legale: string
          commentaire: string
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string | null
          id: string
          seuil_dispense: number
          seuil_formalisee: number
          seuil_mapa_publicite: number | null
          seuil_petits_lots: number | null
          seuil_profil_acheteur: number | null
          type_marche: string
          updated_at: string
        }
        Insert: {
          base_legale?: string
          commentaire?: string
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin?: string | null
          id?: string
          seuil_dispense: number
          seuil_formalisee: number
          seuil_mapa_publicite?: number | null
          seuil_petits_lots?: number | null
          seuil_profil_acheteur?: number | null
          type_marche: string
          updated_at?: string
        }
        Update: {
          base_legale?: string
          commentaire?: string
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string | null
          id?: string
          seuil_dispense?: number
          seuil_formalisee?: number
          seuil_mapa_publicite?: number | null
          seuil_petits_lots?: number | null
          seuil_profil_acheteur?: number | null
          type_marche?: string
          updated_at?: string
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
      voyage_marches_alertes: {
        Row: {
          categorie: string
          created_at: string
          establishment_id: string
          exercice: number
          id: string
          montant_cumule_ht: number
          notifie: boolean
          procedure_requise: string
          seuil_atteint: string
        }
        Insert: {
          categorie: string
          created_at?: string
          establishment_id: string
          exercice: number
          id?: string
          montant_cumule_ht?: number
          notifie?: boolean
          procedure_requise: string
          seuil_atteint: string
        }
        Update: {
          categorie?: string
          created_at?: string
          establishment_id?: string
          exercice?: number
          id?: string
          montant_cumule_ht?: number
          notifie?: boolean
          procedure_requise?: string
          seuil_atteint?: string
        }
        Relationships: [
          {
            foreignKeyName: "voyage_marches_alertes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      voyage_paiements: {
        Row: {
          created_at: string
          date_paiement: string
          encaisse: boolean
          fonds_social: boolean
          id: string
          mode: string
          montant: number
          observations: string | null
          participant_id: string
          reference: string | null
          voyage_id: string
        }
        Insert: {
          created_at?: string
          date_paiement?: string
          encaisse?: boolean
          fonds_social?: boolean
          id?: string
          mode?: string
          montant?: number
          observations?: string | null
          participant_id: string
          reference?: string | null
          voyage_id: string
        }
        Update: {
          created_at?: string
          date_paiement?: string
          encaisse?: boolean
          fonds_social?: boolean
          id?: string
          mode?: string
          montant?: number
          observations?: string | null
          participant_id?: string
          reference?: string | null
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voyage_paiements_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "voyage_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voyage_paiements_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      voyage_participants: {
        Row: {
          assurance_rc: boolean
          autorisation_parentale: boolean
          classe: string
          created_at: string
          date_inscription: string | null
          email_responsable: string | null
          fiche_sanitaire: boolean
          id: string
          nom: string
          participation_due: number
          passeport: boolean
          prenom: string
          regime: string
          responsable: string | null
          tel_responsable: string | null
          voyage_id: string
        }
        Insert: {
          assurance_rc?: boolean
          autorisation_parentale?: boolean
          classe?: string
          created_at?: string
          date_inscription?: string | null
          email_responsable?: string | null
          fiche_sanitaire?: boolean
          id?: string
          nom: string
          participation_due?: number
          passeport?: boolean
          prenom: string
          regime?: string
          responsable?: string | null
          tel_responsable?: string | null
          voyage_id: string
        }
        Update: {
          assurance_rc?: boolean
          autorisation_parentale?: boolean
          classe?: string
          created_at?: string
          date_inscription?: string | null
          email_responsable?: string | null
          fiche_sanitaire?: boolean
          id?: string
          nom?: string
          participation_due?: number
          passeport?: boolean
          prenom?: string
          regime?: string
          responsable?: string | null
          tel_responsable?: string | null
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voyage_participants_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      voyage_templates: {
        Row: {
          activites: number
          assurance: number
          autofinancement: number
          classe: string | null
          code_activite_gfc: string | null
          compte_classe7: string | null
          created_at: string
          description: string | null
          destination: string
          divers: number
          domaine: string | null
          echeances: Json | null
          establishment_id: string
          hebergement: number
          id: string
          nb_accompagnateurs: number
          nb_eleves: number
          nom: string
          objectif_pedagogique: string | null
          participation_familles: number
          pays: string
          regie_avances: number
          restauration: number
          service_ap: string | null
          subvention_autre: number
          subvention_collectivite: number
          subvention_etat: number
          transport: number
          transport_type: string | null
          type_voyage: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activites?: number
          assurance?: number
          autofinancement?: number
          classe?: string | null
          code_activite_gfc?: string | null
          compte_classe7?: string | null
          created_at?: string
          description?: string | null
          destination?: string
          divers?: number
          domaine?: string | null
          echeances?: Json | null
          establishment_id: string
          hebergement?: number
          id?: string
          nb_accompagnateurs?: number
          nb_eleves?: number
          nom: string
          objectif_pedagogique?: string | null
          participation_familles?: number
          pays?: string
          regie_avances?: number
          restauration?: number
          service_ap?: string | null
          subvention_autre?: number
          subvention_collectivite?: number
          subvention_etat?: number
          transport?: number
          transport_type?: string | null
          type_voyage?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activites?: number
          assurance?: number
          autofinancement?: number
          classe?: string | null
          code_activite_gfc?: string | null
          compte_classe7?: string | null
          created_at?: string
          description?: string | null
          destination?: string
          divers?: number
          domaine?: string | null
          echeances?: Json | null
          establishment_id?: string
          hebergement?: number
          id?: string
          nb_accompagnateurs?: number
          nb_eleves?: number
          nom?: string
          objectif_pedagogique?: string | null
          participation_familles?: number
          pays?: string
          regie_avances?: number
          restauration?: number
          service_ap?: string | null
          subvention_autre?: number
          subvention_collectivite?: number
          subvention_etat?: number
          transport?: number
          transport_type?: string | null
          type_voyage?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voyage_templates_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      voyages: {
        Row: {
          activites: number
          assurance: number
          autofinancement: number
          budget_total: number
          charge_etablissement: number
          classe: string
          code_activite_gfc: string | null
          contact_urgence: string | null
          created_at: string
          date_depart: string
          date_limite_inscription: string | null
          date_retour: string
          date_validation: string | null
          date_vote_ca: string | null
          destination: string
          divers: number
          establishment_id: string
          hebergement: number
          horaires_depart: string | null
          horaires_retour: string | null
          id: string
          intitule: string | null
          lieu_depart: string | null
          moyen_transport: string | null
          nb_accompagnateurs: number
          nb_eleves: number
          objectif_pedagogique: string | null
          observations: string | null
          participation_familles: number
          pays: string
          professeur: string
          regie_avances: number
          restauration: number
          statut: string
          subvention_autre: number
          subvention_collectivite: number
          subvention_etat: number
          subventions: number
          tel_urgence: string | null
          transport: number
          transport_type: string | null
          type_hebergement: string | null
          type_voyage: string | null
          updated_at: string
          user_id: string
          validateur_id: string | null
          version_statut: string
        }
        Insert: {
          activites?: number
          assurance?: number
          autofinancement?: number
          budget_total?: number
          charge_etablissement?: number
          classe?: string
          code_activite_gfc?: string | null
          contact_urgence?: string | null
          created_at?: string
          date_depart: string
          date_limite_inscription?: string | null
          date_retour: string
          date_validation?: string | null
          date_vote_ca?: string | null
          destination: string
          divers?: number
          establishment_id: string
          hebergement?: number
          horaires_depart?: string | null
          horaires_retour?: string | null
          id?: string
          intitule?: string | null
          lieu_depart?: string | null
          moyen_transport?: string | null
          nb_accompagnateurs?: number
          nb_eleves?: number
          objectif_pedagogique?: string | null
          observations?: string | null
          participation_familles?: number
          pays?: string
          professeur?: string
          regie_avances?: number
          restauration?: number
          statut?: string
          subvention_autre?: number
          subvention_collectivite?: number
          subvention_etat?: number
          subventions?: number
          tel_urgence?: string | null
          transport?: number
          transport_type?: string | null
          type_hebergement?: string | null
          type_voyage?: string | null
          updated_at?: string
          user_id: string
          validateur_id?: string | null
          version_statut?: string
        }
        Update: {
          activites?: number
          assurance?: number
          autofinancement?: number
          budget_total?: number
          charge_etablissement?: number
          classe?: string
          code_activite_gfc?: string | null
          contact_urgence?: string | null
          created_at?: string
          date_depart?: string
          date_limite_inscription?: string | null
          date_retour?: string
          date_validation?: string | null
          date_vote_ca?: string | null
          destination?: string
          divers?: number
          establishment_id?: string
          hebergement?: number
          horaires_depart?: string | null
          horaires_retour?: string | null
          id?: string
          intitule?: string | null
          lieu_depart?: string | null
          moyen_transport?: string | null
          nb_accompagnateurs?: number
          nb_eleves?: number
          objectif_pedagogique?: string | null
          observations?: string | null
          participation_familles?: number
          pays?: string
          professeur?: string
          regie_avances?: number
          restauration?: number
          statut?: string
          subvention_autre?: number
          subvention_collectivite?: number
          subvention_etat?: number
          subventions?: number
          tel_urgence?: string | null
          transport?: number
          transport_type?: string | null
          type_hebergement?: string | null
          type_voyage?: string | null
          updated_at?: string
          user_id?: string
          validateur_id?: string | null
          version_statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "voyages_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_enquete_q10: {
        Row: {
          annee: number | null
          annee_scolaire: string | null
          beneficiaires_aide_directe: number | null
          beneficiaires_via_tiers: number | null
          establishment_id: string | null
          montant_aide_directe: number | null
          montant_via_tiers: number | null
          nature_aide: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_decisions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_enquete_q11: {
        Row: {
          annee: number | null
          annee_scolaire: string | null
          beneficiaires: number | null
          boursiers: number | null
          depenses: number | null
          depenses_boursiers: number | null
          establishment_id: string | null
          type_fonds: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_decisions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_enquete_q15: {
        Row: {
          annee: number | null
          annee_scolaire: string | null
          establishment_id: string | null
          nb_commission: number | null
          nb_urgence: number | null
          pourcentage_urgence: number | null
          total_decisions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_decisions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_enquete_q7: {
        Row: {
          annee: number | null
          annee_scolaire: string | null
          beneficiaires: number | null
          boursiers: number | null
          depenses: number | null
          depenses_boursiers: number | null
          establishment_id: string | null
          type_fonds: string | null
          voie: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_decisions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_enquete_q8: {
        Row: {
          annee: number | null
          annee_scolaire: string | null
          beneficiaires_uniques: number | null
          boursiers_uniques: number | null
          establishment_id: string | null
          voie: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_decisions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_create_establishment_with_uai: {
        Args: { _uai: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_unclaimed_establishment: {
        Args: { _establishment_id: string }
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
