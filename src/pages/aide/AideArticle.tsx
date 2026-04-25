import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Printer, Scale } from "lucide-react";
import { getArticleBySlug, articlesByModule } from "@/lib/aide/search";
import { exportArticlePdf } from "@/lib/aide/pdfExport";
import { MarkdownView } from "@/lib/aide/markdown";
import { MODULES } from "@/data/aide/types";

const niveauMap: Record<string, { label: string; cls: string }> = {
  debutant: { label: "Débutant", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  confirme: { label: "Confirmé", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  expert: { label: "Expert", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  transverse: { label: "Transverse", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
};

export default function AideArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = slug ? getArticleBySlug(slug) : null;

  if (!article) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Article introuvable.</p>
        <Button variant="link" onClick={() => navigate("/aide")}><ArrowLeft className="h-4 w-4 mr-1" /> Retour au mode d'emploi</Button>
      </div>
    );
  }

  const moduleLabel = MODULES.find((m) => m.id === article.module)?.label ?? article.module;
  const niveau = niveauMap[article.niveau];
  const sameModule = articlesByModule(article.module).filter((a) => a.slug !== article.slug);

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-4">
      {/* Breadcrumb / actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/aide" className="hover:text-primary">Mode d'emploi</Link>
          <span>/</span>
          <Link to={`/aide/module/${article.module}`} className="hover:text-primary">{moduleLabel}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{article.titre}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => exportArticlePdf(article)}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Imprimer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{moduleLabel}</Badge>
            <Badge className={niveau.cls}>{niveau.label}</Badge>
          </div>
          <CardTitle className="text-2xl">{article.titre}</CardTitle>
          {article.resume && <p className="text-sm text-muted-foreground mt-2">{article.resume}</p>}
        </CardHeader>
        <CardContent className="pt-6">
          <MarkdownView source={article.contenu_md} />
        </CardContent>
      </Card>

      {article.references_legales.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Références légales</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {article.references_legales.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}

      {sameModule.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Autres fiches du module</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {sameModule.map((a) => (
                <li key={a.slug}>
                  <Link to={`/aide/article/${a.slug}`} className="text-sm hover:text-primary hover:underline">
                    → {a.titre}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}