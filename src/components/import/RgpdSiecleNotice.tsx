// ═══════════════════════════════════════════════════════════════
// Mention RGPD obligatoire pour import SIECLE (élèves / bourses)
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Shield, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RGPD_SIECLE_MENTION } from '@/lib/import';

interface RgpdSiecleNoticeProps {
  onAccept: () => void;
  onCancel: () => void;
}

export function RgpdSiecleNotice({ onAccept, onCancel }: RgpdSiecleNoticeProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Information RGPD — Import SIECLE / Bourses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Cet import contient des <strong>données nominatives mineures</strong> et
          potentiellement <strong>sensibles</strong> (régime, boursier, responsables légaux).
        </p>
        <dl className="space-y-2 text-xs bg-background/60 rounded-md p-3 border">
          <div><dt className="font-semibold inline">Finalité : </dt><dd className="inline">{RGPD_SIECLE_MENTION.finalite}</dd></div>
          <div><dt className="font-semibold inline">Base légale : </dt><dd className="inline">{RGPD_SIECLE_MENTION.baseLegale}</dd></div>
          <div><dt className="font-semibold inline">Conservation : </dt><dd className="inline">{RGPD_SIECLE_MENTION.conservation}</dd></div>
          <div><dt className="font-semibold inline">Destinataires : </dt><dd className="inline">{RGPD_SIECLE_MENTION.destinataires}</dd></div>
          <div><dt className="font-semibold inline">Droits des personnes : </dt><dd className="inline">{RGPD_SIECLE_MENTION.droits}</dd></div>
        </dl>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
          <span className="text-xs">
            J'atteste avoir pris connaissance des mesures RGPD et agir dans le cadre d'une mission de service public.
          </span>
        </label>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
          <Button size="sm" disabled={!accepted} onClick={onAccept}>
            <Check className="h-4 w-4 mr-1" /> Accepter et importer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}