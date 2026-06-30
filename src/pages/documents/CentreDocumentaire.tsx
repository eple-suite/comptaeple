import { Archive, Download, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { useDocumentsStore, TYPE_DOCUMENT_LABELS, type DocumentArchive } from "@/lib/documents/store";
import { telechargerArchive, supprimerArchive } from "@/lib/documents/archiver";

// Centre documentaire (#44-46) : tous les actes générés, archivés, recherchables,
// ré-exportables, rattachés à l'établissement et à l'exercice.
export default function CentreDocumentaire() {
  const documents = useDocumentsStore((s) => s.documents);

  const columns: DataTableColumn<DocumentArchive>[] = [
    { key: "dateCreation", header: "Date", sortable: true, className: "w-28",
      accessor: (d) => d.dateCreation,
      render: (d) => new Date(d.dateCreation).toLocaleDateString("fr-FR") },
    { key: "type", header: "Type", sortable: true,
      accessor: (d) => TYPE_DOCUMENT_LABELS[d.type],
      render: (d) => TYPE_DOCUMENT_LABELS[d.type] },
    { key: "titre", header: "Intitulé", sortable: true },
    { key: "etablissementNom", header: "Établissement", sortable: true,
      accessor: (d) => d.etablissementNom ?? "", render: (d) => d.etablissementNom ?? "—" },
    { key: "exercice", header: "Exercice", sortable: true, className: "text-center w-24",
      accessor: (d) => d.exercice ?? 0, render: (d) => d.exercice ?? "—" },
    { key: "actions", header: "", className: "text-right w-20",
      render: (d) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Télécharger"
            onClick={() => telechargerArchive(d.id, d.fileName)}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label="Supprimer"
            onClick={() => supprimerArchive(d.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Archive}
        title="Centre documentaire"
        description="Actes générés — archivés, recherchables, ré-exportables"
        showEstablishment={false}
      />
      <DataTable
        columns={columns}
        data={documents}
        rowKey={(d) => d.id}
        csvFileName="centre_documentaire"
        searchPlaceholder="Rechercher un acte (type, intitulé, établissement)…"
        emptyTitle="Aucun acte archivé"
        emptyDescription="Les rapports d'audit, lettres d'observations et autres actes générés y seront classés automatiquement."
      />
    </div>
  );
}
