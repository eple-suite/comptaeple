import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle, Flag } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 — Route inconnue :", location.pathname);
  }, [location.pathname]);

  const reportBrokenLink = () => {
    console.warn("[BROKEN_LINK_REPORT]", {
      path: location.pathname,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    });
    alert("Merci, ce lien cassé a été signalé (consultez la console pour le détail).");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6">
      <div className="max-w-md w-full text-center bg-card border rounded-lg p-8 shadow-sm">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="mb-2 text-lg text-muted-foreground">Page introuvable</p>
        <p className="mb-6 text-sm text-muted-foreground break-all">
          Chemin demandé : <code className="bg-muted px-1.5 py-0.5 rounded">{location.pathname}</code>
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild>
            <Link to="/"><Home className="h-4 w-4 mr-2" />Retour à l'accueil</Link>
          </Button>
          <Button variant="outline" onClick={reportBrokenLink}>
            <Flag className="h-4 w-4 mr-2" />Signaler ce lien cassé
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
