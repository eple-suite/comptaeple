// Archivage des actes générés (#45) : le PDF (data-URI base64) est stocké en
// IndexedDB, ses métadonnées dans le store. Ré-export et suppression depuis le
// centre documentaire.

import type jsPDF from "jspdf";
import { idbStorage } from "@/lib/idbStorage";
import { useDocumentsStore, type DocumentArchive, type TypeDocument } from "./store";

const blobKey = (id: string) => `doc_archive_${id}`;
const uid = () => `doc-${Math.floor(Math.random() * 1e12).toString(36)}-${Date.now().toString(36)}`;

interface ArchiveMeta {
  type: TypeDocument;
  titre: string;
  fileName: string;
  etablissementId?: string;
  etablissementNom?: string;
  exercice?: number;
}

/** Archive un document jsPDF (sans déclencher le téléchargement). */
export async function archiverPdf(doc: jsPDF, meta: ArchiveMeta): Promise<string> {
  const id = uid();
  const datauri = doc.output("datauristring");
  await idbStorage.setItem(blobKey(id), datauri);
  const record: DocumentArchive = { id, dateCreation: new Date().toISOString(), ...meta };
  useDocumentsStore.getState().addDocument(record);
  return id;
}

/** Re-télécharge un acte archivé depuis IndexedDB. */
export async function telechargerArchive(id: string, fileName: string): Promise<boolean> {
  const datauri = await idbStorage.getItem(blobKey(id));
  if (!datauri) return false;
  const a = document.createElement("a");
  a.href = datauri;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}

/** Supprime un acte archivé (métadonnées + blob IndexedDB). */
export async function supprimerArchive(id: string): Promise<void> {
  await idbStorage.removeItem(blobKey(id));
  useDocumentsStore.getState().removeDocument(id);
}
