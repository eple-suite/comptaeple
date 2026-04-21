// Stub temporaire pour les routes en cours de construction (sprints suivants)
import { ArrowLeft, Construction } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function StubPage({ title, sprint }: { title: string; sprint: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/fonds-sociaux/v2"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold font-display">{title}</h1>
      </div>
      <Card>
        <CardContent className="p-12 text-center space-y-3">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cette section sera disponible après le {sprint}.</p>
        </CardContent>
      </Card>
    </div>
  );
}