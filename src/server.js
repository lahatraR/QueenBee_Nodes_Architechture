import { app } from "./app.js"; // en ESM, l'extension .js est obligatoire

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`API QueenBee sur http://localhost:${PORT}`);
});
