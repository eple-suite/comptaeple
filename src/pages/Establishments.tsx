import { motion } from "framer-motion";
import { Building2, Search, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const establishments = [
  { uai: "0910620T", name: "Lycée Jean Moulin", type: "Lycée", academy: "Versailles", city: "Torcy" },
  { uai: "0930123A", name: "Collège Victor Hugo", type: "Collège", academy: "Créteil", city: "Montreuil" },
  { uai: "0131234B", name: "LP Mistral", type: "LP", academy: "Aix-Marseille", city: "Marseille" },
  { uai: "0750001C", name: "GRETA Paris Centre", type: "GRETA", academy: "Paris", city: "Paris" },
];

const Establishments = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display">Établissements</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion multi-établissements par code UAI</p>
      </motion.div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par code UAI ou nom..." className="pl-10" />
        </div>
        <Button className="gradient-primary border-0">
          <Building2 className="h-4 w-4 mr-1" /> Ajouter
        </Button>
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
              {establishments.map((e) => (
                <TableRow key={e.uai} className="cursor-pointer hover:bg-muted/50">
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Establishments;
