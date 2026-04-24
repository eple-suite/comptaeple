import { Routes, Route, Navigate } from "react-router-dom";
import MarchesDashboard from "./MarchesDashboard";
import MarchesList from "./MarchesList";
import MarcheNouveau from "./MarcheNouveau";
import MarcheDetail from "./MarcheDetail";
import MarcheBibliotheque from "./MarcheBibliotheque";
import MarcheFournisseurs from "./MarcheFournisseurs";
import MarcheModeEmploi from "./MarcheModeEmploi";
import MarcheParametres from "./MarcheParametres";

export default function MarchesPage() {
  return (
    <Routes>
      <Route index element={<MarchesDashboard />} />
      <Route path="dashboard" element={<MarchesDashboard />} />
      <Route path="nouveau" element={<MarcheNouveau />} />
      <Route path="liste" element={<MarchesList />} />
      <Route path="detail/:id" element={<MarcheDetail />} />
      <Route path="bibliotheque" element={<MarcheBibliotheque />} />
      <Route path="fournisseurs" element={<MarcheFournisseurs />} />
      <Route path="mode-emploi" element={<MarcheModeEmploi />} />
      <Route path="parametres" element={<MarcheParametres />} />
      <Route path="*" element={<Navigate to="/marches" replace />} />
    </Routes>
  );
}
