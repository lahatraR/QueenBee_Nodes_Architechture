import express from "express";
import morgan from "morgan";
import { requestLogger } from "./middlewares/requestLogger.js";
import { hivesRouter } from "./routes/hives.router.js";

export const app = express();

// app.use(express.json()); // AVANT les routes, sinon req.body vaut undefined
// app.use(requestLogger);
// // app.use(morgan("dev"));

// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "ok" });
// });

// app.use("/api/hives", hivesRouter);

app.use(requestLogger); // en premier : les JSON mal formés sont journalisés aussi
app.use(express.json()); // avant les routes, sinon req.body vaut undefined

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/hives", hivesRouter);

// À la fin, après toutes les routes, et dans cet ordre.
app.use(notFoundHandler);
app.use(errorHandler);