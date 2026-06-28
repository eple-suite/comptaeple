import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CHANGELOG, type NouveauteTag } from "@/lib/changelog";

const TAG_VARIANT: Record<NouveauteTag, "default" | "secondary" | "outline" | "destructive"> = {
  Fondations: "default",
  Design: "secondary",
  Métier: "outline",
  Documents: "outline",
  Sécurité: "destructive",
};

export default function Nouveautes() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        icon={Sparkles}
        title="Nouveautés"
        description="Les évolutions de la plateforme, lot par lot"
        showEstablishment={false}
      />

      <div className="relative space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
        {CHANGELOG.map((release) => (
          <div key={release.version} className="relative pl-8">
            <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-background" />
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold font-display">{release.titre}</h2>
              <Badge variant="outline" className="text-[10px] font-mono">v{release.version}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(release.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <Card className="mt-2 shadow-card">
              <CardContent className="p-4 space-y-2.5">
                {release.nouveautes.map((n, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Badge variant={TAG_VARIANT[n.tag]} className="text-[9px] shrink-0 mt-0.5">{n.tag}</Badge>
                    <p className="text-sm text-foreground/90 leading-snug">{n.texte}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
