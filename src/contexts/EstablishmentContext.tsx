import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

export interface Establishment {
  id: string;
  uai: string;
  name: string;
  type: string;
  academy: string;
  city: string;
  opale_number: string;
}

interface EstablishmentContextType {
  establishments: Establishment[];
  selectedEstablishment: Establishment | null;
  selectEstablishment: (est: Establishment) => void;
  isLoading: boolean;
  refetch: () => void;
}

const EstablishmentContext = createContext<EstablishmentContextType | undefined>(undefined);

const STORAGE_KEY = "cockpit_selected_establishment_id";

export function EstablishmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);

  const { data: establishments = [], isLoading, refetch } = useQuery({
    queryKey: ["user-establishments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_establishments")
        .select("establishment_id, establishments(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((row: any) => row.establishments as Establishment);
    },
    enabled: !!user,
  });

  // Auto-select from localStorage or first establishment
  useEffect(() => {
    if (establishments.length === 0) {
      setSelectedEstablishment(null);
      return;
    }
    const savedId = localStorage.getItem(STORAGE_KEY);
    const saved = savedId ? establishments.find((e) => e.id === savedId) : null;
    if (saved) {
      setSelectedEstablishment(saved);
    } else if (!selectedEstablishment || !establishments.find((e) => e.id === selectedEstablishment.id)) {
      setSelectedEstablishment(establishments[0]);
    }
  }, [establishments]);

  const selectEstablishment = (est: Establishment) => {
    setSelectedEstablishment(est);
    localStorage.setItem(STORAGE_KEY, est.id);
  };

  return (
    <EstablishmentContext.Provider value={{ establishments, selectedEstablishment, selectEstablishment, isLoading, refetch }}>
      {children}
    </EstablishmentContext.Provider>
  );
}

export function useEstablishment() {
  const context = useContext(EstablishmentContext);
  if (!context) throw new Error("useEstablishment must be used within EstablishmentProvider");
  return context;
}
