import express from "express";
import { requestLogger } from "./middlewares/requestLogger.js";
import { hivesRouter } from "./routes/hives.router.js";

export const app = express();

app.use(express.json()); // AVANT les routes, sinon req.body vaut undefined
app.use(requestLogger);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/hives", hivesRouter);
