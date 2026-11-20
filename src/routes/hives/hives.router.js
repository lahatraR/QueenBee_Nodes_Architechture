// import { Router } from "express";

// // Quelle URL, quel verbe, quelle action du contrôleur. Aucune logique ici.
// // Les chemins sont relatifs à /api/hives.
// export function createHivesRouter(controller) {
//   const router = Router();

//   router.get("/", controller.list);
//   router.get("/:id", controller.getById);
//   router.get("/:id/measures", controller.listMeasures);
//   router.post("/:id/measures", controller.addMeasure);
//   router.get("/:id/inspections", controller.listInspections);
//   router.post("/:id/inspections", controller.addInspection);

//   return router;
// }

// import { Router } from "express";
// import { validate } from "../../middlewares/validate.js";
// import {
//   hivesQuerySchema,
//   paginationSchema,
//   measureSchema,
//   inspectionSchema,
// } from "../../validators/schemas.js";

// // URL, verbe, intergiciels, action du contrôleur. Aucune logique ici.
// export function createHivesRouter(controller) {
//   const router = Router();

//   router.get("/", validate(hivesQuerySchema, "query"), controller.list);
//   router.get("/:id", controller.getById);
//   router.get("/:id/measures", validate(paginationSchema, "query"), controller.listMeasures);
//   router.post("/:id/measures", validate(measureSchema), controller.addMeasure);
//   router.get("/:id/inspections", controller.listInspections);
//   router.post("/:id/inspections", validate(inspectionSchema), controller.addInspection);

//   return router;
// }

import { Router } from "express";
import { requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  hivesQuerySchema,
  paginationSchema,
  measureSchema,
  inspectionSchema,
} from "../../validators/schemas.js";

// Ordre : qui êtes-vous (401) → le bon rôle (403) → les bonnes données (400) → le traitement.
export function createHivesRouter({ controller, requireAuth }) {
  const router = Router();
  router.use(requireAuth);

  router.get("/", validate(hivesQuerySchema, "query"), controller.list);
  router.get("/:id", controller.getById);
  router.get("/:id/measures", validate(paginationSchema, "query"), controller.listMeasures);
  router.post("/:id/measures", requireRole("admin"), validate(measureSchema), controller.addMeasure);
  router.get("/:id/inspections", controller.listInspections);
  router.post(
    "/:id/inspections",
    requireRole("apiculteur", "coordinateur"),
    validate(inspectionSchema),
    controller.addInspection,
  );

  return router;
}
