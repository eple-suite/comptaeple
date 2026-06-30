// Centre documentaire (améliorations #44-46) — registre des actes générés.
// Les métadonnées sont persistées en localStorage ; le PDF lui-même est archivé
// en IndexedDB (cf. archiver.ts) pour ne pas saturer le quota localStorage.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TypeDocument =
  | "rapport_audit" | "lettre_observations" | "pv_caisse" | "acte_regie"
  | "pv_controle" | "titre_executoire" | "decompte_charges" | "autre";

export const TYPE_DOCUMENT_LABELS: Record<TypeDocument, string> = {
  rapport_audit: "Rapport d'audit",
  lettre_observations: "Lettre d'observations",
  pv_caisse: "PV d'arrêté de caisse",
  acte_regie: "Acte de régie",
  pv_controle: "PV de contrôle interne",
  titre_executoire: "Titre exécutoire",
  decompte_charges: "Décompte de charges",
  autre: "Autre",
};

export interface DocumentArchive {
  id: string;
  type: TypeDocument;
  titre: string;
  fileName: string;
  etablissementId?: string;
  etablissementNom?: string;
  exercice?: number;
  dateCreation: string; // ISO
}

interface DocumentsState {
  documents: DocumentArchive[];
  addDocument: (doc: DocumentArchive) => void;
  removeDocument: (id: string) => void;
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set) => ({
      documents: [],
      addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
      removeDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
    }),
    { name: "documents_centre_v1" },
  ),
);
