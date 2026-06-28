import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/reportError";

interface Props {
  children: ReactNode;
  /** Nom du segment (module) pour le message + le log. */
  segment?: string;
  /** UI de repli personnalisée (sinon repli par défaut). */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// ErrorBoundary global / par segment (amélioration #1) : aucun crash ne doit
// produire un écran blanc. Affiche un repli + remonte l'incident via reportError.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    reportError(error, { segment: this.props.segment, componentStack: info.componentStack });
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-4 p-10 text-center min-h-[40vh]">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Une erreur est survenue</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.props.segment
              ? `Le module « ${this.props.segment} » a rencontré un problème.`
              : "Cette section a rencontré un problème."}{" "}
            L'incident a été enregistré. Vos données ne sont pas perdues.
          </p>
          {this.state.error?.message && (
            <p className="text-xs font-mono text-muted-foreground/70 mt-2 max-w-md break-words">
              {this.state.error.message}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={this.reset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Réessayer
          </Button>
          <Button size="sm" onClick={() => window.location.assign("/")}>
            <Home className="h-3.5 w-3.5 mr-1" /> Accueil
          </Button>
        </div>
      </div>
    );
  }
}
