import { type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Dark mode fonctionnel (amélioration #17) : next-themes pilote la classe `dark`
// (tailwind darkMode:"class"). Capacité jusqu'ici morte faute de provider.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
