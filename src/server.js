// import { app } from "./app.js"; // en ESM, l'extension .js est obligatoire

// const PORT = 3000;

// app.listen(PORT, () => {
//   console.log(`API QueenBee sur http://localhost:${PORT}`);
// });

import { loadConfig } from "./config.js";
import { createApp } from "./app.js";
import { createMemoryRepositories } from "./repositories/memory/index.js";

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`Configuration invalide : ${err.message}`);
  process.exit(1);
}

const app = createApp(createMemoryRepositories());

app.listen(config.port, () => {
  console.log(`API QueenBee sur http://localhost:${config.port} (${config.nodeEnv})`);
});
