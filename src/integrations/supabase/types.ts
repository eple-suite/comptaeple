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
      accreditations_chefs_etablissement: {
        Row: {
          ac_validateur_id: string | null
          accreditation_drfip_pdf_url: string | null
          arrete_affectation_pdf_url: string | null
          bordereau_drfip_url: string | null
          chef_etablissement_id: string | null
          chef_etablissement_nom: string | null
          coordonnees_pro: Json
          created_at: string
          created_by: string | null
          date_arrete_affectation: string | null
          date_expiration_conservation: string | null
          date_prise_fonction: string | null
          date_transmission_drfip: string | null
          date_validation_ac: string | null
          delegations_signature: Json
          establishment_id: string
          id: string
          numero_arrete: string | null
          observations: string | null
          piece_identite_chiffree: boolean
          piece_identite_pdf_url: string | null
          specimen_signature_url: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          ac_validateur_id?: string | null
          accreditation_drfip_pdf_url?: string | null
          arrete_affectation_pdf_url?: string | null
          bordereau_drfip_url?: string | null
          chef_etablissement_id?: string | null
          chef_etablissement_nom?: string | null
          coordonnees_pro?: Json
          created_at?: string
          created_by?: string | null
          date_arrete_affectation?: string | null
          date_expiration_conservation?: string | null
          date_prise_fonction?: string | null
          date_transmission_drfip?: string | null
          date_validation_ac?: string | null
          delegations_signature?: Json
          establishment_id: string
          id?: string
          numero_arrete?: string | null
          observations?: string | null
          piece_identite_chiffree?: boolean
          piece_identite_pdf_url?: string | null
          specimen_signature_url?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          ac_validateur_id?: string | null
          accreditation_drfip_pdf_url?: string | null
          arrete_affectation_pdf_url?: string | null
          bordereau_drfip_url?: string | null
          chef_etablissement_id?: string | null
          chef_etablissement_nom?: string | null
          coordonnees_pro?: Json
          created_at?: string
          created_by?: string | null
          date_arrete_affectation?: string | null
          date_expiration_conservation?: string | null
          date_prise_fonction?: string | null
          date_transmission_drfip?: string | null
          date_validation_ac?: string | null
          delegations_signature?: Json
          establishment_id?: string
          id?: string
          numero_arrete?: string | null
          observations?: string | null
          piece_identite_chiffree?: boolean
          piece_identite_pdf_url?: string | null
          specimen_signature_url?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          actif: boolean
          administration_origine: string | null
          bureau: string | null
          categorie: Database["public"]["Enums"]["agent_categorie"] | null
          cia_dernier_montant: number | null
          civilite: Database["public"]["Enums"]["civilite"] | null
          corps: string | null
          created_at: string
          date_derniere_promotion: string | null
          date_effective_fin_fonction: string | null
          date_entree_corps: string | null
          date_entree_etablissement: string | null
          date_naissance: string | null
          date_prevue_fin_fonction: string | null
          delegation_signature: boolean | null
          delegation_signature_acte_url: string | null
          echelon: number | null
          email: string | null
          email_professionnel: string | null
          establishment_id: string
          etablissements_affectation: string[] | null
          fiche_poste_id: string | null
          filiere: Database["public"]["Enums"]["agent_filiere"] | null
          fonction: string | null
          grade: string | null
          id: string
          indice: number | null
          indice_majore: number | null
          lieu_naissance: string | null
          matricule_education_nationale: string | null
          matricule_etablissement: string | null
          montant_ifse_mensuel: number | null
          n_plus_deux_id: string | null
          n_plus_un_id: string | null
          n1_user_id: string | null
          n2_user_id: string | null
          nationalite: string | null
          nom: string
          nom_naissance: string | null
          nom_usage: string | null
          notes_rh: string | null
          photo_url: string | null
          prenom: string
          prenoms_secondaires: string | null
          profil_opale: Database["public"]["Enums"]["profil_opale"] | null
          profils_autres: Json | null
          quotite_travail: number | null
          rifseeup_groupe: string | null
          role_principal:
            | Database["public"]["Enums"]["agent_role_principal"]
            | null
          roles_secondaires: string[] | null
          service: string | null
          statut: Database["public"]["Enums"]["agent_statut"]
          telephone_professionnel: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          administration_origine?: string | null
          bureau?: string | null
          categorie?: Database["public"]["Enums"]["agent_categorie"] | null
          cia_dernier_montant?: number | null
          civilite?: Database["public"]["Enums"]["civilite"] | null
          corps?: string | null
          created_at?: string
          date_derniere_promotion?: string | null
          date_effective_fin_fonction?: string | null
          date_entree_corps?: string | null
          date_entree_etablissement?: string | null
          date_naissance?: string | null
          date_prevue_fin_fonction?: string | null
          delegation_signature?: boolean | null
          delegation_signature_acte_url?: string | null
          echelon?: number | null
          email?: string | null
          email_professionnel?: string | null
          establishment_id: string
          etablissements_affectation?: string[] | null
          fiche_poste_id?: string | null
          filiere?: Database["public"]["Enums"]["agent_filiere"] | null
          fonction?: string | null
          grade?: string | null
          id?: string
          indice?: number | null
          indice_majore?: number | null
          lieu_naissance?: string | null
          matricule_education_nationale?: string | null
          matricule_etablissement?: string | null
          montant_ifse_mensuel?: number | null
          n_plus_deux_id?: string | null
          n_plus_un_id?: string | null
          n1_user_id?: string | null
          n2_user_id?: string | null
          nationalite?: string | null
          nom: string
          nom_naissance?: string | null
          nom_usage?: string | null
          notes_rh?: string | null
          photo_url?: string | null
          prenom: string
          prenoms_secondaires?: string | null
          profil_opale?: Database["public"]["Enums"]["profil_opale"] | null
          profils_autres?: Json | null
          quotite_travail?: number | null
          rifseeup_groupe?: string | null
          role_principal?:
            | Database["public"]["Enums"]["agent_role_principal"]
            | null
          roles_secondaires?: string[] | null
          service?: string | null
          statut?: Database["public"]["Enums"]["agent_statut"]
          telephone_professionnel?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          administration_origine?: string | null
          bureau?: string | null
          categorie?: Database["public"]["Enums"]["agent_categorie"] | null
          cia_dernier_montant?: number | null
          civilite?: Database["public"]["Enums"]["civilite"] | null
          corps?: string | null
          created_at?: string
          date_derniere_promotion?: string | null
          date_effective_fin_fonction?: string | null
          date_entree_corps?: string | null
          date_entree_etablissement?: string | null
          date_naissance?: string | null
          date_prevue_fin_fonction?: string | null
          delegation_signature?: boolean | null
          delegation_signature_acte_url?: string | null
          echelon?: number | null
          email?: string | null
          email_professionnel?: string | null
          establishment_id?: string
          etablissements_affectation?: string[] | null
          fiche_poste_id?: string | null
          filiere?: Database["public"]["Enums"]["agent_filiere"] | null
          fonction?: string | null
          grade?: string | null
          id?: string
          indice?: number | null
          indice_majore?: number | null
          lieu_naissance?: string | null
          matricule_education_nationale?: string | null
          matricule_etablissement?: string | null
          montant_ifse_mensuel?: number | null
          n_plus_deux_id?: string | null
          n_plus_un_id?: string | null
          n1_user_id?: string | null
          n2_user_id?: string | null
          nationalite?: string | null
          nom?: string
          nom_naissance?: string | null
          nom_usage?: string | null
          notes_rh?: string | null
          photo_url?: string | null
          prenom?: string
          prenoms_secondaires?: string | null
          profil_opale?: Database["public"]["Enums"]["profil_opale"] | null
          profils_autres?: Json | null
          quotite_travail?: number | null
          rifseeup_groupe?: string | null
          role_principal?:
            | Database["public"]["Enums"]["agent_role_principal"]
            | null
          roles_secondaires?: string[] | null
          service?: string | null
          statut?: Database["public"]["Enums"]["agent_statut"]
          telephone_professionnel?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_n_plus_deux_id_fkey"
            columns: ["n_plus_deux_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_n_plus_un_id_fkey"
            columns: ["n_plus_un_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agents_fiche_poste"
            columns: ["fiche_poste_id"]
            isOneToOne: false
            referencedRelation: "entretiens_fiches_poste"
            referencedColumns: ["id"]
          },
        ]
      }
      aide_articles: {
        Row: {
          contenu_md: string
          created_at: string
          date_maj: string
          id: string
          module: string
          niveau: string
          ordre: number
          references_legales: Json
          resume: string | null
          slug: string
          source_canonique: boolean
          tags: string[]
          titre: string
          version: string
        }
        Insert: {
          contenu_md: string
          created_at?: string
          date_maj?: string
          id?: string
          module: string
          niveau: string
          ordre?: number
          references_legales?: Json
          resume?: string | null
          slug: string
          source_canonique?: boolean
          tags?: string[]
          titre: string
          version?: string
        }
        Update: {
          contenu_md?: string
          created_at?: string
          date_maj?: string
          id?: string
          module?: string
          niveau?: string
          ordre?: number
          references_legales?: Json
          resume?: string | null
          slug?: string
          source_canonique?: boolean
          tags?: string[]
          titre?: string
          version?: string
        }
        Relationships: []
      }
      aide_faq: {
        Row: {
          created_at: string
          frequence: number
          id: string
          module: string
          question: string
          reponse: string
          tags: string[]
        }
        Insert: {
          created_at?: string
          frequence?: number
          id?: string
          module: string
          question: string
          reponse: string
          tags?: string[]
        }
        Update: {
          created_at?: string
          frequence?: number
          id?: string
          module?: string
          question?: string
          reponse?: string
          tags?: string[]
        }
        Relationships: []
      }
      aide_glossaire: {
        Row: {
          acronyme: string | null
          created_at: string
          definition: string
          id: string
          modules: string[]
          references_legales: Json
          terme: string
          updated_at: string
          voir_aussi: string[]
        }
        Insert: {
          acronyme?: string | null
          created_at?: string
          definition: string
          id?: string
          modules?: string[]
          references_legales?: Json
          terme: string
          updated_at?: string
          voir_aussi?: string[]
        }
        Update: {
          acronyme?: string | null
          created_at?: string
          definition?: string
          id?: string
          modules?: string[]
          references_legales?: Json
          terme?: string
          updated_at?: string
          voir_aussi?: string[]
        }
        Relationships: []
      }
      aide_modeles: {
        Row: {
          created_at: string
          description: string | null
          destinataire: string | null
          fichier_url: string | null
          id: string
          module: string
          nom: string
          references_legales: Json
          tags: string[]
          type_doc: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          destinataire?: string | null
          fichier_url?: string | null
          id?: string
          module: string
          nom: string
          references_legales?: Json
          tags?: string[]
          type_doc: string
        }
        Update: {
          created_at?: string
          description?: string | null
          destinataire?: string | null
          fichier_url?: string | null
          id?: string
          module?: string
          nom?: string
          references_legales?: Json
          tags?: string[]
          type_doc?: string
        }
        Relationships: []
      }
      aide_onboarding_progress: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string | null
          etape_courante: number
          etapes_completes: number[]
          id: string
          parcours: string
          termine: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          etape_courante?: number
          etapes_completes?: number[]
          id?: string
          parcours: string
          termine?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          etape_courante?: number
          etapes_completes?: number[]
          id?: string
          parcours?: string
          termine?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alertes_transverses: {
        Row: {
          action_url: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          dedup_key: string | null
          description: string | null
          echeance: string | null
          establishment_id: string | null
          id: string
          module_origine: string
          niveau: string
          reference_reglementaire: string | null
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          dedup_key?: string | null
          description?: string | null
          echeance?: string | null
          establishment_id?: string | null
          id?: string
          module_origine: string
          niveau: string
          reference_reglementaire?: string | null
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          dedup_key?: string | null
          description?: string | null
          echeance?: string | null
          establishment_id?: string | null
          id?: string
          module_origine?: string
          niveau?: string
          reference_reglementaire?: string | null
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertes_transverses_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      arretes_actes: {
        Row: {
          agent_concerne_id: string | null
          contenu_hash: string | null
          created_at: string
          created_by: string | null
          date_effet: string | null
          date_fin_effet: string | null
          date_signature: string
          establishment_id: string | null
          groupement_id: string | null
          id: string
          payload: Json | null
          pdf_url: string | null
          references_reglementaires: string | null
          signataire_id: string | null
          statut: string | null
          type: Database["public"]["Enums"]["acte_type"]
          updated_at: string
        }
        Insert: {
          agent_concerne_id?: string | null
          contenu_hash?: string | null
          created_at?: string
          created_by?: string | null
          date_effet?: string | null
          date_fin_effet?: string | null
          date_signature: string
          establishment_id?: string | null
          groupement_id?: string | null
          id?: string
          payload?: Json | null
          pdf_url?: string | null
          references_reglementaires?: string | null
          signataire_id?: string | null
          statut?: string | null
          type: Database["public"]["Enums"]["acte_type"]
          updated_at?: string
        }
        Update: {
          agent_concerne_id?: string | null
          contenu_hash?: string | null
          created_at?: string
          created_by?: string | null
          date_effet?: string | null
          date_fin_effet?: string | null
          date_signature?: string
          establishment_id?: string | null
          groupement_id?: string | null
          id?: string
          payload?: Json | null
          pdf_url?: string | null
          references_reglementaires?: string | null
          signataire_id?: string | null
          statut?: string | null
          type?: Database["public"]["Enums"]["acte_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arretes_actes_agent_concerne_id_fkey"
            columns: ["agent_concerne_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arretes_actes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arretes_actes_groupement_id_fkey"
            columns: ["groupement_id"]
            isOneToOne: false
            referencedRelation: "groupements_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arretes_actes_signataire_id_fkey"
            columns: ["signataire_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversations: {
        Row: {
          archived: boolean
          context_establishment_id: string | null
          context_module: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          context_establishment_id?: string | null
          context_module?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          context_establishment_id?: string | null
          context_module?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          sources: Json | null
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          sources?: Json | null
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_drilldown_notes: {
        Row: {
          analysed: boolean
          commentaire: string
          compte: string
          created_at: string
          establishment_id: string
          id: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          analysed?: boolean
          commentaire?: string
          compte: string
          created_at?: string
          establishment_id: string
          id?: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          analysed?: boolean
          commentaire?: string
          compte?: string
          created_at?: string
          establishment_id?: string
          id?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "balance_drilldown_notes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_parametres_periode: {
        Row: {
          alertes_actives: boolean
          created_at: string
          date_cloture: string | null
          establishment_id: string
          id: string
          type_periode: string
          updated_at: string
        }
        Insert: {
          alertes_actives?: boolean
          created_at?: string
          date_cloture?: string | null
          establishment_id: string
          id?: string
          type_periode?: string
          updated_at?: string
        }
        Update: {
          alertes_actives?: boolean
          created_at?: string
          date_cloture?: string | null
          establishment_id?: string
          id?: string
          type_periode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_parametres_periode_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
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
      bottin_institutionnel: {
        Row: {
          actif: boolean
          adresse: string | null
          categorie: Database["public"]["Enums"]["bottin_categorie"]
          correspondant_nom: string | null
          created_at: string
          email: string | null
          fonction: string | null
          groupement_id: string | null
          id: string
          notes: string | null
          organisme: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          categorie: Database["public"]["Enums"]["bottin_categorie"]
          correspondant_nom?: string | null
          created_at?: string
          email?: string | null
          fonction?: string | null
          groupement_id?: string | null
          id?: string
          notes?: string | null
          organisme: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          categorie?: Database["public"]["Enums"]["bottin_categorie"]
          correspondant_nom?: string | null
          created_at?: string
          email?: string | null
          fonction?: string | null
          groupement_id?: string | null
          id?: string
          notes?: string | null
          organisme?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bottin_institutionnel_groupement_id_fkey"
            columns: ["groupement_id"]
            isOneToOne: false
            referencedRelation: "groupements_comptables"
            referencedColumns: ["id"]
          },
        ]
      }
      cockpit_jalons_perso: {
        Row: {
          couleur: string
          created_at: string
          date_jalon: string
          description: string | null
          establishment_id: string | null
          id: string
          titre: string
          user_id: string
        }
        Insert: {
          couleur?: string
          created_at?: string
          date_jalon: string
          description?: string | null
          establishment_id?: string | null
          id?: string
          titre: string
          user_id: string
        }
        Update: {
          couleur?: string
          created_at?: string
          date_jalon?: string
          description?: string | null
          establishment_id?: string | null
          id?: string
          titre?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cockpit_jalons_perso_establishment_id_fkey"
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
      comptes_sens_normal_ref: {
        Row: {
          actif: boolean
          action_corrective: string
          cause_probable: string
          classe: number
          compte: string
          created_at: string
          despecialisable: boolean
          libelle: string
          message_alerte: string
          niveau_alerte_si_anormal: string
          reference_m96: string
          sens_cloture: string
          sens_normal: string
          sous_classe: string
          type_compte: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          action_corrective?: string
          cause_probable?: string
          classe: number
          compte: string
          created_at?: string
          despecialisable?: boolean
          libelle: string
          message_alerte?: string
          niveau_alerte_si_anormal?: string
          reference_m96?: string
          sens_cloture: string
          sens_normal: string
          sous_classe: string
          type_compte: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          action_corrective?: string
          cause_probable?: string
          classe?: number
          compte?: string
          created_at?: string
          despecialisable?: boolean
          libelle?: string
          message_alerte?: string
          niveau_alerte_si_anormal?: string
          reference_m96?: string
          sens_cloture?: string
          sens_normal?: string
          sous_classe?: string
          type_compte?: string
          updated_at?: string
        }
        Relationships: []
      }
      delegations_signature: {
        Row: {
          agent_delegant_id: string
          agent_delegataire_id: string
          arrete_url: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          establishment_id: string | null
          id: string
          montant_max: number | null
          motif_abrogation: string | null
          perimetre: string | null
          statut: Database["public"]["Enums"]["delegation_statut"]
          type_delegation: Database["public"]["Enums"]["delegation_type"]
          updated_at: string
        }
        Insert: {
          agent_delegant_id: string
          agent_delegataire_id: string
          arrete_url?: string | null
          created_at?: string
          date_debut: string
          date_fin?: string | null
          establishment_id?: string | null
          id?: string
          montant_max?: number | null
          motif_abrogation?: string | null
          perimetre?: string | null
          statut?: Database["public"]["Enums"]["delegation_statut"]
          type_delegation: Database["public"]["Enums"]["delegation_type"]
          updated_at?: string
        }
        Update: {
          agent_delegant_id?: string
          agent_delegataire_id?: string
          arrete_url?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          establishment_id?: string | null
          id?: string
          montant_max?: number | null
          motif_abrogation?: string | null
          perimetre?: string | null
          statut?: Database["public"]["Enums"]["delegation_statut"]
          type_delegation?: Database["public"]["Enums"]["delegation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegations_signature_agent_delegant_id_fkey"
            columns: ["agent_delegant_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_signature_agent_delegataire_id_fkey"
            columns: ["agent_delegataire_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_signature_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      enquetes_campagnes: {
        Row: {
          created_at: string
          cree_par: string | null
          date_echeance: string
          date_lancement: string
          description: string | null
          id: string
          intitule: string
          origine: string
          perimetre_etablissement_ids: string[]
          periode_concernee: string | null
          statut: string
          type_enquete: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cree_par?: string | null
          date_echeance: string
          date_lancement?: string
          description?: string | null
          id?: string
          intitule: string
          origine?: string
          perimetre_etablissement_ids?: string[]
          periode_concernee?: string | null
          statut?: string
          type_enquete: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cree_par?: string | null
          date_echeance?: string
          date_lancement?: string
          description?: string | null
          id?: string
          intitule?: string
          origine?: string
          perimetre_etablissement_ids?: string[]
          periode_concernee?: string | null
          statut?: string
          type_enquete?: string
          updated_at?: string
        }
        Relationships: []
      }
      enquetes_referentiel_comptes: {
        Row: {
          actif: boolean
          commentaire_reglementaire: string | null
          compte: string
          created_at: string
          despecialisable: boolean
          financeur_type: string
          id: string
          libelle: string
          niveau_alerte_si_anormal: string
          programme_bop: string | null
          racine_famille: string
          reference_reglementaire: string | null
          sens_solde_normal: string
          sous_programme: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          commentaire_reglementaire?: string | null
          compte: string
          created_at?: string
          despecialisable?: boolean
          financeur_type: string
          id?: string
          libelle: string
          niveau_alerte_si_anormal?: string
          programme_bop?: string | null
          racine_famille: string
          reference_reglementaire?: string | null
          sens_solde_normal: string
          sous_programme?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          commentaire_reglementaire?: string | null
          compte?: string
          created_at?: string
          despecialisable?: boolean
          financeur_type?: string
          id?: string
          libelle?: string
          niveau_alerte_si_anormal?: string
          programme_bop?: string | null
          racine_famille?: string
          reference_reglementaire?: string | null
          sens_solde_normal?: string
          sous_programme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      enquetes_reponses_eple: {
        Row: {
          campagne_id: string
          commentaires_ac: string | null
          commentaires_rectorat: string | null
          created_at: string
          created_by: string | null
          donnees: Json
          establishment_id: string
          id: string
          signataire_ac: string | null
          signataire_ordo: string | null
          soumise_le: string | null
          statut: string
          updated_at: string
          validee_le: string | null
        }
        Insert: {
          campagne_id: string
          commentaires_ac?: string | null
          commentaires_rectorat?: string | null
          created_at?: string
          created_by?: string | null
          donnees?: Json
          establishment_id: string
          id?: string
          signataire_ac?: string | null
          signataire_ordo?: string | null
          soumise_le?: string | null
          statut?: string
          updated_at?: string
          validee_le?: string | null
        }
        Update: {
          campagne_id?: string
          commentaires_ac?: string | null
          commentaires_rectorat?: string | null
          created_at?: string
          created_by?: string | null
          donnees?: Json
          establishment_id?: string
          id?: string
          signataire_ac?: string | null
          signataire_ordo?: string | null
          soumise_le?: string | null
          statut?: string
          updated_at?: string
          validee_le?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquetes_reponses_eple_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "enquetes_campagnes"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_acces_log: {
        Row: {
          consultant_user_id: string
          created_at: string
          entretien_id: string
          id: string
          ip_address: string | null
          notes: string | null
          type_acces: string
          user_agent: string | null
        }
        Insert: {
          consultant_user_id: string
          created_at?: string
          entretien_id: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          type_acces: string
          user_agent?: string | null
        }
        Update: {
          consultant_user_id?: string
          created_at?: string
          entretien_id?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          type_acces?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_acces_log_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: false
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_campagnes: {
        Row: {
          annee_scolaire: string
          consignes_locales: string | null
          created_at: string
          created_by: string | null
          date_butoir_signatures: string | null
          date_cloture: string | null
          date_ouverture: string | null
          establishment_id: string
          id: string
          libelle: string | null
          statut: Database["public"]["Enums"]["entretien_campagne_statut"]
          updated_at: string
        }
        Insert: {
          annee_scolaire: string
          consignes_locales?: string | null
          created_at?: string
          created_by?: string | null
          date_butoir_signatures?: string | null
          date_cloture?: string | null
          date_ouverture?: string | null
          establishment_id: string
          id?: string
          libelle?: string | null
          statut?: Database["public"]["Enums"]["entretien_campagne_statut"]
          updated_at?: string
        }
        Update: {
          annee_scolaire?: string
          consignes_locales?: string | null
          created_at?: string
          created_by?: string | null
          date_butoir_signatures?: string | null
          date_cloture?: string | null
          date_ouverture?: string | null
          establishment_id?: string
          id?: string
          libelle?: string | null
          statut?: Database["public"]["Enums"]["entretien_campagne_statut"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_campagnes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_competences: {
        Row: {
          commentaire: string | null
          confiance_ia: string | null
          created_at: string
          entretien_id: string
          extrait_source: string | null
          id: string
          niveau: Database["public"]["Enums"]["competence_niveau"] | null
          ordre: number
          rubrique: string
          sous_critere: string
        }
        Insert: {
          commentaire?: string | null
          confiance_ia?: string | null
          created_at?: string
          entretien_id: string
          extrait_source?: string | null
          id?: string
          niveau?: Database["public"]["Enums"]["competence_niveau"] | null
          ordre?: number
          rubrique: string
          sous_critere: string
        }
        Update: {
          commentaire?: string | null
          confiance_ia?: string | null
          created_at?: string
          entretien_id?: string
          extrait_source?: string | null
          id?: string
          niveau?: Database["public"]["Enums"]["competence_niveau"] | null
          ordre?: number
          rubrique?: string
          sous_critere?: string
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_competences_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: false
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_etat_log: {
        Row: {
          ancien_statut: string | null
          commentaire: string | null
          created_at: string
          entretien_id: string
          id: string
          ip_address: string | null
          nouveau_statut: string
          user_agent: string | null
          user_id: string
          user_role: string | null
        }
        Insert: {
          ancien_statut?: string | null
          commentaire?: string | null
          created_at?: string
          entretien_id: string
          id?: string
          ip_address?: string | null
          nouveau_statut: string
          user_agent?: string | null
          user_id: string
          user_role?: string | null
        }
        Update: {
          ancien_statut?: string | null
          commentaire?: string | null
          created_at?: string
          entretien_id?: string
          id?: string
          ip_address?: string | null
          nouveau_statut?: string
          user_agent?: string | null
          user_id?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_etat_log_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: false
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_export_esteve: {
        Row: {
          created_at: string
          entretien_id: string
          esteve_dossier_ref: string | null
          exported_at: string
          exported_by: string
          id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          entretien_id: string
          esteve_dossier_ref?: string | null
          exported_at?: string
          exported_by: string
          id?: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          entretien_id?: string
          esteve_dossier_ref?: string | null
          exported_at?: string
          exported_by?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_export_esteve_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: true
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_fiches_poste: {
        Row: {
          activites: string | null
          agent_id: string | null
          categorie: Database["public"]["Enums"]["agent_categorie"] | null
          competences_requises: string | null
          conditions_exercice: string | null
          contraintes_specificites: string | null
          corps_grade_cible: string | null
          created_at: string
          created_by: string | null
          date_revision: string | null
          establishment_id: string | null
          filiere: Database["public"]["Enums"]["agent_filiere"] | null
          id: string
          intitule: string
          missions_principales: string | null
          partagee_groupement: boolean
          pdf_url: string | null
          positionnement_hierarchique: string | null
          service: string | null
          updated_at: string
          validee_le: string | null
          validee_par_user_id: string | null
        }
        Insert: {
          activites?: string | null
          agent_id?: string | null
          categorie?: Database["public"]["Enums"]["agent_categorie"] | null
          competences_requises?: string | null
          conditions_exercice?: string | null
          contraintes_specificites?: string | null
          corps_grade_cible?: string | null
          created_at?: string
          created_by?: string | null
          date_revision?: string | null
          establishment_id?: string | null
          filiere?: Database["public"]["Enums"]["agent_filiere"] | null
          id?: string
          intitule: string
          missions_principales?: string | null
          partagee_groupement?: boolean
          pdf_url?: string | null
          positionnement_hierarchique?: string | null
          service?: string | null
          updated_at?: string
          validee_le?: string | null
          validee_par_user_id?: string | null
        }
        Update: {
          activites?: string | null
          agent_id?: string | null
          categorie?: Database["public"]["Enums"]["agent_categorie"] | null
          competences_requises?: string | null
          conditions_exercice?: string | null
          contraintes_specificites?: string | null
          corps_grade_cible?: string | null
          created_at?: string
          created_by?: string | null
          date_revision?: string | null
          establishment_id?: string | null
          filiere?: Database["public"]["Enums"]["agent_filiere"] | null
          id?: string
          intitule?: string
          missions_principales?: string | null
          partagee_groupement?: boolean
          pdf_url?: string | null
          positionnement_hierarchique?: string | null
          service?: string | null
          updated_at?: string
          validee_le?: string | null
          validee_par_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_fiches_poste_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_formation_bilan: {
        Row: {
          created_at: string
          date_debut: string | null
          date_fin: string | null
          duree_heures: number | null
          entretien_id: string
          evaluation: string | null
          id: string
          intitule: string
          organisme: string | null
          reinvestissement: string | null
        }
        Insert: {
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          duree_heures?: number | null
          entretien_id: string
          evaluation?: string | null
          id?: string
          intitule: string
          organisme?: string | null
          reinvestissement?: string | null
        }
        Update: {
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          duree_heures?: number | null
          entretien_id?: string
          evaluation?: string | null
          id?: string
          intitule?: string
          organisme?: string | null
          reinvestissement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_formation_bilan_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: false
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_formation_demandes: {
        Row: {
          categorie: Database["public"]["Enums"]["formation_categorie"]
          created_at: string
          entretien_id: string
          extrait_source: string | null
          fondement: Database["public"]["Enums"]["formation_fondement"]
          id: string
          intitule: string
          lien_pafac: string | null
          priorite: Database["public"]["Enums"]["formation_priorite"]
          statut: string | null
        }
        Insert: {
          categorie?: Database["public"]["Enums"]["formation_categorie"]
          created_at?: string
          entretien_id: string
          extrait_source?: string | null
          fondement?: Database["public"]["Enums"]["formation_fondement"]
          id?: string
          intitule: string
          lien_pafac?: string | null
          priorite?: Database["public"]["Enums"]["formation_priorite"]
          statut?: string | null
        }
        Update: {
          categorie?: Database["public"]["Enums"]["formation_categorie"]
          created_at?: string
          entretien_id?: string
          extrait_source?: string | null
          fondement?: Database["public"]["Enums"]["formation_fondement"]
          id?: string
          intitule?: string
          lien_pafac?: string | null
          priorite?: Database["public"]["Enums"]["formation_priorite"]
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_formation_demandes_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: false
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_objectifs_futurs: {
        Row: {
          created_at: string
          echeance: string | null
          entretien_id: string
          id: string
          indicateur: string | null
          libelle: string
          ordre: number
        }
        Insert: {
          created_at?: string
          echeance?: string | null
          entretien_id: string
          id?: string
          indicateur?: string | null
          libelle: string
          ordre?: number
        }
        Update: {
          created_at?: string
          echeance?: string | null
          entretien_id?: string
          id?: string
          indicateur?: string | null
          libelle?: string
          ordre?: number
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_objectifs_futurs_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: false
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_objectifs_passes: {
        Row: {
          atteinte: Database["public"]["Enums"]["objectif_atteinte"] | null
          commentaire: string | null
          created_at: string
          entretien_id: string
          id: string
          libelle: string
          ordre: number
        }
        Insert: {
          atteinte?: Database["public"]["Enums"]["objectif_atteinte"] | null
          commentaire?: string | null
          created_at?: string
          entretien_id: string
          id?: string
          libelle: string
          ordre?: number
        }
        Update: {
          atteinte?: Database["public"]["Enums"]["objectif_atteinte"] | null
          commentaire?: string | null
          created_at?: string
          entretien_id?: string
          id?: string
          libelle?: string
          ordre?: number
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_objectifs_passes_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: false
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_professionnels: {
        Row: {
          agent_evalue_id: string
          appreciation_generale: string | null
          autorite_n2_user_id: string | null
          campagne_annee: string
          created_at: string
          date_convocation: string | null
          date_entretien: string | null
          duree_entretien_min: number | null
          establishment_id: string
          evaluateur_user_id: string
          finalise_at: string | null
          ia_response_json: Json | null
          ia_score_completude: number | null
          id: string
          lieu: string | null
          mode: Database["public"]["Enums"]["entretien_mode"] | null
          notification_agent_at: string | null
          observations_agent: string | null
          observations_n2: string | null
          pdf_cref_hash: string | null
          pdf_cref_url: string | null
          pdf_crep_hash: string | null
          pdf_crep_url: string | null
          periode_debut: string | null
          periode_fin: string | null
          perspectives: string | null
          signature_agent_at: string | null
          signature_agent_hash: string | null
          signature_n1_at: string | null
          signature_n1_hash: string | null
          signature_n2_hash: string | null
          statut: Database["public"]["Enums"]["entretien_statut"]
          texte_libre_appreciation: string | null
          texte_libre_formation: string | null
          updated_at: string
          visa_n2_at: string | null
        }
        Insert: {
          agent_evalue_id: string
          appreciation_generale?: string | null
          autorite_n2_user_id?: string | null
          campagne_annee: string
          created_at?: string
          date_convocation?: string | null
          date_entretien?: string | null
          duree_entretien_min?: number | null
          establishment_id: string
          evaluateur_user_id: string
          finalise_at?: string | null
          ia_response_json?: Json | null
          ia_score_completude?: number | null
          id?: string
          lieu?: string | null
          mode?: Database["public"]["Enums"]["entretien_mode"] | null
          notification_agent_at?: string | null
          observations_agent?: string | null
          observations_n2?: string | null
          pdf_cref_hash?: string | null
          pdf_cref_url?: string | null
          pdf_crep_hash?: string | null
          pdf_crep_url?: string | null
          periode_debut?: string | null
          periode_fin?: string | null
          perspectives?: string | null
          signature_agent_at?: string | null
          signature_agent_hash?: string | null
          signature_n1_at?: string | null
          signature_n1_hash?: string | null
          signature_n2_hash?: string | null
          statut?: Database["public"]["Enums"]["entretien_statut"]
          texte_libre_appreciation?: string | null
          texte_libre_formation?: string | null
          updated_at?: string
          visa_n2_at?: string | null
        }
        Update: {
          agent_evalue_id?: string
          appreciation_generale?: string | null
          autorite_n2_user_id?: string | null
          campagne_annee?: string
          created_at?: string
          date_convocation?: string | null
          date_entretien?: string | null
          duree_entretien_min?: number | null
          establishment_id?: string
          evaluateur_user_id?: string
          finalise_at?: string | null
          ia_response_json?: Json | null
          ia_score_completude?: number | null
          id?: string
          lieu?: string | null
          mode?: Database["public"]["Enums"]["entretien_mode"] | null
          notification_agent_at?: string | null
          observations_agent?: string | null
          observations_n2?: string | null
          pdf_cref_hash?: string | null
          pdf_cref_url?: string | null
          pdf_crep_hash?: string | null
          pdf_crep_url?: string | null
          periode_debut?: string | null
          periode_fin?: string | null
          perspectives?: string | null
          signature_agent_at?: string | null
          signature_agent_hash?: string | null
          signature_n1_at?: string | null
          signature_n1_hash?: string | null
          signature_n2_hash?: string | null
          statut?: Database["public"]["Enums"]["entretien_statut"]
          texte_libre_appreciation?: string | null
          texte_libre_formation?: string | null
          updated_at?: string
          visa_n2_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_professionnels_agent_evalue_id_fkey"
            columns: ["agent_evalue_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entretiens_professionnels_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_recours: {
        Row: {
          created_at: string
          date_avis_cap: string | null
          date_decision_finale: string | null
          date_limite_reponse: string | null
          date_reponse: string | null
          date_saisine: string
          decision_finale: string | null
          entretien_id: string
          id: string
          motif: string
          pdf_recours_url: string | null
          pieces_jointes_urls: Json | null
          reponse: string | null
          sens_avis_cap: string | null
          statut: Database["public"]["Enums"]["recours_statut"]
          type: Database["public"]["Enums"]["recours_type"]
          updated_at: string
          user_saisie_id: string | null
        }
        Insert: {
          created_at?: string
          date_avis_cap?: string | null
          date_decision_finale?: string | null
          date_limite_reponse?: string | null
          date_reponse?: string | null
          date_saisine: string
          decision_finale?: string | null
          entretien_id: string
          id?: string
          motif: string
          pdf_recours_url?: string | null
          pieces_jointes_urls?: Json | null
          reponse?: string | null
          sens_avis_cap?: string | null
          statut?: Database["public"]["Enums"]["recours_statut"]
          type: Database["public"]["Enums"]["recours_type"]
          updated_at?: string
          user_saisie_id?: string | null
        }
        Update: {
          created_at?: string
          date_avis_cap?: string | null
          date_decision_finale?: string | null
          date_limite_reponse?: string | null
          date_reponse?: string | null
          date_saisine?: string
          decision_finale?: string | null
          entretien_id?: string
          id?: string
          motif?: string
          pdf_recours_url?: string | null
          pieces_jointes_urls?: Json | null
          reponse?: string | null
          sens_avis_cap?: string | null
          statut?: Database["public"]["Enums"]["recours_statut"]
          type?: Database["public"]["Enums"]["recours_type"]
          updated_at?: string
          user_saisie_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_recours_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: false
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      entretiens_signatures: {
        Row: {
          created_at: string
          date_signature: string
          entretien_id: string
          hash: string
          id: string
          ip_address: string | null
          signataire_nom: string | null
          signataire_role: Database["public"]["Enums"]["signature_role"]
          signataire_user_id: string
        }
        Insert: {
          created_at?: string
          date_signature?: string
          entretien_id: string
          hash: string
          id?: string
          ip_address?: string | null
          signataire_nom?: string | null
          signataire_role: Database["public"]["Enums"]["signature_role"]
          signataire_user_id: string
        }
        Update: {
          created_at?: string
          date_signature?: string
          entretien_id?: string
          hash?: string
          id?: string
          ip_address?: string | null
          signataire_nom?: string | null
          signataire_role?: Database["public"]["Enums"]["signature_role"]
          signataire_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entretiens_signatures_entretien_id_fkey"
            columns: ["entretien_id"]
            isOneToOne: false
            referencedRelation: "entretiens_professionnels"
            referencedColumns: ["id"]
          },
        ]
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
          adjoint_id: string | null
          adresse_ligne_1: string | null
          adresse_ligne_2: string | null
          adresse_ligne_3: string | null
          agent_comptable: string
          annee_construction: number | null
          annee_derniere_renovation: number | null
          chef_cuisine_id: string | null
          chef_etablissement_id: string | null
          city: string
          classement_ep: Database["public"]["Enums"]["classement_ep"] | null
          code_postal: string | null
          collectivite_rattachement:
            | Database["public"]["Enums"]["collectivite_rattachement"]
            | null
          commune: string | null
          contact_collectivite: string | null
          contrat_objectifs_en_cours: boolean | null
          contrat_tripartite_url: string | null
          cpe_principal_id: string | null
          created_at: string
          date_rattachement_groupement: string | null
          departement: string | null
          email_intendance: string | null
          email_secretariat: string | null
          gestionnaire_materiel_id: string | null
          groupement_id: string | null
          id: string
          indice_position_sociale: number | null
          name: string
          nb_batiments: number | null
          nb_eleves_boursiers: number | null
          nb_eleves_dp: number | null
          nb_eleves_externes: number | null
          nb_eleves_internes: number | null
          nb_eleves_total: number | null
          nom_collectivite: string | null
          notes: string | null
          opale_number: string
          ordonnateur: string
          secretaire_general: string
          secretaire_general_id: string | null
          siret: string | null
          site_web: string | null
          statut_juridique:
            | Database["public"]["Enums"]["statut_juridique"]
            | null
          statut_rattachement:
            | Database["public"]["Enums"]["statut_rattachement"]
            | null
          surface_batie_m2: number | null
          taux_boursiers: number | null
          telephone: string | null
          type: string
          type_etablissement:
            | Database["public"]["Enums"]["etablissement_type"]
            | null
          uai: string
          updated_at: string
        }
        Insert: {
          academy?: string
          adjoint_id?: string | null
          adresse_ligne_1?: string | null
          adresse_ligne_2?: string | null
          adresse_ligne_3?: string | null
          agent_comptable?: string
          annee_construction?: number | null
          annee_derniere_renovation?: number | null
          chef_cuisine_id?: string | null
          chef_etablissement_id?: string | null
          city?: string
          classement_ep?: Database["public"]["Enums"]["classement_ep"] | null
          code_postal?: string | null
          collectivite_rattachement?:
            | Database["public"]["Enums"]["collectivite_rattachement"]
            | null
          commune?: string | null
          contact_collectivite?: string | null
          contrat_objectifs_en_cours?: boolean | null
          contrat_tripartite_url?: string | null
          cpe_principal_id?: string | null
          created_at?: string
          date_rattachement_groupement?: string | null
          departement?: string | null
          email_intendance?: string | null
          email_secretariat?: string | null
          gestionnaire_materiel_id?: string | null
          groupement_id?: string | null
          id?: string
          indice_position_sociale?: number | null
          name: string
          nb_batiments?: number | null
          nb_eleves_boursiers?: number | null
          nb_eleves_dp?: number | null
          nb_eleves_externes?: number | null
          nb_eleves_internes?: number | null
          nb_eleves_total?: number | null
          nom_collectivite?: string | null
          notes?: string | null
          opale_number?: string
          ordonnateur?: string
          secretaire_general?: string
          secretaire_general_id?: string | null
          siret?: string | null
          site_web?: string | null
          statut_juridique?:
            | Database["public"]["Enums"]["statut_juridique"]
            | null
          statut_rattachement?:
            | Database["public"]["Enums"]["statut_rattachement"]
            | null
          surface_batie_m2?: number | null
          taux_boursiers?: number | null
          telephone?: string | null
          type?: string
          type_etablissement?:
            | Database["public"]["Enums"]["etablissement_type"]
            | null
          uai: string
          updated_at?: string
        }
        Update: {
          academy?: string
          adjoint_id?: string | null
          adresse_ligne_1?: string | null
          adresse_ligne_2?: string | null
          adresse_ligne_3?: string | null
          agent_comptable?: string
          annee_construction?: number | null
          annee_derniere_renovation?: number | null
          chef_cuisine_id?: string | null
          chef_etablissement_id?: string | null
          city?: string
          classement_ep?: Database["public"]["Enums"]["classement_ep"] | null
          code_postal?: string | null
          collectivite_rattachement?:
            | Database["public"]["Enums"]["collectivite_rattachement"]
            | null
          commune?: string | null
          contact_collectivite?: string | null
          contrat_objectifs_en_cours?: boolean | null
          contrat_tripartite_url?: string | null
          cpe_principal_id?: string | null
          created_at?: string
          date_rattachement_groupement?: string | null
          departement?: string | null
          email_intendance?: string | null
          email_secretariat?: string | null
          gestionnaire_materiel_id?: string | null
          groupement_id?: string | null
          id?: string
          indice_position_sociale?: number | null
          name?: string
          nb_batiments?: number | null
          nb_eleves_boursiers?: number | null
          nb_eleves_dp?: number | null
          nb_eleves_externes?: number | null
          nb_eleves_internes?: number | null
          nb_eleves_total?: number | null
          nom_collectivite?: string | null
          notes?: string | null
          opale_number?: string
          ordonnateur?: string
          secretaire_general?: string
          secretaire_general_id?: string | null
          siret?: string | null
          site_web?: string | null
          statut_juridique?:
            | Database["public"]["Enums"]["statut_juridique"]
            | null
          statut_rattachement?:
            | Database["public"]["Enums"]["statut_rattachement"]
            | null
          surface_batie_m2?: number | null
          taux_boursiers?: number | null
          telephone?: string | null
          type?: string
          type_etablissement?:
            | Database["public"]["Enums"]["etablissement_type"]
            | null
          uai?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishments_adjoint_id_fkey"
            columns: ["adjoint_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_chef_cuisine_id_fkey"
            columns: ["chef_cuisine_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_chef_etablissement_id_fkey"
            columns: ["chef_etablissement_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_cpe_principal_id_fkey"
            columns: ["cpe_principal_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_gestionnaire_materiel_id_fkey"
            columns: ["gestionnaire_materiel_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_groupement_id_fkey"
            columns: ["groupement_id"]
            isOneToOne: false
            referencedRelation: "groupements_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_secretaire_general_id_fkey"
            columns: ["secretaire_general_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_commission_convocations: {
        Row: {
          commission_id: string
          created_at: string
          date_envoi: string
          establishment_id: string
          id: string
          membres_convoques: Json
          ordre_du_jour: string | null
          pdf_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_id: string
          created_at?: string
          date_envoi?: string
          establishment_id: string
          id?: string
          membres_convoques?: Json
          ordre_du_jour?: string | null
          pdf_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_id?: string
          created_at?: string
          date_envoi?: string
          establishment_id?: string
          id?: string
          membres_convoques?: Json
          ordre_du_jour?: string | null
          pdf_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fs_commission_convocations_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "fs_commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_commissions: {
        Row: {
          annee_scolaire: string
          convocation_envoyee: boolean
          created_at: string
          date_commission: string
          dossiers_examines_count: number
          establishment_id: string
          id: string
          membres_presents: Json
          observations: string | null
          proces_verbal_url: string | null
          pv_anonymise_url: string | null
          pv_integral_url: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annee_scolaire?: string
          convocation_envoyee?: boolean
          created_at?: string
          date_commission: string
          dossiers_examines_count?: number
          establishment_id: string
          id?: string
          membres_presents?: Json
          observations?: string | null
          proces_verbal_url?: string | null
          pv_anonymise_url?: string | null
          pv_integral_url?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annee_scolaire?: string
          convocation_envoyee?: boolean
          created_at?: string
          date_commission?: string
          dossiers_examines_count?: number
          establishment_id?: string
          id?: string
          membres_presents?: Json
          observations?: string | null
          proces_verbal_url?: string | null
          pv_anonymise_url?: string | null
          pv_integral_url?: string | null
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
          bordereau_dp_url: string | null
          code_activite_opale: string
          commission_id: string | null
          compte_creance_famille: string
          compte_imputation_opale: string | null
          courrier_complement_url: string | null
          courrier_refus_url: string | null
          created_at: string
          date_decision: string
          date_demande_paiement: string | null
          decision_chef_etablissement_pdf_url: string | null
          deliberation_ca_id: string | null
          eleve_id: string
          establishment_id: string
          extinction_creance_dp: boolean
          id: string
          modalite_attribution: string
          modalite_versement: string
          montant: number
          motif: string
          nature_aide: string
          notification_famille_pdf_url: string | null
          numero_decision: string
          numero_demande_paiement: string | null
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
          bordereau_dp_url?: string | null
          code_activite_opale?: string
          commission_id?: string | null
          compte_creance_famille?: string
          compte_imputation_opale?: string | null
          courrier_complement_url?: string | null
          courrier_refus_url?: string | null
          created_at?: string
          date_decision: string
          date_demande_paiement?: string | null
          decision_chef_etablissement_pdf_url?: string | null
          deliberation_ca_id?: string | null
          eleve_id: string
          establishment_id: string
          extinction_creance_dp?: boolean
          id?: string
          modalite_attribution: string
          modalite_versement: string
          montant: number
          motif?: string
          nature_aide: string
          notification_famille_pdf_url?: string | null
          numero_decision: string
          numero_demande_paiement?: string | null
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
          bordereau_dp_url?: string | null
          code_activite_opale?: string
          commission_id?: string | null
          compte_creance_famille?: string
          compte_imputation_opale?: string | null
          courrier_complement_url?: string | null
          courrier_refus_url?: string | null
          created_at?: string
          date_decision?: string
          date_demande_paiement?: string | null
          decision_chef_etablissement_pdf_url?: string | null
          deliberation_ca_id?: string | null
          eleve_id?: string
          establishment_id?: string
          extinction_creance_dp?: boolean
          id?: string
          modalite_attribution?: string
          modalite_versement?: string
          montant?: number
          motif?: string
          nature_aide?: string
          notification_famille_pdf_url?: string | null
          numero_decision?: string
          numero_demande_paiement?: string | null
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
            foreignKeyName: "fs_decisions_deliberation_ca_fk"
            columns: ["deliberation_ca_id"]
            isOneToOne: false
            referencedRelation: "fs_deliberations_ca"
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
      fs_deliberations_ca: {
        Row: {
          annee_scolaire: string
          created_at: string
          criteres_attribution: string | null
          date_ca: string
          establishment_id: string
          id: string
          numero: string
          pdf_url: string | null
          pieces_obligatoires: string[] | null
          plafond_aide_individuelle: number | null
          plafond_cumul_annuel: number | null
          type_fonds: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annee_scolaire: string
          created_at?: string
          criteres_attribution?: string | null
          date_ca: string
          establishment_id: string
          id?: string
          numero: string
          pdf_url?: string | null
          pieces_obligatoires?: string[] | null
          plafond_aide_individuelle?: number | null
          plafond_cumul_annuel?: number | null
          type_fonds: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annee_scolaire?: string
          created_at?: string
          criteres_attribution?: string | null
          date_ca?: string
          establishment_id?: string
          id?: string
          numero?: string
          pdf_url?: string | null
          pieces_obligatoires?: string[] | null
          plafond_aide_individuelle?: number | null
          plafond_cumul_annuel?: number | null
          type_fonds?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      fs_imports_eleves: {
        Row: {
          annee_scolaire: string
          created_at: string
          establishment_id: string
          fichier_nom: string
          fichier_type: string
          id: string
          lignes_importees: number
          lignes_rejetees: number
          mapping_source: string
          mapping_utilise: Json
          rapport_erreurs: Json
          statut: string
          total_lignes: number
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          annee_scolaire: string
          created_at?: string
          establishment_id: string
          fichier_nom: string
          fichier_type: string
          id?: string
          lignes_importees?: number
          lignes_rejetees?: number
          mapping_source?: string
          mapping_utilise?: Json
          rapport_erreurs?: Json
          statut?: string
          total_lignes?: number
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          annee_scolaire?: string
          created_at?: string
          establishment_id?: string
          fichier_nom?: string
          fichier_type?: string
          id?: string
          lignes_importees?: number
          lignes_rejetees?: number
          mapping_source?: string
          mapping_utilise?: Json
          rapport_erreurs?: Json
          statut?: string
          total_lignes?: number
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_imports_eleves_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_journal_acces: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          establishment_id: string
          id: string
          ip_adresse: string | null
          ressource_id: string
          type_ressource: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          establishment_id: string
          id?: string
          ip_adresse?: string | null
          ressource_id: string
          type_ressource: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          establishment_id?: string
          id?: string
          ip_adresse?: string | null
          ressource_id?: string
          type_ressource?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
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
      groupements_comptables: {
        Row: {
          academie: string
          adresse: string | null
          agent_comptable_prise_fonction: string | null
          agent_comptable_titulaire: string | null
          arrete_constitutif_url: string | null
          code_groupement: string | null
          created_at: string
          date_creation_arrete: string | null
          date_derniere_modification: string | null
          email: string | null
          fonde_de_pouvoir: string | null
          id: string
          lycee_siege_id: string | null
          nom: string
          notes: string | null
          perimetre_actif: boolean | null
          rectorat_libelle: string
          region_academique: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          academie?: string
          adresse?: string | null
          agent_comptable_prise_fonction?: string | null
          agent_comptable_titulaire?: string | null
          arrete_constitutif_url?: string | null
          code_groupement?: string | null
          created_at?: string
          date_creation_arrete?: string | null
          date_derniere_modification?: string | null
          email?: string | null
          fonde_de_pouvoir?: string | null
          id?: string
          lycee_siege_id?: string | null
          nom: string
          notes?: string | null
          perimetre_actif?: boolean | null
          rectorat_libelle?: string
          region_academique?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          academie?: string
          adresse?: string | null
          agent_comptable_prise_fonction?: string | null
          agent_comptable_titulaire?: string | null
          arrete_constitutif_url?: string | null
          code_groupement?: string | null
          created_at?: string
          date_creation_arrete?: string | null
          date_derniere_modification?: string | null
          email?: string | null
          fonde_de_pouvoir?: string | null
          id?: string
          lycee_siege_id?: string | null
          nom?: string
          notes?: string | null
          perimetre_actif?: boolean | null
          rectorat_libelle?: string
          region_academique?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groupements_comptables_lycee_siege_id_fkey"
            columns: ["lycee_siege_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      habilitations_opale: {
        Row: {
          acte_url: string | null
          agent_id: string | null
          agent_nom: string | null
          consulte_par_rectorat: Json
          created_at: string
          created_by: string | null
          date_activation_effective: string | null
          date_activation_souhaitee: string | null
          date_demande: string
          date_revocation_effective: string | null
          date_revocation_prevue: string | null
          date_signature_ac: string | null
          date_signature_ordonnateur: string | null
          establishment_id: string
          id: string
          motif_demande: string | null
          motif_revocation: string | null
          notes: string | null
          perimetre_eple_ids: string[]
          profil_opale: string
          signe_par_ac_id: string | null
          signe_par_ordonnateur_id: string | null
          sphere: string
          statut: string
          updated_at: string
        }
        Insert: {
          acte_url?: string | null
          agent_id?: string | null
          agent_nom?: string | null
          consulte_par_rectorat?: Json
          created_at?: string
          created_by?: string | null
          date_activation_effective?: string | null
          date_activation_souhaitee?: string | null
          date_demande?: string
          date_revocation_effective?: string | null
          date_revocation_prevue?: string | null
          date_signature_ac?: string | null
          date_signature_ordonnateur?: string | null
          establishment_id: string
          id?: string
          motif_demande?: string | null
          motif_revocation?: string | null
          notes?: string | null
          perimetre_eple_ids?: string[]
          profil_opale: string
          signe_par_ac_id?: string | null
          signe_par_ordonnateur_id?: string | null
          sphere: string
          statut?: string
          updated_at?: string
        }
        Update: {
          acte_url?: string | null
          agent_id?: string | null
          agent_nom?: string | null
          consulte_par_rectorat?: Json
          created_at?: string
          created_by?: string | null
          date_activation_effective?: string | null
          date_activation_souhaitee?: string | null
          date_demande?: string
          date_revocation_effective?: string | null
          date_revocation_prevue?: string | null
          date_signature_ac?: string | null
          date_signature_ordonnateur?: string | null
          establishment_id?: string
          id?: string
          motif_demande?: string | null
          motif_revocation?: string | null
          notes?: string | null
          perimetre_eple_ids?: string[]
          profil_opale?: string
          signe_par_ac_id?: string | null
          signe_par_ordonnateur_id?: string | null
          sphere?: string
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      habilitations_recapitulatif_annuel: {
        Row: {
          annee_scolaire: string
          contenu: Json
          created_at: string
          created_by: string | null
          date_generation: string
          date_signature_ac: string | null
          date_transmission_rectorat: string | null
          groupement_id: string
          id: string
          pdf_url: string | null
          rapport_completude_pct: number | null
          signe_par_ac: boolean
          signe_par_ordonnateurs: Json
          statut: string
          token_consultation_rectorat: string | null
          updated_at: string
          url_consultation_rectorat: string | null
          xlsx_url: string | null
        }
        Insert: {
          annee_scolaire: string
          contenu?: Json
          created_at?: string
          created_by?: string | null
          date_generation?: string
          date_signature_ac?: string | null
          date_transmission_rectorat?: string | null
          groupement_id: string
          id?: string
          pdf_url?: string | null
          rapport_completude_pct?: number | null
          signe_par_ac?: boolean
          signe_par_ordonnateurs?: Json
          statut?: string
          token_consultation_rectorat?: string | null
          updated_at?: string
          url_consultation_rectorat?: string | null
          xlsx_url?: string | null
        }
        Update: {
          annee_scolaire?: string
          contenu?: Json
          created_at?: string
          created_by?: string | null
          date_generation?: string
          date_signature_ac?: string | null
          date_transmission_rectorat?: string | null
          groupement_id?: string
          id?: string
          pdf_url?: string | null
          rapport_completude_pct?: number | null
          signe_par_ac?: boolean
          signe_par_ordonnateurs?: Json
          statut?: string
          token_consultation_rectorat?: string | null
          updated_at?: string
          url_consultation_rectorat?: string | null
          xlsx_url?: string | null
        }
        Relationships: []
      }
      historique_fonctions: {
        Row: {
          agent_id: string
          archive_at: string
          arrete_url: string | null
          date_debut: string | null
          date_fin: string | null
          establishment_id: string | null
          id: string
          motif_changement: string | null
          payload_apres: Json | null
          payload_avant: Json | null
          role: string | null
        }
        Insert: {
          agent_id: string
          archive_at?: string
          arrete_url?: string | null
          date_debut?: string | null
          date_fin?: string | null
          establishment_id?: string | null
          id?: string
          motif_changement?: string | null
          payload_apres?: Json | null
          payload_avant?: Json | null
          role?: string | null
        }
        Update: {
          agent_id?: string
          archive_at?: string
          arrete_url?: string | null
          date_debut?: string | null
          date_fin?: string | null
          establishment_id?: string | null
          id?: string
          motif_changement?: string | null
          payload_apres?: Json | null
          payload_avant?: Json | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historique_fonctions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historique_fonctions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      imports_historique: {
        Row: {
          anomalies_json: Json | null
          commentaire: string | null
          created_at: string
          date_edition_fichier: string | null
          date_import: string
          ecart_vs_precedent_json: Json | null
          establishment_id: string
          fichier_original_path: string | null
          filename: string
          hash_sha256: string | null
          id: string
          importe_par: string
          periode_debut: string | null
          periode_fin: string | null
          statut: Database["public"]["Enums"]["import_status"]
          taille_octets: number
          totaux_json: Json | null
          type_import: Database["public"]["Enums"]["import_file_type"]
          uai_detecte: string | null
        }
        Insert: {
          anomalies_json?: Json | null
          commentaire?: string | null
          created_at?: string
          date_edition_fichier?: string | null
          date_import?: string
          ecart_vs_precedent_json?: Json | null
          establishment_id: string
          fichier_original_path?: string | null
          filename: string
          hash_sha256?: string | null
          id?: string
          importe_par: string
          periode_debut?: string | null
          periode_fin?: string | null
          statut?: Database["public"]["Enums"]["import_status"]
          taille_octets?: number
          totaux_json?: Json | null
          type_import: Database["public"]["Enums"]["import_file_type"]
          uai_detecte?: string | null
        }
        Update: {
          anomalies_json?: Json | null
          commentaire?: string | null
          created_at?: string
          date_edition_fichier?: string | null
          date_import?: string
          ecart_vs_precedent_json?: Json | null
          establishment_id?: string
          fichier_original_path?: string | null
          filename?: string
          hash_sha256?: string | null
          id?: string
          importe_par?: string
          periode_debut?: string | null
          periode_fin?: string | null
          statut?: Database["public"]["Enums"]["import_status"]
          taille_octets?: number
          totaux_json?: Json | null
          type_import?: Database["public"]["Enums"]["import_file_type"]
          uai_detecte?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_historique_establishment_id_fkey"
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
      liens_utiles: {
        Row: {
          actif: boolean
          ajoute_par: string | null
          categorie: string
          created_at: string
          description: string | null
          id: string
          nom: string
          ordre_affichage: number
          tags: string[]
          updated_at: string
          url: string
        }
        Insert: {
          actif?: boolean
          ajoute_par?: string | null
          categorie: string
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          ordre_affichage?: number
          tags?: string[]
          updated_at?: string
          url: string
        }
        Update: {
          actif?: boolean
          ajoute_par?: string | null
          categorie?: string
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          ordre_affichage?: number
          tags?: string[]
          updated_at?: string
          url?: string
        }
        Relationships: []
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
      mp_archives: {
        Row: {
          created_at: string
          date_destruction_prevue: string | null
          date_notification: string | null
          duree_conservation_ans: number
          establishment_id: string
          full_text: unknown
          hash_sha256: string
          id: string
          libelle: string
          manifeste: Json
          marche_id: string | null
          montant_ht: number
          reference: string
          storage_path: string
          type_marche: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_destruction_prevue?: string | null
          date_notification?: string | null
          duree_conservation_ans?: number
          establishment_id: string
          full_text?: unknown
          hash_sha256?: string
          id?: string
          libelle: string
          manifeste?: Json
          marche_id?: string | null
          montant_ht?: number
          reference: string
          storage_path?: string
          type_marche: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_destruction_prevue?: string | null
          date_notification?: string | null
          duree_conservation_ans?: number
          establishment_id?: string
          full_text?: unknown
          hash_sha256?: string
          id?: string
          libelle?: string
          manifeste?: Json
          marche_id?: string | null
          montant_ht?: number
          reference?: string
          storage_path?: string
          type_marche?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_archives_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "mp_marches"
            referencedColumns: ["id"]
          },
        ]
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
      mp_groupements_commandes: {
        Row: {
          coordonnateur_establishment_id: string
          created_at: string
          date_constitution: string
          date_dissolution: string | null
          id: string
          libelle: string
          marche_id: string | null
          modalites_repartition: string
          observations: string
          perimetre_familles: Json
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coordonnateur_establishment_id: string
          created_at?: string
          date_constitution?: string
          date_dissolution?: string | null
          id?: string
          libelle: string
          marche_id?: string | null
          modalites_repartition?: string
          observations?: string
          perimetre_familles?: Json
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coordonnateur_establishment_id?: string
          created_at?: string
          date_constitution?: string
          date_dissolution?: string | null
          id?: string
          libelle?: string
          marche_id?: string | null
          modalites_repartition?: string
          observations?: string
          perimetre_familles?: Json
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_groupements_commandes_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "mp_marches"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_groupements_membres: {
        Row: {
          created_at: string
          establishment_id: string
          groupement_id: string
          id: string
          montant_engage: number
          observations: string
          quote_part_pct: number
        }
        Insert: {
          created_at?: string
          establishment_id: string
          groupement_id: string
          id?: string
          montant_engage?: number
          observations?: string
          quote_part_pct?: number
        }
        Update: {
          created_at?: string
          establishment_id?: string
          groupement_id?: string
          id?: string
          montant_engage?: number
          observations?: string
          quote_part_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "mp_groupements_membres_groupement_id_fkey"
            columns: ["groupement_id"]
            isOneToOne: false
            referencedRelation: "mp_groupements_commandes"
            referencedColumns: ["id"]
          },
        ]
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
      mp_marches_avenants: {
        Row: {
          created_at: string
          date_effet: string | null
          date_signature: string | null
          id: string
          marche_id: string
          montant_ht: number
          motif: string
          numero: number
          objet: string
          observations: string
          pct_initial: number
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_effet?: string | null
          date_signature?: string | null
          id?: string
          marche_id: string
          montant_ht?: number
          motif?: string
          numero: number
          objet?: string
          observations?: string
          pct_initial?: number
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_effet?: string | null
          date_signature?: string | null
          id?: string
          marche_id?: string
          montant_ht?: number
          motif?: string
          numero?: number
          objet?: string
          observations?: string
          pct_initial?: number
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_marches_avenants_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "mp_marches"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_marches_bdc: {
        Row: {
          created_at: string
          date_emission: string
          date_livraison_prevue: string | null
          date_reception: string | null
          fournisseur_id: string | null
          id: string
          marche_id: string
          montant_ht: number
          montant_ttc: number
          numero: string
          objet: string
          observations: string
          statut: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_emission: string
          date_livraison_prevue?: string | null
          date_reception?: string | null
          fournisseur_id?: string | null
          id?: string
          marche_id: string
          montant_ht?: number
          montant_ttc?: number
          numero: string
          objet?: string
          observations?: string
          statut?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_emission?: string
          date_livraison_prevue?: string | null
          date_reception?: string | null
          fournisseur_id?: string | null
          id?: string
          marche_id?: string
          montant_ht?: number
          montant_ttc?: number
          numero?: string
          objet?: string
          observations?: string
          statut?: string
          updated_at?: string
          user_id?: string | null
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
      mp_marches_reconductions: {
        Row: {
          created_at: string
          date_decision: string | null
          date_effet: string
          decision: string
          duree_mois: number
          id: string
          marche_id: string
          numero: number
          observations: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_decision?: string | null
          date_effet: string
          decision?: string
          duree_mois?: number
          id?: string
          marche_id: string
          numero: number
          observations?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_decision?: string | null
          date_effet?: string
          decision?: string
          duree_mois?: number
          id?: string
          marche_id?: string
          numero?: number
          observations?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_marches_reconductions_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "mp_marches"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_marches_sous_traitants: {
        Row: {
          created_at: string
          date_acceptation: string | null
          id: string
          marche_id: string
          montant_ht: number
          observations: string
          paiement_direct: boolean
          prestations: string
          raison_sociale: string
          rang: number
          siret: string | null
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_acceptation?: string | null
          id?: string
          marche_id: string
          montant_ht?: number
          observations?: string
          paiement_direct?: boolean
          prestations?: string
          raison_sociale: string
          rang?: number
          siret?: string | null
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_acceptation?: string | null
          id?: string
          marche_id?: string
          montant_ht?: number
          observations?: string
          paiement_direct?: boolean
          prestations?: string
          raison_sociale?: string
          rang?: number
          siret?: string | null
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mp_marches_sous_traitants_marche_id_fkey"
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
      observateur_rectoral_logs: {
        Row: {
          action: string
          cible_id: string | null
          cible_type: string | null
          created_at: string
          id: string
          meta: Json | null
          observateur_id: string
          user_id: string
        }
        Insert: {
          action: string
          cible_id?: string | null
          cible_type?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          observateur_id: string
          user_id: string
        }
        Update: {
          action?: string
          cible_id?: string | null
          cible_type?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          observateur_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observateur_rectoral_logs_observateur_id_fkey"
            columns: ["observateur_id"]
            isOneToOne: false
            referencedRelation: "observateurs_rectoraux"
            referencedColumns: ["id"]
          },
        ]
      }
      observateurs_rectoraux: {
        Row: {
          actif: boolean
          created_at: string
          cree_par: string | null
          date_activation: string
          date_expiration: string
          email: string
          id: string
          perimetre_eple_ids: string[]
          perimetre_groupement_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          cree_par?: string | null
          date_activation?: string
          date_expiration?: string
          email: string
          id?: string
          perimetre_eple_ids?: string[]
          perimetre_groupement_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          cree_par?: string | null
          date_activation?: string
          date_expiration?: string
          email?: string
          id?: string
          perimetre_eple_ids?: string[]
          perimetre_groupement_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      passations_sgeple: {
        Row: {
          attestation_remise_url: string | null
          created_at: string
          created_by: string | null
          date_dernier_jour_sortant: string | null
          date_effective_passation: string | null
          date_premier_jour_entrant: string | null
          date_validation_ac: string | null
          date_validation_ordo: string | null
          dossiers_en_cours: Json
          establishment_id: string
          habilitations_a_creer: Json
          habilitations_a_revoquer: Json
          id: string
          inventaire_dossiers: Json
          inventaire_outils: Json
          observations: string | null
          pv_passation_url: string | null
          sgeple_entrant_id: string | null
          sgeple_sortant_id: string | null
          signature_entrant_at: string | null
          signature_sortant_at: string | null
          statut: string
          updated_at: string
          validee_par_ac: string | null
          validee_par_ordo: string | null
        }
        Insert: {
          attestation_remise_url?: string | null
          created_at?: string
          created_by?: string | null
          date_dernier_jour_sortant?: string | null
          date_effective_passation?: string | null
          date_premier_jour_entrant?: string | null
          date_validation_ac?: string | null
          date_validation_ordo?: string | null
          dossiers_en_cours?: Json
          establishment_id: string
          habilitations_a_creer?: Json
          habilitations_a_revoquer?: Json
          id?: string
          inventaire_dossiers?: Json
          inventaire_outils?: Json
          observations?: string | null
          pv_passation_url?: string | null
          sgeple_entrant_id?: string | null
          sgeple_sortant_id?: string | null
          signature_entrant_at?: string | null
          signature_sortant_at?: string | null
          statut?: string
          updated_at?: string
          validee_par_ac?: string | null
          validee_par_ordo?: string | null
        }
        Update: {
          attestation_remise_url?: string | null
          created_at?: string
          created_by?: string | null
          date_dernier_jour_sortant?: string | null
          date_effective_passation?: string | null
          date_premier_jour_entrant?: string | null
          date_validation_ac?: string | null
          date_validation_ordo?: string | null
          dossiers_en_cours?: Json
          establishment_id?: string
          habilitations_a_creer?: Json
          habilitations_a_revoquer?: Json
          id?: string
          inventaire_dossiers?: Json
          inventaire_outils?: Json
          observations?: string | null
          pv_passation_url?: string | null
          sgeple_entrant_id?: string | null
          sgeple_sortant_id?: string | null
          signature_entrant_at?: string | null
          signature_sortant_at?: string | null
          statut?: string
          updated_at?: string
          validee_par_ac?: string | null
          validee_par_ordo?: string | null
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
          profile_role: string
          tour_complete: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          academy?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          profile_role?: string
          tour_complete?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          academy?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          profile_role?: string
          tour_complete?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rgpd_acces_logs: {
        Row: {
          action: string
          contexte: Json | null
          created_at: string
          fiche_id: string
          fiche_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          contexte?: Json | null
          created_at?: string
          fiche_id: string
          fiche_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          contexte?: Json | null
          created_at?: string
          fiche_id?: string
          fiche_type?: string
          id?: string
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
      vs_accompagnateurs: {
        Row: {
          created_at: string
          discipline: string | null
          email: string | null
          fonction: string
          id: string
          montant_prise_charge: number
          nom: string
          ordre_mission_url: string | null
          prenom: string
          telephone: string | null
          voyage_id: string
        }
        Insert: {
          created_at?: string
          discipline?: string | null
          email?: string | null
          fonction?: string
          id?: string
          montant_prise_charge?: number
          nom: string
          ordre_mission_url?: string | null
          prenom: string
          telephone?: string | null
          voyage_id: string
        }
        Update: {
          created_at?: string
          discipline?: string | null
          email?: string | null
          fonction?: string
          id?: string
          montant_prise_charge?: number
          nom?: string
          ordre_mission_url?: string | null
          prenom?: string
          telephone?: string | null
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_accompagnateurs_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "vs_voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_alertes: {
        Row: {
          code: string
          contexte: Json
          created_at: string
          id: string
          message: string
          niveau: string
          resolue: boolean
          resolue_at: string | null
          voyage_id: string
        }
        Insert: {
          code: string
          contexte?: Json
          created_at?: string
          id?: string
          message: string
          niveau?: string
          resolue?: boolean
          resolue_at?: string | null
          voyage_id: string
        }
        Update: {
          code?: string
          contexte?: Json
          created_at?: string
          id?: string
          message?: string
          niveau?: string
          resolue?: boolean
          resolue_at?: string | null
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_alertes_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "vs_voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_bilans: {
        Row: {
          bilan_pedagogique: string
          cloture: boolean
          created_at: string
          date_ca_bilan: string | null
          depenses_realisees: number
          id: string
          modalite_traitement: string | null
          nb_accomp_presents: number
          nb_eleves_partis: number
          numero_acte_ca_bilan: string | null
          pv_url: string | null
          recettes_realisees: number
          reliquat_par_famille: number
          resultat: number
          updated_at: string
          version: number
          voyage_id: string
        }
        Insert: {
          bilan_pedagogique?: string
          cloture?: boolean
          created_at?: string
          date_ca_bilan?: string | null
          depenses_realisees?: number
          id?: string
          modalite_traitement?: string | null
          nb_accomp_presents?: number
          nb_eleves_partis?: number
          numero_acte_ca_bilan?: string | null
          pv_url?: string | null
          recettes_realisees?: number
          reliquat_par_famille?: number
          resultat?: number
          updated_at?: string
          version?: number
          voyage_id: string
        }
        Update: {
          bilan_pedagogique?: string
          cloture?: boolean
          created_at?: string
          date_ca_bilan?: string | null
          depenses_realisees?: number
          id?: string
          modalite_traitement?: string | null
          nb_accomp_presents?: number
          nb_eleves_partis?: number
          numero_acte_ca_bilan?: string | null
          pv_url?: string | null
          recettes_realisees?: number
          reliquat_par_famille?: number
          resultat?: number
          updated_at?: string
          version?: number
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_bilans_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "vs_voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_coupons_8eur: {
        Row: {
          created_at: string
          date_envoi: string
          date_limite_reponse: string
          date_reponse: string | null
          id: string
          ine: string | null
          metadata: Json
          montant_concerne: number
          nom: string
          participant_id: string | null
          prenom: string
          reponse: string | null
          source: string
          updated_at: string
          voyage_id: string
        }
        Insert: {
          created_at?: string
          date_envoi?: string
          date_limite_reponse: string
          date_reponse?: string | null
          id?: string
          ine?: string | null
          metadata?: Json
          montant_concerne?: number
          nom: string
          participant_id?: string | null
          prenom: string
          reponse?: string | null
          source?: string
          updated_at?: string
          voyage_id: string
        }
        Update: {
          created_at?: string
          date_envoi?: string
          date_limite_reponse?: string
          date_reponse?: string | null
          id?: string
          ine?: string | null
          metadata?: Json
          montant_concerne?: number
          nom?: string
          participant_id?: string | null
          prenom?: string
          reponse?: string | null
          source?: string
          updated_at?: string
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_coupons_8eur_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "vs_voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_depenses: {
        Row: {
          bon_commande: string | null
          compte_charge: string
          created_at: string
          devis_url: string | null
          est_accompagnateur: boolean
          facture_url: string | null
          fournisseur: string
          id: string
          libelle: string
          montant_ht: number
          montant_ttc: number
          poste: string
          service_fait_date: string | null
          statut_paiement: string
          taux_tva: number
          voyage_id: string
        }
        Insert: {
          bon_commande?: string | null
          compte_charge?: string
          created_at?: string
          devis_url?: string | null
          est_accompagnateur?: boolean
          facture_url?: string | null
          fournisseur?: string
          id?: string
          libelle: string
          montant_ht?: number
          montant_ttc?: number
          poste?: string
          service_fait_date?: string | null
          statut_paiement?: string
          taux_tva?: number
          voyage_id: string
        }
        Update: {
          bon_commande?: string | null
          compte_charge?: string
          created_at?: string
          devis_url?: string | null
          est_accompagnateur?: boolean
          facture_url?: string | null
          fournisseur?: string
          id?: string
          libelle?: string
          montant_ht?: number
          montant_ttc?: number
          poste?: string
          service_fait_date?: string | null
          statut_paiement?: string
          taux_tva?: number
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_depenses_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "vs_voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_documents_generes: {
        Row: {
          docx_url: string | null
          generated_at: string
          generated_by: string | null
          id: string
          libelle: string
          metadonnees: Json
          pdf_url: string | null
          type_document: string
          voyage_id: string
        }
        Insert: {
          docx_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          libelle: string
          metadonnees?: Json
          pdf_url?: string | null
          type_document: string
          voyage_id: string
        }
        Update: {
          docx_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          libelle?: string
          metadonnees?: Json
          pdf_url?: string | null
          type_document?: string
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_documents_generes_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "vs_voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_enquetes_rectorat: {
        Row: {
          annee_scolaire: string
          commentaires_rectorat: string
          created_at: string
          date_soumission: string | null
          date_validation: string | null
          donnees: Json
          establishment_id: string
          id: string
          periode: string
          soumis_par_user_id: string | null
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annee_scolaire?: string
          commentaires_rectorat?: string
          created_at?: string
          date_soumission?: string | null
          date_validation?: string | null
          donnees?: Json
          establishment_id: string
          id?: string
          periode?: string
          soumis_par_user_id?: string | null
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annee_scolaire?: string
          commentaires_rectorat?: string
          created_at?: string
          date_soumission?: string | null
          date_validation?: string | null
          donnees?: Json
          establishment_id?: string
          id?: string
          periode?: string
          soumis_par_user_id?: string | null
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vs_jalons: {
        Row: {
          created_at: string
          date_prevue: string | null
          date_realisee: string | null
          id: string
          jours_avant_depart: number
          libelle: string
          observations: string
          ordre: number
          responsable: string
          statut: string
          voyage_id: string
        }
        Insert: {
          created_at?: string
          date_prevue?: string | null
          date_realisee?: string | null
          id?: string
          jours_avant_depart?: number
          libelle: string
          observations?: string
          ordre?: number
          responsable?: string
          statut?: string
          voyage_id: string
        }
        Update: {
          created_at?: string
          date_prevue?: string | null
          date_realisee?: string | null
          id?: string
          jours_avant_depart?: number
          libelle?: string
          observations?: string
          ordre?: number
          responsable?: string
          statut?: string
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_jalons_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "vs_voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_participants: {
        Row: {
          aide_fse: number
          bourse_deduite: number
          boursier: boolean
          classe: string
          created_at: string
          date_naissance: string | null
          date_paiement: string | null
          echelon_bourse: number | null
          fonds_social: number
          id: string
          ine: string | null
          mef: string | null
          mode_paiement: string | null
          nom: string
          numero_interne: string | null
          participation_reelle: number
          participation_theorique: number
          prenom: string
          quittance_ref: string | null
          regime: string | null
          responsables: Json
          reste_a_payer: number
          sexe: string | null
          statut_inscription: string
          updated_at: string
          voyage_id: string
        }
        Insert: {
          aide_fse?: number
          bourse_deduite?: number
          boursier?: boolean
          classe?: string
          created_at?: string
          date_naissance?: string | null
          date_paiement?: string | null
          echelon_bourse?: number | null
          fonds_social?: number
          id?: string
          ine?: string | null
          mef?: string | null
          mode_paiement?: string | null
          nom: string
          numero_interne?: string | null
          participation_reelle?: number
          participation_theorique?: number
          prenom: string
          quittance_ref?: string | null
          regime?: string | null
          responsables?: Json
          reste_a_payer?: number
          sexe?: string | null
          statut_inscription?: string
          updated_at?: string
          voyage_id: string
        }
        Update: {
          aide_fse?: number
          bourse_deduite?: number
          boursier?: boolean
          classe?: string
          created_at?: string
          date_naissance?: string | null
          date_paiement?: string | null
          echelon_bourse?: number | null
          fonds_social?: number
          id?: string
          ine?: string | null
          mef?: string | null
          mode_paiement?: string | null
          nom?: string
          numero_interne?: string | null
          participation_reelle?: number
          participation_theorique?: number
          prenom?: string
          quittance_ref?: string | null
          regime?: string | null
          responsables?: Json
          reste_a_payer?: number
          sexe?: string | null
          statut_inscription?: string
          updated_at?: string
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_participants_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "vs_voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_recettes: {
        Row: {
          created_at: string
          id: string
          imputation_compte: string
          libelle: string
          montant: number
          nature: string
          observations: string
          pj_url: string | null
          statut_encaissement: string
          statut_financeur: string
          titre_recette_num: string | null
          voyage_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          imputation_compte?: string
          libelle: string
          montant?: number
          nature?: string
          observations?: string
          pj_url?: string | null
          statut_encaissement?: string
          statut_financeur?: string
          titre_recette_num?: string | null
          voyage_id: string
        }
        Update: {
          created_at?: string
          id?: string
          imputation_compte?: string
          libelle?: string
          montant?: number
          nature?: string
          observations?: string
          pj_url?: string | null
          statut_encaissement?: string
          statut_financeur?: string
          titre_recette_num?: string | null
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_recettes_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "vs_voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_voyages: {
        Row: {
          agence_garantie: string | null
          agence_nom: string | null
          agence_siret: string | null
          caf_dispositif: string | null
          caractere: string
          classes_concernees: Json
          conditions_annulation: Json
          created_at: string
          date_ca_autorisation: string | null
          date_ca_budget: string | null
          date_ca_principe: string | null
          date_depart: string | null
          date_retour: string | null
          destination_pays: string
          destination_ville: string
          devise: string
          erasmus_avance_recue: number
          erasmus_convention_ref: string | null
          erasmus_periode_debut: string | null
          erasmus_periode_fin: string | null
          erasmus_subvention_notifiee: number
          erasmus_taux_cofi: number
          erasmus_type: string | null
          establishment_id: string
          id: string
          libelle: string
          lien_projet_etablissement: string
          montant_total_ht: number
          montant_total_ttc: number
          nb_accompagnateurs_prevus: number
          nb_eleves_prevus: number
          nombre_nuitees: number
          numero_acte_ca: string | null
          numero_acte_ca_budget: string | null
          numero_acte_ca_principe: string | null
          rattachement_adage: boolean
          reference_interne: string
          regie_avances_id: string | null
          regie_recettes_id: string | null
          responsable_pedago_id: string | null
          responsable_pedago_nom: string
          statut: string
          tags_pedago: Json
          type_projet: string
          type_sortie: string
          updated_at: string
          user_id: string
          wizard_completed: boolean
          wizard_step: number
        }
        Insert: {
          agence_garantie?: string | null
          agence_nom?: string | null
          agence_siret?: string | null
          caf_dispositif?: string | null
          caractere?: string
          classes_concernees?: Json
          conditions_annulation?: Json
          created_at?: string
          date_ca_autorisation?: string | null
          date_ca_budget?: string | null
          date_ca_principe?: string | null
          date_depart?: string | null
          date_retour?: string | null
          destination_pays?: string
          destination_ville?: string
          devise?: string
          erasmus_avance_recue?: number
          erasmus_convention_ref?: string | null
          erasmus_periode_debut?: string | null
          erasmus_periode_fin?: string | null
          erasmus_subvention_notifiee?: number
          erasmus_taux_cofi?: number
          erasmus_type?: string | null
          establishment_id: string
          id?: string
          libelle: string
          lien_projet_etablissement?: string
          montant_total_ht?: number
          montant_total_ttc?: number
          nb_accompagnateurs_prevus?: number
          nb_eleves_prevus?: number
          nombre_nuitees?: number
          numero_acte_ca?: string | null
          numero_acte_ca_budget?: string | null
          numero_acte_ca_principe?: string | null
          rattachement_adage?: boolean
          reference_interne?: string
          regie_avances_id?: string | null
          regie_recettes_id?: string | null
          responsable_pedago_id?: string | null
          responsable_pedago_nom?: string
          statut?: string
          tags_pedago?: Json
          type_projet?: string
          type_sortie?: string
          updated_at?: string
          user_id: string
          wizard_completed?: boolean
          wizard_step?: number
        }
        Update: {
          agence_garantie?: string | null
          agence_nom?: string | null
          agence_siret?: string | null
          caf_dispositif?: string | null
          caractere?: string
          classes_concernees?: Json
          conditions_annulation?: Json
          created_at?: string
          date_ca_autorisation?: string | null
          date_ca_budget?: string | null
          date_ca_principe?: string | null
          date_depart?: string | null
          date_retour?: string | null
          destination_pays?: string
          destination_ville?: string
          devise?: string
          erasmus_avance_recue?: number
          erasmus_convention_ref?: string | null
          erasmus_periode_debut?: string | null
          erasmus_periode_fin?: string | null
          erasmus_subvention_notifiee?: number
          erasmus_taux_cofi?: number
          erasmus_type?: string | null
          establishment_id?: string
          id?: string
          libelle?: string
          lien_projet_etablissement?: string
          montant_total_ht?: number
          montant_total_ttc?: number
          nb_accompagnateurs_prevus?: number
          nb_eleves_prevus?: number
          nombre_nuitees?: number
          numero_acte_ca?: string | null
          numero_acte_ca_budget?: string | null
          numero_acte_ca_principe?: string | null
          rattachement_adage?: boolean
          reference_interne?: string
          regie_avances_id?: string | null
          regie_recettes_id?: string | null
          responsable_pedago_id?: string | null
          responsable_pedago_nom?: string
          statut?: string
          tags_pedago?: Json
          type_projet?: string
          type_sortie?: string
          updated_at?: string
          user_id?: string
          wizard_completed?: boolean
          wizard_step?: number
        }
        Relationships: []
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
      user_has_establishment_access: {
        Args: { _establishment_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_entretien_party: {
        Args: { _entretien_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      acte_type:
        | "nomination_regisseur_recettes"
        | "nomination_regisseur_avances"
        | "nomination_suppleant_regie"
        | "nomination_mandataire"
        | "arrete_constitutif_regie"
        | "arrete_abrogation_regie"
        | "delegation_signature_ordo"
        | "delegation_signature_ac"
        | "abrogation_delegation"
        | "engagement_ac"
        | "pv_installation_ac"
        | "pv_remise_service_ac"
        | "lettre_mission_cicf"
        | "autre"
      agent_categorie: "A" | "B" | "C"
      agent_filiere:
        | "AENES"
        | "ITRF"
        | "Bibliotheques"
        | "SAENES"
        | "Medico_sociale"
        | "Autre"
      agent_role_principal:
        | "ac"
        | "fp"
        | "ordonnateur"
        | "ordonnateur_suppleant"
        | "sg"
        | "adjoint_gestionnaire"
        | "assistant_gestion"
        | "regisseur_recettes"
        | "regisseur_avances"
        | "suppleant_regie"
        | "magasinier"
        | "chef_cuisine"
        | "secretaire_intendance"
        | "gestionnaire_materiel"
        | "responsable_cfa"
        | "responsable_greta"
        | "correspondant_cicf"
        | "archiviste_comptable"
        | "autre"
      agent_statut:
        | "titulaire"
        | "contractuel_cdd"
        | "contractuel_cdi"
        | "detache"
        | "mis_a_disposition"
      app_role: "admin" | "agent" | "observateur_rectoral"
      bottin_categorie:
        | "rectorat"
        | "dsden"
        | "collectivite"
        | "dgfip"
        | "ddfip"
        | "ars"
        | "prefecture"
        | "police"
        | "gendarmerie"
        | "pompiers"
        | "medecine_scolaire"
        | "dsi"
        | "eafc"
        | "autre"
      civilite: "mme" | "m"
      classement_ep: "rep" | "rep_plus" | "hors_ep"
      collectivite_rattachement: "departement" | "region" | "etat"
      competence_niveau:
        | "excellent"
        | "tres_bon"
        | "satisfaisant"
        | "a_developper"
        | "insuffisant"
        | "sans_objet"
      delegation_statut: "active" | "expiree" | "abrogee"
      delegation_type:
        | "ordonnateur_general"
        | "ordonnateur_partiel"
        | "ac"
        | "fonde_pouvoir"
        | "mandataire"
      entretien_campagne_statut:
        | "preparation"
        | "ouverte"
        | "cloturee"
        | "archivee"
      entretien_mode: "presentiel" | "visio" | "hybride"
      entretien_statut:
        | "brouillon"
        | "convocation_envoyee"
        | "entretien_realise"
        | "redaction_n1"
        | "en_attente_signature_n1"
        | "notifie_agent_pour_observations"
        | "en_attente_signature_agent"
        | "en_attente_visa_n2"
        | "finalise"
        | "archive"
        | "recours_en_cours"
        | "revision_demandee"
      etablissement_type:
        | "college"
        | "lycee_general"
        | "lycee_technologique"
        | "lycee_professionnel"
        | "erea"
        | "segpa"
        | "cfa"
        | "greta"
        | "annexe"
      formation_categorie: "T1" | "T2" | "T3"
      formation_fondement: "agent" | "evaluateur" | "consensuelle"
      formation_priorite: "haute" | "moyenne" | "basse"
      import_file_type:
        | "balance"
        | "sde"
        | "sdr"
        | "grand_livre"
        | "etat_tiers"
        | "siecle_eleves"
        | "siecle_bourses"
        | "regies"
        | "paie"
        | "inconnu"
      import_status: "succes" | "ecrase" | "echec"
      objectif_atteinte:
        | "atteint"
        | "partiellement_atteint"
        | "non_atteint"
        | "sans_objet"
      profil_opale:
        | "admin_etab"
        | "ordonnateur"
        | "gestionnaire"
        | "valideur"
        | "consultation"
        | "aucun"
      recours_statut: "en_cours" | "accepte" | "rejete" | "silence_vaut_refus"
      recours_type: "revision_hierarchique" | "saisine_cap" | "saisine_ccp"
      signature_role: "n1" | "agent" | "n2"
      statut_juridique: "eple" | "epla" | "opa" | "autre"
      statut_rattachement: "actif" | "sortant" | "entrant" | "archive"
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
      acte_type: [
        "nomination_regisseur_recettes",
        "nomination_regisseur_avances",
        "nomination_suppleant_regie",
        "nomination_mandataire",
        "arrete_constitutif_regie",
        "arrete_abrogation_regie",
        "delegation_signature_ordo",
        "delegation_signature_ac",
        "abrogation_delegation",
        "engagement_ac",
        "pv_installation_ac",
        "pv_remise_service_ac",
        "lettre_mission_cicf",
        "autre",
      ],
      agent_categorie: ["A", "B", "C"],
      agent_filiere: [
        "AENES",
        "ITRF",
        "Bibliotheques",
        "SAENES",
        "Medico_sociale",
        "Autre",
      ],
      agent_role_principal: [
        "ac",
        "fp",
        "ordonnateur",
        "ordonnateur_suppleant",
        "sg",
        "adjoint_gestionnaire",
        "assistant_gestion",
        "regisseur_recettes",
        "regisseur_avances",
        "suppleant_regie",
        "magasinier",
        "chef_cuisine",
        "secretaire_intendance",
        "gestionnaire_materiel",
        "responsable_cfa",
        "responsable_greta",
        "correspondant_cicf",
        "archiviste_comptable",
        "autre",
      ],
      agent_statut: [
        "titulaire",
        "contractuel_cdd",
        "contractuel_cdi",
        "detache",
        "mis_a_disposition",
      ],
      app_role: ["admin", "agent", "observateur_rectoral"],
      bottin_categorie: [
        "rectorat",
        "dsden",
        "collectivite",
        "dgfip",
        "ddfip",
        "ars",
        "prefecture",
        "police",
        "gendarmerie",
        "pompiers",
        "medecine_scolaire",
        "dsi",
        "eafc",
        "autre",
      ],
      civilite: ["mme", "m"],
      classement_ep: ["rep", "rep_plus", "hors_ep"],
      collectivite_rattachement: ["departement", "region", "etat"],
      competence_niveau: [
        "excellent",
        "tres_bon",
        "satisfaisant",
        "a_developper",
        "insuffisant",
        "sans_objet",
      ],
      delegation_statut: ["active", "expiree", "abrogee"],
      delegation_type: [
        "ordonnateur_general",
        "ordonnateur_partiel",
        "ac",
        "fonde_pouvoir",
        "mandataire",
      ],
      entretien_campagne_statut: [
        "preparation",
        "ouverte",
        "cloturee",
        "archivee",
      ],
      entretien_mode: ["presentiel", "visio", "hybride"],
      entretien_statut: [
        "brouillon",
        "convocation_envoyee",
        "entretien_realise",
        "redaction_n1",
        "en_attente_signature_n1",
        "notifie_agent_pour_observations",
        "en_attente_signature_agent",
        "en_attente_visa_n2",
        "finalise",
        "archive",
        "recours_en_cours",
        "revision_demandee",
      ],
      etablissement_type: [
        "college",
        "lycee_general",
        "lycee_technologique",
        "lycee_professionnel",
        "erea",
        "segpa",
        "cfa",
        "greta",
        "annexe",
      ],
      formation_categorie: ["T1", "T2", "T3"],
      formation_fondement: ["agent", "evaluateur", "consensuelle"],
      formation_priorite: ["haute", "moyenne", "basse"],
      import_file_type: [
        "balance",
        "sde",
        "sdr",
        "grand_livre",
        "etat_tiers",
        "siecle_eleves",
        "siecle_bourses",
        "regies",
        "paie",
        "inconnu",
      ],
      import_status: ["succes", "ecrase", "echec"],
      objectif_atteinte: [
        "atteint",
        "partiellement_atteint",
        "non_atteint",
        "sans_objet",
      ],
      profil_opale: [
        "admin_etab",
        "ordonnateur",
        "gestionnaire",
        "valideur",
        "consultation",
        "aucun",
      ],
      recours_statut: ["en_cours", "accepte", "rejete", "silence_vaut_refus"],
      recours_type: ["revision_hierarchique", "saisine_cap", "saisine_ccp"],
      signature_role: ["n1", "agent", "n2"],
      statut_juridique: ["eple", "epla", "opa", "autre"],
      statut_rattachement: ["actif", "sortant", "entrant", "archive"],
    },
  },
} as const
