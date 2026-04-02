import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/print.css";
import { migrateLocalStorageToIDB } from "@/lib/idbStorage";

// One-time migration of persisted data from localStorage to IndexedDB
migrateLocalStorageToIDB(['cofieple-store']).catch(() => {});

createRoot(document.getElementById("root")!).render(<App />);
