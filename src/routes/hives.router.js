import { Router } from "express";
import { hives, measures } from "../data/hives.js";

export const hivesRouter = Router();
import { Router } from "express";
import { hives, measures, inspections } from "../data/hives.js";
import { sendProblem } from "../utils/problem.js";

// Les chemins sont RELATIFS à /api/hives : on écrit "/" et "/:id", jamais "/api/hives/:id".

const STATUTS_COLONIE = ["forte", "normale", "faible", "morte"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// Cherche la ruche du chemin ; si elle n'existe pas, répond 404 et renvoie undefined.
function trouverRuche(req, res) {
  const hive = hives.find((h) => h.id === req.params.id);
  if (!hive) {
    sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }
  return hive;
}

// Lit un paramètre entier de req.query. Renvoie la valeur par défaut s'il est absent,
// null s'il est invalide (vide, pas un entier, ou hors bornes).
function lireEntier(valeur, defaut, min, max) {
  if (valeur === undefined) return defaut;
  if (typeof valeur !== "string" || !/^\d+$/.test(valeur)) return null;
  const n = Number(valeur);
  if (n < min || n > max) return null;
  return n;
}

// ---------- Ruches ----------

// GET /api/hives et GET /api/hives?site_id=SN-CASA
hivesRouter.get("/", (req, res) => {
  const { site_id } = req.query;
  // Un ?site_id= vide est une chaîne vide, pas undefined : on le traite comme « pas de filtre ».
  const resultat = site_id ? hives.filter((h) => h.site_id === site_id) : hives;
  res.status(200).json(resultat);
});

// GET /api/hives/:id
hivesRouter.get("/:id", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;
  res.status(200).json(hive);
});

// ---------- Mesures ----------

// GET /api/hives/:id/measures?limit=50&offset=0
hivesRouter.get("/:id/measures", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;

  const limit = lireEntier(req.query.limit, 50, 1, 500);
  if (limit === null) {
    return sendProblem(res, 400, "Le paramètre limit doit être un entier compris entre 1 et 500.");
  }

  const offset = lireEntier(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  if (offset === null) {
    return sendProblem(res, 400, "Le paramètre offset doit être un entier positif ou nul.");
  }

  // De la plus récente à la plus ancienne. On trie une copie : le tableau d'origine ne bouge pas.
  const items = measures
    .filter((m) => m.hive_id === hive.id)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(offset, offset + limit);

  res.status(200).json({ items, limit, offset });
});

// POST /api/hives/:id/measures
hivesRouter.post("/:id/measures", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;

  const body = req.body ?? {};

  // Seuls timestamp et weight_kg sont obligatoires.
  if (body.timestamp === undefined) {
    return sendProblem(res, 400, "Le champ timestamp est obligatoire.");
  }
  if (body.weight_kg === undefined) {
    return sendProblem(res, 400, "Le champ weight_kg est obligatoire.");
  }
  // Si la trame contient un hive_id, il doit être celui du chemin.
  if (body.hive_id !== undefined && body.hive_id !== hive.id) {
    return sendProblem(res, 400, "Le hive_id du corps ne correspond pas à celui du chemin.");
  }

  // On garde le timestamp de la trame (l'instant de la prise de mesure par le capteur).
  const mesure = { ...body, hive_id: hive.id, site_id: hive.site_id };
  measures.push(mesure);

  res.status(201).json(mesure);
});

// ---------- Inspections ----------

// GET /api/hives/:id/inspections
hivesRouter.get("/:id/inspections", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;

  const items = inspections
    .filter((i) => i.hive_id === hive.id)
    .sort((a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at));

  res.status(200).json({ items });
});

// POST /api/hives/:id/inspections
hivesRouter.post("/:id/inspections", (req, res) => {
  const hive = trouverRuche(req, res);
  if (!hive) return;

  const { id, inspected_at, colony_status, queen_present, observations } = req.body ?? {};

  if (typeof id !== "string" || !UUID.test(id)) {
    return sendProblem(res, 400, "Le champ id est obligatoire et doit être un UUID.");
  }
  if (typeof inspected_at !== "string" || !DATE_ISO.test(inspected_at) || Number.isNaN(Date.parse(inspected_at))) {
    return sendProblem(res, 400, "Le champ inspected_at est obligatoire et doit être une date ISO 8601 (ex. 2026-10-31T09:30:00Z).");
  }
  if (!STATUTS_COLONIE.includes(colony_status)) {
    return sendProblem(res, 400, "Le champ colony_status doit valoir forte, normale, faible ou morte.");
  }
  if (queen_present !== undefined && typeof queen_present !== "boolean") {
    return sendProblem(res, 400, "Le champ queen_present doit être un booléen.");
  }
  if (observations !== undefined && typeof observations !== "string") {
    return sendProblem(res, 400, "Le champ observations doit être un texte.");
  }
  // L'UUID est choisi par l'application mobile : deux envois du même id sont un conflit.
  if (inspections.some((i) => i.id === id)) {
    return sendProblem(res, 409, `Une inspection porte déjà l'identifiant ${id}.`);
  }

  const inspection = {
    id,
    hive_id: hive.id,
    inspected_at,
    colony_status,
    queen_present: queen_present ?? null,
    observations: observations ?? null,
  };
  inspections.push(inspection);

  res.status(201).json(inspection);
});


// // Les routes s'ajoutent ici. Les chemins sont RELATIFS à /api/hives :
// // on écrit "/" et "/:id", jamais "/api/hives/:id" (sinon double préfixe et 404).

// // GET /api/hives et GET /api/hives?site_id=SN-CASA
// hivesRouter.get("/", (req, res) => {
//   const { site_id } = req.query; // un filtre se lit dans req.query, pas dans le chemin

//   // Un ?site_id= vide est une chaîne vide, pas undefined : on le traite comme « pas de filtre ».
//   const resultat = site_id ? hives.filter((h) => h.site_id === site_id) : hives;

//   res.status(200).json(resultat);
// });

// // GET /api/hives/:id
// hivesRouter.get("/:id", (req, res) => {
//   const hive = hives.find((h) => h.id === req.params.id); // find : un seul élément

//   if (!hive) {
//     return res.status(404).json({ error: `Aucune ruche ne porte l'identifiant ${req.params.id}.` });
//   }

//   res.status(200).json(hive);
// });

// // POST /api/hives/:id/measures
// hivesRouter.post("/:id/measures", (req, res) => {
//   const hive = hives.find((h) => h.id === req.params.id);
//   if (!hive) {
//     return res.status(404).json({ error: `Aucune ruche ne porte l'identifiant ${req.params.id}.` });
//   }

//   const body = req.body ?? {};

//   // Seuls timestamp et weight_kg sont obligatoires.
//   if (body.timestamp === undefined) {
//     return res.status(400).json({ error: "Le champ timestamp est obligatoire." });
//   }
//   if (body.weight_kg === undefined) {
//     return res.status(400).json({ error: "Le champ weight_kg est obligatoire." });
//   }

//   // Si la trame contient un hive_id, il doit être celui du chemin.
//   if (body.hive_id !== undefined && body.hive_id !== hive.id) {
//     return res.status(400).json({ error: "Le hive_id du corps ne correspond pas à celui du chemin." });
//   }

//   // On garde le timestamp de la trame (l'instant de la prise de mesure par le capteur).
//   const mesure = { ...body, hive_id: hive.id, site_id: hive.site_id };
//   measures.push(mesure);

//   res.status(201).json(mesure); // 201 Created, pas 200
// });
