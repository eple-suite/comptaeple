import { Textarea } from '@/components/ui/textarea';
import { SaveIndicator } from '@/components/SaveIndicator';

export function CommentaireBox({
  label, value, onChange, status, lastSaved,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  status?: 'idle' | 'saving' | 'saved';
  lastSaved?: Date | null;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">💬 {label}</span>
        {status && <SaveIndicator status={status} lastSaved={lastSaved ?? null} />}
      </div>
      <Textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder="Saisissez votre commentaire…" rows={3}
        className="bg-muted/30 text-sm" />
    </div>
  );
}

export function SectionTitre({ numero, title }: { numero: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-4 border-b-2 border-primary/20 pb-2">
      <span className="bg-primary text-primary-foreground text-xs font-black px-2.5 py-1 rounded-lg">{numero}</span>
      <h2 className="text-sm font-black tracking-wide uppercase">{title}</h2>
    </div>
  );
}
