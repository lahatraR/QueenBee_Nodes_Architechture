import { readFileSync } from "node:fs";

// Quelques ruches de deux sites, copiées du jeu de données.
export const hives = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "inactive" },
  { id: "SN-KOLD-001", site_id: "SN-KOLD", status: "active" },
  { id: "SN-KOLD-002", site_id: "SN-KOLD", status: "active" },
];

// Mesures préchargées depuis le fichier d'une journée (96 par ruche SN-CASA),
// pour pouvoir tester la pagination. Le chemin est relatif à CE fichier, pas au dossier courant.
const FICHIER = new URL("../../data/mesures-SN-CASA-2026-10-31.ndjson", import.meta.url);
const ids = new Set(hives.map((h) => h.id));

export const measures = readFileSync(FICHIER, "utf8")
  .split("\n")
  .filter((ligne) => ligne.trim() !== "")
  .map((ligne) => JSON.parse(ligne))
  .filter((m) => ids.has(m.hive_id));

// Les inspections reçues, ajoutées par POST /api/hives/:id/inspections.
export const inspections = [];
