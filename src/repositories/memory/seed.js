import { readFileSync } from "node:fs";

// Quelques ruches de deux sites, copiées du jeu de données.
export const SEED_HIVES = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "inactive" },
  { id: "SN-KOLD-001", site_id: "SN-KOLD", status: "active" },
  { id: "SN-KOLD-002", site_id: "SN-KOLD", status: "active" },
];

// Le chemin est relatif à CE fichier (src/repositories/memory/), pas au dossier courant.
const FICHIER = new URL("../../../data/mesures-SN-CASA-2026-10-31.ndjson", import.meta.url);

// Mesures du fichier d'une journée, limitées aux ruches connues. Lu une fois, au démarrage.
export function loadSeedMeasures(hiveIds) {
  const ids = new Set(hiveIds);
  return readFileSync(FICHIER, "utf8")
    .split("\n")
    .filter((ligne) => ligne.trim() !== "")
    .map((ligne) => JSON.parse(ligne))
    .filter((m) => ids.has(m.hive_id));
}
