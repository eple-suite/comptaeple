// ═══════════════════════════════════════════════════════════════
// Génération automatique du rétroplanning d'un marché en
// remontant depuis la date de notification cible
// ═══════════════════════════════════════════════════════════════

import type { ProcedureCalculee } from "../types";

export interface JalonTemplate {
  ordre: number;
  libelle: string;
  daysBeforeNotif: number; // jours avant la notif cible
  responsable: string;
}

const TEMPLATES: Record<ProcedureCalculee, JalonTemplate[]> = {
  dispense: [
    { ordre: 1, libelle: "Sollicitation des devis", daysBeforeNotif: 15, responsable: "Service demandeur" },
    { ordre: 2, libelle: "Choix du fournisseur et émission du bon de commande", daysBeforeNotif: 5, responsable: "Ordonnateur" },
    { ordre: 3, libelle: "Notification au titulaire", daysBeforeNotif: 0, responsable: "Ordonnateur" },
  ],
  mapa: [
    { ordre: 1, libelle: "Validation du dossier de consultation", daysBeforeNotif: 35, responsable: "Ordonnateur" },
    { ordre: 2, libelle: "Publication de la consultation", daysBeforeNotif: 30, responsable: "Service achats" },
    { ordre: 3, libelle: "Date limite de remise des offres", daysBeforeNotif: 15, responsable: "Service achats" },
    { ordre: 4, libelle: "Analyse des offres et rapport", daysBeforeNotif: 10, responsable: "Commission" },
    { ordre: 5, libelle: "Décision d'attribution", daysBeforeNotif: 5, responsable: "Ordonnateur" },
    { ordre: 6, libelle: "Information aux candidats non retenus", daysBeforeNotif: 4, responsable: "Service achats" },
    { ordre: 7, libelle: "Notification au titulaire", daysBeforeNotif: 0, responsable: "Ordonnateur" },
  ],
  mapa_publicite: [
    { ordre: 1, libelle: "Validation du dossier de consultation", daysBeforeNotif: 50, responsable: "Ordonnateur" },
    { ordre: 2, libelle: "Publication BOAMP / JAL", daysBeforeNotif: 45, responsable: "Service achats" },
    { ordre: 3, libelle: "Date limite de remise des offres", daysBeforeNotif: 30, responsable: "Service achats" },
    { ordre: 4, libelle: "Analyse des offres et rapport", daysBeforeNotif: 20, responsable: "Commission" },
    { ordre: 5, libelle: "Décision d'attribution", daysBeforeNotif: 14, responsable: "Ordonnateur" },
    { ordre: 6, libelle: "Information aux candidats non retenus + standstill 11 j", daysBeforeNotif: 11, responsable: "Service achats" },
    { ordre: 7, libelle: "Notification au titulaire", daysBeforeNotif: 0, responsable: "Ordonnateur" },
    { ordre: 8, libelle: "Publication avis d'attribution", daysBeforeNotif: -5, responsable: "Service achats" },
  ],
  formalisee: [
    { ordre: 1, libelle: "Validation du DCE et de l'AAPC", daysBeforeNotif: 80, responsable: "Ordonnateur" },
    { ordre: 2, libelle: "Publication AAPC JOUE + BOAMP", daysBeforeNotif: 75, responsable: "Service achats" },
    { ordre: 3, libelle: "Date limite de remise des offres (35 j AAO + 10 j sécurité)", daysBeforeNotif: 45, responsable: "Service achats" },
    { ordre: 4, libelle: "Analyse des offres et rapport CAO", daysBeforeNotif: 25, responsable: "Commission" },
    { ordre: 5, libelle: "Décision d'attribution CAO", daysBeforeNotif: 15, responsable: "Ordonnateur" },
    { ordre: 6, libelle: "Information aux candidats non retenus + standstill 11 j", daysBeforeNotif: 11, responsable: "Service achats" },
    { ordre: 7, libelle: "Notification au titulaire", daysBeforeNotif: 0, responsable: "Ordonnateur" },
    { ordre: 8, libelle: "Publication avis d'attribution JOUE + BOAMP", daysBeforeNotif: -10, responsable: "Service achats" },
  ],
};

export interface JalonGenere {
  ordre: number;
  libelle: string;
  date_prevue: string; // YYYY-MM-DD
  responsable: string;
}

export function genererRetroplanning(
  procedure: ProcedureCalculee,
  dateNotificationCible: Date | string
): JalonGenere[] {
  const dNotif = typeof dateNotificationCible === "string" ? new Date(dateNotificationCible) : dateNotificationCible;
  const tpl = TEMPLATES[procedure] || [];
  return tpl.map((t) => {
    const d = new Date(dNotif);
    d.setDate(d.getDate() - t.daysBeforeNotif);
    return {
      ordre: t.ordre,
      libelle: t.libelle,
      date_prevue: d.toISOString().slice(0, 10),
      responsable: t.responsable,
    };
  });
}

/** Délai minimum (jours) entre aujourd'hui et la notif pour rester réaliste */
export function delaiMinimum(procedure: ProcedureCalculee): number {
  const tpl = TEMPLATES[procedure] || [];
  const max = tpl.reduce((m, j) => Math.max(m, j.daysBeforeNotif), 0);
  return max + 5; // marge de sécurité
}

/** Vérifie si la date de notif cible est tenable depuis aujourd'hui */
export function evaluerFaisabilite(
  procedure: ProcedureCalculee,
  dateNotifCible: Date | string,
  today: Date = new Date()
): { faisable: boolean; joursDispo: number; joursMin: number; dateMin: string } {
  const dNotif = typeof dateNotifCible === "string" ? new Date(dateNotifCible) : dateNotifCible;
  const joursDispo = Math.floor((dNotif.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const joursMin = delaiMinimum(procedure);
  const dateMin = new Date(today);
  dateMin.setDate(dateMin.getDate() + joursMin);
  return {
    faisable: joursDispo >= joursMin,
    joursDispo,
    joursMin,
    dateMin: dateMin.toISOString().slice(0, 10),
  };
}
