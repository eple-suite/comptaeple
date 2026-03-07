import { motion } from "framer-motion";
import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/voyages": "Voyages scolaires",
  "/fonds-sociaux": "Fonds sociaux",
  "/satd": "SATD",
  "/credit-nourriture": "Crédit nourriture",
  "/parametres": "Paramètres",
};

const ComingSoon = () => {
  const { pathname } = useLocation();
  const title = titles[pathname] || "Module";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Construction className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold font-display">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Ce module est en cours de développement. Il sera disponible prochainement avec toutes les fonctionnalités Open Académie améliorées.
        </p>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
