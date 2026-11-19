import express from "express";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { hivesRouter } from "./routes/hives.router.js";

export const app = express();

app.use(requestLogger); // en premier : les JSON mal formés sont journalisés aussi
app.use(express.json()); // avant les routes, sinon req.body vaut undefined

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/hives", hivesRouter);

// À la fin, après toutes les routes, et dans cet ordre.
app.use(notFoundHandler);
app.use(errorHandler);
