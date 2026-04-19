import { useState, useEffect, useRef } from "react";
import { Palette, Upload, Save, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useEstablishmentBranding } from "@/hooks/useEstablishmentBranding";
import { useEstablishment } from "@/contexts/EstablishmentContext";
import { toast } from "sonner";

export function BrandingCard() {
  const { selectedEstablishment } = useEstablishment();
  const { branding, logoUrl, save, saving, uploadLogo } = useEstablishmentBranding();
  const [form, setForm] = useState({
    full_name: "",
    address: "",
    postal_code: "",
    city: "",
    phone: "",
    email: "",
    footer_text: "",
    signataire_ordonnateur: "",
    signataire_agent_comptable: "",
    primary_color: "#254478",
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (branding) {
      setForm({
        full_name: branding.full_name || "",
        address: branding.address || "",
        postal_code: branding.postal_code || "",
        city: branding.city || "",
        phone: branding.phone || "",
        email: branding.email || "",
        footer_text: branding.footer_text || "",
        signataire_ordonnateur: branding.signataire_ordonnateur || "",
        signataire_agent_comptable: branding.signataire_agent_comptable || "",
        primary_color: branding.primary_color || "#254478",
      });
    }
  }, [branding]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo trop volumineux (max 2 Mo)");
      return;
    }
    setUploading(true);
    try {
      await uploadLogo(file);
      toast.success("Logo téléversé");
    } catch (err: any) {
      toast.error(err.message || "Erreur upload logo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await save({ logo_url: null });
      toast.success("Logo retiré");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  const handleSave = async () => {
    try {
      await save(form);
      toast.success("Personnalisation enregistrée");
    } catch (err: any) {
      toast.error(err.message || "Erreur sauvegarde");
    }
  };

  if (!selectedEstablishment) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Personnalisation des rapports</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un établissement pour personnaliser logo, entête et signataires des rapports.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">
            Personnalisation des rapports
            <span className="ml-2 text-muted-foreground font-normal">
              — {selectedEstablishment.name}
            </span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-muted-foreground">
          Ces éléments apparaîtront sur tous les rapports Word et PDF générés depuis l'application :
          logo en entête, nom de l'établissement, coordonnées, signataires en bas de page.
        </p>

        {/* Logo */}
        <div>
          <Label className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-1.5 mb-2">
            <ImageIcon className="h-3.5 w-3.5" /> Logo de l'établissement
          </Label>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                {branding?.logo_url ? "Remplacer le logo" : "Téléverser un logo"}
              </Button>
              {branding?.logo_url && (
                <Button size="sm" variant="ghost" onClick={handleRemoveLogo} className="text-destructive">
                  <X className="h-3.5 w-3.5 mr-1" /> Retirer
                </Button>
              )}
              <p className="text-[10px] text-muted-foreground">PNG, JPG, WEBP ou SVG — max 2 Mo</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Entête */}
        <div>
          <Label className="text-xs font-bold uppercase tracking-wide text-primary mb-2 block">
            Entête des rapports
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs">Nom complet (officiel)</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder={`Ex : ${selectedEstablishment.name}`}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Adresse</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="N° et nom de rue"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Code postal</Label>
              <Input
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                placeholder="97110"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Ville</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Pointe-à-Pitre"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0590 ..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ce.uai@ac-..."
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Signataires */}
        <div>
          <Label className="text-xs font-bold uppercase tracking-wide text-primary mb-2 block">
            Signataires (pied de page)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Ordonnateur (chef d'établissement)</Label>
              <Input
                value={form.signataire_ordonnateur}
                onChange={(e) => setForm({ ...form, signataire_ordonnateur: e.target.value })}
                placeholder="Prénom NOM"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Agent comptable</Label>
              <Input
                value={form.signataire_agent_comptable}
                onChange={(e) => setForm({ ...form, signataire_agent_comptable: e.target.value })}
                placeholder="Prénom NOM"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Mention de pied de page</Label>
              <Input
                value={form.footer_text}
                onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
                placeholder="Ex : Document interne — Diffusion restreinte"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Couleur principale (entête)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  placeholder="#254478"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Enregistrer la personnalisation
        </Button>
      </CardContent>
    </Card>
  );
}
