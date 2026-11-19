import { Router } from "express";

// Quelle URL, quel verbe, quelle action du contrôleur. Aucune logique ici.
// Les chemins sont relatifs à /api/hives.
export function createHivesRouter(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.get("/:id/measures", controller.listMeasures);
  router.post("/:id/measures", controller.addMeasure);
  router.get("/:id/inspections", controller.listInspections);
  router.post("/:id/inspections", controller.addInspection);

  return router;
}
