// CompteM96Combobox — saisie assistée d'un compte d'imputation M9-6.
// Liste de suggestions (datalist) issue de la nomenclature + validation
// (6 chiffres recommandés ; alerte si hors nomenclature). N'empêche jamais
// une saisie légitime (le plan Op@le va jusqu'à 6 chiffres).
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NOMENCLATURE_M96, trouverCompte } from "@/lib/m96nomenclature";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  /** Filtre par classe (ex. 6 = charges, 7 = produits). */
  classe?: number;
  /** Filtre par sens d'imputation. */
  imputation?: "depenses" | "recettes";
  placeholder?: string;
  className?: string;
}

const LIST_ID = "m96-comptes-list";

export function CompteM96Combobox({ value, onChange, label, classe, imputation, placeholder = "ex. 6571", className }: Props) {
  const options = NOMENCLATURE_M96.filter((c) => {
    if (classe != null && c.classe !== classe) return false;
    if (imputation === "depenses" && c.imputationDepenses === false) return false;
    if (imputation === "recettes" && c.imputationRecettes === false) return false;
    return true;
  });
  const v = (value || "").trim();
  const connu = !!trouverCompte(v);
  const sixChiffres = /^\d{6}$/.test(v);
  const alerte = v.length > 0 && !connu && !sixChiffres
    ? "Compte non reconnu et ≠ 6 chiffres — vérifiez la nomenclature M9-6."
    : null;

  return (
    <div className={className}>
      {label && <Label className="text-xs">{label}</Label>}
      <Input
        list={LIST_ID}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className="font-mono"
        inputMode="numeric"
      />
      <datalist id={LIST_ID}>
        {options.map((c) => <option key={c.numero} value={c.numero}>{c.numero} — {c.libelle}</option>)}
      </datalist>
      {connu && <p className="text-[11px] text-success mt-1">{trouverCompte(v)?.libelle}</p>}
      {alerte && <p className="text-[11px] text-warning mt-1">{alerte}</p>}
    </div>
  );
}
