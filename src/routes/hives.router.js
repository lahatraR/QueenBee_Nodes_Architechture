import { Router } from "express";
import { hives, measures } from "../data/hives.js";

export const hivesRouter = Router();

// Les routes s'ajoutent ici. Les chemins sont RELATIFS à /api/hives :
// on écrit "/" et "/:id", jamais "/api/hives/:id" (sinon double préfixe et 404).
