// Point central de remontée d'erreurs (amélioration #1 / #47).
// Branché sur Sentry dès qu'un client est installé : on appelle window.Sentry
// s'il existe, sinon log console en dev et no-op silencieux en prod.
// Centraliser ici évite d'éparpiller la logique de report dans les boundaries.

type ErrorContext = Record<string, unknown>;

export function reportError(error: unknown, context?: ErrorContext): void {
  const sentry = (globalThis as { Sentry?: { captureException?: (e: unknown, o?: unknown) => void } }).Sentry;
  if (sentry?.captureException) {
    sentry.captureException(error, context ? { extra: context } : undefined);
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error("[reportError]", error, context ?? "");
  }
}
