import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Search, MapPin, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Establishments = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ uai: "", name: "", type: "Lycée", academy: "", city: "" });
  const queryClient = useQueryClient();

  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ["establishments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("establishments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (est: typeof form) => {
      const { error } = await supabase.from("establishments").insert({
        uai: est.uai.toUpperCase(),
        name: est.name,
        type: est.type,
        academy: est.academy,
        city: est.city,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishments"] });
      toast.success("Établissement ajouté avec succès");
      setForm({ uai: "", name: "", type: "Lycée", academy: "", city: "" });
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de l'ajout");
    },
  });

  const filtered = establishments.filter(
    (e) =>
      e.uai.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Établissements</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion multi-établissements par code UAI</p>
      </motion.div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code UAI ou nom..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0">
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un établissement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Code UAI *</Label>
                <Input
                  placeholder="Ex: 0910620T"
                  value={form.uai}
                  onChange={(e) => setForm({ ...form, uai: e.target.value })}
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  placeholder="Nom de l'établissement"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lycée">Lycée</SelectItem>
                    <SelectItem value="Collège">Collège</SelectItem>
                    <SelectItem value="LP">LP</SelectItem>
                    <SelectItem value="GRETA">GRETA</SelectItem>
                    <SelectItem value="CFA">CFA</SelectItem>
                    <SelectItem value="EREA">EREA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Académie</Label>
                  <Input
                    placeholder="Ex: Aix-Marseille"
                    value={form.academy}
                    onChange={(e) => setForm({ ...form, academy: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input
                    placeholder="Ex: Marseille"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button
                className="gradient-primary border-0"
                disabled={!form.uai || !form.name || addMutation.isPending}
                onClick={() => addMutation.mutate(form)}
              >
                {addMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code UAI</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Académie</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun établissement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono font-semibold text-primary">{e.uai}</TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{e.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{e.academy}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {e.city}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">Charger</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Establishments;
