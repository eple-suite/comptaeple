import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ne pas précharger les dépendances lourdes (export PDF/Office, graphiques) :
    // elles ne sont chargées qu'à l'ouverture des pages qui les utilisent.
    modulePreload: {
      resolveDependencies: (_url: string, deps: string[]) =>
        deps.filter((d) => !/vendor-(pdf|charts|xlsx|docx)/.test(d)),
    },
    rollupOptions: {
      output: {
        // Sépare les grosses dépendances pour alléger le bundle initial.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["recharts"],
          "vendor-xlsx": ["xlsx"],
          "vendor-docx": ["docx"],
          "vendor-pdf": ["jspdf", "jspdf-autotable"],
        },
      },
    },
  },
}));
