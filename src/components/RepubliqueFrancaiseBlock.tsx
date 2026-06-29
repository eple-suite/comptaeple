// Bloc institutionnel sobre (amélioration #19, variante DSFR) : liseré tricolore
// + mention « République Française » et identité de l'agence comptable.
export function RepubliqueFrancaiseBlock({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-1.5 flex-col overflow-hidden rounded-sm shrink-0" aria-hidden="true">
        <span className="flex-1" style={{ backgroundColor: "#000091" }} />
        <span className="flex-1 bg-white" />
        <span className="flex-1" style={{ backgroundColor: "#e1000f" }} />
      </div>
      <div className="leading-tight min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wide text-sidebar-foreground/80">
          République Française
        </p>
        {subtitle && (
          <p className="text-[8px] uppercase tracking-wider text-sidebar-foreground/45 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
