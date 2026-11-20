// import express from "express";
// import { requestLogger } from "./middlewares/requestLogger.js";
// import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
// import { hivesRouter } from "./routes/hives.router.js";

// export const app = express();

// app.use(requestLogger); // en premier : les JSON mal formés sont journalisés aussi
// app.use(express.json()); // avant les routes, sinon req.body vaut undefined

// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "ok" });
// });

// app.use("/api/hives", hivesRouter);

// // À la fin, après toutes les routes, et dans cet ordre.
// app.use(notFoundHandler);
// app.use(errorHandler);

import express from "express";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";
import { createHivesController } from "./controllers/hives.controller.js";
import { createHivesRouter } from "./routes/hives/hives.router.js";

// Crée l'application à partir des repositories qu'on lui passe (mémoire aujourd'hui, PostgreSQL demain).
export function createApp({ hivesRepository, measuresRepository, inspectionsRepository }) {
  const hivesService = createHivesService({ hivesRepository });
  const measuresService = createMeasuresService({ hivesService, measuresRepository });
  const inspectionsService = createInspectionsService({ hivesService, inspectionsRepository });

  const hivesController = createHivesController({ hivesService, measuresService, inspectionsService });

  const app = express();

  app.use(requestLogger); // en premier : les JSON mal formés sont journalisés aussi
  // app.use(express.json()); // avant les routes
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/hives", createHivesRouter(hivesController));

  // À la fin, après toutes les routes, et dans cet ordre.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
