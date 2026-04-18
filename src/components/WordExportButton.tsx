import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEstablishmentBranding } from "@/hooks/useEstablishmentBranding";
import { buildWordReport, type WordSection } from "@/lib/wordReportBuilder";
import { toast } from "sonner";

interface WordExportButtonProps {
  title: string;
  subtitle?: string;
  filename: string;
  sections: WordSection[] | (() => WordSection[] | Promise<WordSection[]>);
  orientation?: "portrait" | "landscape";
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
  label?: string;
  className?: string;
}

export function WordExportButton({
  title,
  subtitle,
  filename,
  sections,
  orientation = "portrait",
  size = "sm",
  variant = "outline",
  label = "Word",
  className,
}: WordExportButtonProps) {
  const { branding } = useEstablishmentBranding();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const resolvedSections = typeof sections === "function" ? await sections() : sections;
      await buildWordReport({
        title,
        subtitle,
        branding,
        orientation,
        filename,
        sections: resolvedSections,
      });
      toast.success("Rapport Word généré");
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur génération Word : " + (e.message || ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size={size} variant={variant} onClick={handleClick} disabled={busy} className={className}>
      {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
      {label}
    </Button>
  );
}
