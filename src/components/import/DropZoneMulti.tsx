// ═══════════════════════════════════════════════════════════════
// Zone de dépôt multi-fichiers avec détection auto du type
// ═══════════════════════════════════════════════════════════════

import { useCallback, useState } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneMultiProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZoneMulti({ onFiles, disabled }: DropZoneMultiProps) {
  const [active, setActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setActive(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }, [onFiles, disabled]);

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed p-10 text-center transition-colors',
        active && !disabled ? 'border-primary bg-primary/5' : 'border-border bg-card',
        disabled && 'opacity-50 pointer-events-none',
      )}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setActive(true); }}
      onDragLeave={() => setActive(false)}
      onDrop={handleDrop}
    >
      <div className={cn(
        'mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-3',
        active ? 'bg-primary/20' : 'bg-muted',
      )}>
        <FileUp className={cn('h-8 w-8', active ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <p className="font-semibold">
        {active ? 'Déposez les fichiers ici' : 'Glissez-déposez un ou plusieurs fichiers'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        CSV, XLS, XLSX • Détection automatique du type • Max 20 Mo / fichier
      </p>
      <label className="mt-4 inline-flex">
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          multiple
          disabled={disabled}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) onFiles(files);
            e.target.value = '';
          }}
          className="hidden"
        />
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent">
          <Upload className="h-4 w-4" /> Parcourir
        </span>
      </label>
    </div>
  );
}