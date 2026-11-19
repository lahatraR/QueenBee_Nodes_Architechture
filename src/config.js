// Lit la configuration dans l'environnement. Une valeur invalide arrête le démarrage.
const ENVIRONNEMENTS = ["development", "test", "production"];

export function loadConfig(env = process.env) {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT invalide (« ${env.PORT} ») : un entier entre 1 et 65535 est attendu.`);
  }

  const nodeEnv = env.NODE_ENV ?? "development";
  if (!ENVIRONNEMENTS.includes(nodeEnv)) {
    throw new Error(
      `NODE_ENV invalide (« ${env.NODE_ENV} ») : valeurs possibles ${ENVIRONNEMENTS.join(", ")}.`
    );
  }

  return { port, nodeEnv };
}
