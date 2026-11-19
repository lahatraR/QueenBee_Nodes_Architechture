// TP 1 — Lire les mesures sans bloquer la boucle d'événements. Version de départ.
//
//   GET  /ping              déjà écrite : elle joue « l'autre utilisateur »
//   POST /import/bloquant   À ÉCRIRE : lire tout le fichier d'un coup (readFileSync)
//   POST /import/flux       À ÉCRIRE : lire le fichier ligne par ligne (createReadStream + readline)
//
// Lancement, depuis la racine du projet :
//   node tp/tp1-lecture/serveur-depart.js data/mesures-SN-CASA-2026-10-31_30j.ndjson
// Puis, dans un second terminal : node tp/tp1-lecture/sonde.js bloquant (ou flux)

import express from "express";
import { existsSync, readFileSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const FICHIER = process.argv[2] ?? "data/mesures-SN-CASA-2026-10-31.ndjson";

// Le chemin du fichier est relatif au dossier depuis lequel on lance la commande.
if (!existsSync(FICHIER)) {
  console.error(`Fichier introuvable : ${FICHIER}`);
  console.error("Lancez le serveur depuis la racine du projet. Pour générer le fichier de 30 jours :");
  console.error("  node scripts/generate-measures.js SN-CASA 2026-10-31 30");
  process.exit(1);
}

const app = express();

app.get("/ping", (req, res) => {
  res.json({ pong: true });
});

// À ÉCRIRE : POST /import/bloquant
// 1. Lire tout le fichier avec readFileSync (import depuis "node:fs").
// 2. Le découper en lignes, en ignorant les lignes vides.
// 3. Analyser chaque ligne avec JSON.parse et additionner les weight_kg.
// 4. Répondre { mesures, poids_moyen_kg, duree_ms } (duree_ms : mesurée avec performance.now()).

// Lecture bloquante : tout le fichier en mémoire, puis traitement d'un seul bloc.
app.post("/import/bloquant", (req, res) => {
  const debut = performance.now();

  const contenu = readFileSync(FICHIER, "utf8");
  const lignes = contenu.split("\n");

  let mesures = 0;
  let total = 0;
  for (const ligne of lignes) {
    if (ligne.trim() === "") continue;
    const mesure = JSON.parse(ligne);
    total += mesure.weight_kg;
    mesures++;
  }

  res.json({
    mesures,
    poids_moyen_kg: Math.round((total / mesures) * 100) / 100,
    duree_ms: Math.round(performance.now() - debut),
  });
});

// À ÉCRIRE : POST /import/flux
// Le même calcul, en lisant le fichier avec createReadStream (node:fs) et
// createInterface (node:readline), puis une boucle for await … of sur les lignes.

// Lecture en flux : une ligne à la fois, la boucle d'événements reprend la main entre deux morceaux.
app.post("/import/flux", async (req, res) => {
  const debut = performance.now();

  const lignes = createInterface({ input: createReadStream(FICHIER) });

  let mesures = 0;
  let total = 0;
  for await (const ligne of lignes) {
    if (ligne.trim() === "") continue;
    const mesure = JSON.parse(ligne);
    total += mesure.weight_kg;
    mesures++;
  }

  res.json({
    mesures,
    poids_moyen_kg: Math.round((total / mesures) * 100) / 100,
    duree_ms: Math.round(performance.now() - debut),
  });
});



app.listen(4000, () => {
  console.log(`Serveur du TP 1 sur http://localhost:4000, fichier : ${FICHIER}`);
});
