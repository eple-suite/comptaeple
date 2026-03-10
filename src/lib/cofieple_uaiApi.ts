// ═══════════════════════════════════════════════════════════════════
// COFIEPLE — API UAI (Annuaire Éducation nationale)
// Source : data.education.gouv.fr — Données ouvertes
// ═══════════════════════════════════════════════════════════════════

export interface EtablissementUAI {
  uai: string;
  nom: string;
  type: 'lycee' | 'lycee_pro' | 'college' | 'legt' | 'erea' | 'autre';
  adresse: string;
  codePostal: string;
  commune: string;
  academie: string;
  regionAcademique: string;
  departement: string;
  telephone?: string;
}

export function validerFormatUAI(uai: string): boolean {
  return /^[0-9]{7}[A-Z]$/i.test(uai.trim());
}

export async function rechercherParUAI(uai: string): Promise<EtablissementUAI | null> {
  const uaiClean = uai.trim().toUpperCase();
  if (!validerFormatUAI(uaiClean)) {
    throw new Error(`Format UAI invalide : "${uai}". Attendu : 7 chiffres + 1 lettre (ex : 9710746J).`);
  }

  const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?where=identifiant_de_l_etablissement%3D%22${uaiClean}%22&limit=1`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Erreur API Éducation nationale : ${resp.status}`);

  const data = await resp.json();
  if (!data.results || data.results.length === 0) return null;

  const rec = data.results[0];

  const typeMap: Record<string, EtablissementUAI['type']> = {
    'Lycée': 'lycee', 'Lycée professionnel': 'lycee_pro',
    'Lycée général': 'lycee', 'Lycée technologique': 'legt',
    'LEGT': 'legt', 'Collège': 'college', 'EREA': 'erea',
  };

  return {
    uai: uaiClean,
    nom: rec.nom_etablissement || '',
    type: typeMap[rec.libelle_nature] || 'autre',
    adresse: [rec.adresse_1, rec.adresse_2].filter(Boolean).join(', '),
    codePostal: rec.code_postal || '',
    commune: rec.nom_commune || '',
    academie: `Académie de ${rec.libelle_academie || ''}`,
    regionAcademique: `Région académique ${rec.libelle_region_academique || ''}`,
    departement: rec.nom_departement || '',
    telephone: rec.telephone || '',
  };
}
