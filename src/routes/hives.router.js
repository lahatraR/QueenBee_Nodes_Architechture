import { Router } from "express";
import { hives, measures } from "../data/hives.js";

export const hivesRouter = Router();

// Les routes s'ajoutent ici. Les chemins sont RELATIFS à /api/hives :
// on écrit "/" et "/:id", jamais "/api/hives/:id" (sinon double préfixe et 404).

// GET /api/hives et GET /api/hives?site_id=SN-CASA
hivesRouter.get("/", (req, res) => {
  const { site_id } = req.query; // un filtre se lit dans req.query, pas dans le chemin

  // Un ?site_id= vide est une chaîne vide, pas undefined : on le traite comme « pas de filtre ».
  const resultat = site_id ? hives.filter((h) => h.site_id === site_id) : hives;

  res.status(200).json(resultat);
});

// GET /api/hives/:id
hivesRouter.get("/:id", (req, res) => {
  const hive = hives.find((h) => h.id === req.params.id); // find : un seul élément

  if (!hive) {
    return res.status(404).json({ error: `Aucune ruche ne porte l'identifiant ${req.params.id}.` });
  }

  res.status(200).json(hive);
});
