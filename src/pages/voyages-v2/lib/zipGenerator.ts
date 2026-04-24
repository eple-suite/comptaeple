// ════════════════════════════════════════════════════════════════
// Orchestrateur : génère les 32 docs en .docx + ZIP téléchargeable
// ════════════════════════════════════════════════════════════════
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { CATALOGUE_32, type DocumentModele } from "./documentsCatalogue";
import { buildDocxBlob, type DocxBuildContext } from "./docxBuilder";

export interface GenerationProgress {
  current: number;
  total: number;
  currentDoc?: string;
}

export async function genererTousDocuments(
  ctx: DocxBuildContext,
  selection?: string[],
  onProgress?: (p: GenerationProgress) => void
): Promise<Blob> {
  const zip = new JSZip();
  const docs = selection
    ? CATALOGUE_32.filter((d) => selection.includes(d.id))
    : CATALOGUE_32;
  const total = docs.length;
  let i = 0;
  for (const d of docs) {
    i++;
    onProgress?.({ current: i, total, currentDoc: d.titre });
    try {
      const blob = await buildDocxBlob(d.id, d.filename, ctx);
      const folder = zip.folder(folderFor(d));
      folder!.file(d.filename, blob);
    } catch (err) {
      console.error(`Erreur doc ${d.id}`, err);
      zip.file(`ERREURS/${d.filename}.txt`, `Erreur génération : ${(err as Error).message}`);
    }
  }
  // Manifest
  zip.file("MANIFEST.txt", buildManifest(ctx, docs));
  return await zip.generateAsync({ type: "blob" });
}

function folderFor(d: DocumentModele): string {
  return ({
    amont: "1_Amont",
    familles: "2_Familles",
    concurrence: "3_Mise_en_concurrence",
    budgetaire: "4_Budgetaires",
    apres: "5_Apres_voyage",
  } as const)[d.categorie];
}

function buildManifest(ctx: DocxBuildContext, docs: DocumentModele[]): string {
  const lignes = [
    `DOSSIER VOYAGE SCOLAIRE — ${ctx.voyage.libelle}`,
    `Référence : ${ctx.voyage.reference_interne}`,
    `Établissement : ${ctx.etablissement.nom}`,
    `Généré le : ${ctx.meta.date_generation} par ${ctx.meta.auteur}`,
    "",
    `${docs.length} document(s) — voir liste ci-dessous :`,
    "",
  ];
  docs.forEach((d) => {
    lignes.push(
      `${String(d.numero).padStart(2, "0")}. [${d.obligatoire ? "OBLIG" : "FACULT"}] ${d.titre}`
    );
    if (d.reference_legale) lignes.push(`     Réf : ${d.reference_legale}`);
    lignes.push(`     Fichier : ${folderFor(d)}/${d.filename}`);
    lignes.push("");
  });
  return lignes.join("\n");
}

export async function telechargerZipVoyage(
  ctx: DocxBuildContext,
  selection?: string[],
  onProgress?: (p: GenerationProgress) => void
): Promise<void> {
  const blob = await genererTousDocuments(ctx, selection, onProgress);
  const safeName = (ctx.voyage.libelle || "voyage").replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40);
  saveAs(blob, `Dossier_${safeName}_${Date.now()}.zip`);
}