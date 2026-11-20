// // Lit la configuration dans l'environnement. Une valeur invalide arrête le démarrage.
// const ENVIRONNEMENTS = ["development", "test", "production"];

// export function loadConfig(env = process.env) {
//   const port = Number(env.PORT ?? 3000);
//   if (!Number.isInteger(port) || port < 1 || port > 65535) {
//     throw new Error(`PORT invalide (« ${env.PORT} ») : un entier entre 1 et 65535 est attendu.`);
//   }

//   const nodeEnv = env.NODE_ENV ?? "development";
//   if (!ENVIRONNEMENTS.includes(nodeEnv)) {
//     throw new Error(
//       `NODE_ENV invalide (« ${env.NODE_ENV} ») : valeurs possibles ${ENVIRONNEMENTS.join(", ")}.`
//     );
//   }

//   return { port, nodeEnv };
// }

// Lit la configuration dans l'environnement. Une valeur invalide arrête le démarrage.
// const ENVIRONNEMENTS = ["development", "test", "production"];
// const STOCKAGES = ["postgres", "memory"];

// function lireEntier(nom, valeur, defaut, min, max) {
//   const n = Number(valeur ?? defaut);
//   if (!Number.isInteger(n) || n < min || n > max) {
//     throw new Error(`${nom} invalide (« ${valeur} ») : un entier entre ${min} et ${max} est attendu.`);
//   }
//   return n;
// }

// export function loadConfig(env = process.env) {
//   const port = lireEntier("PORT", env.PORT, 3000, 1, 65535);

//   const nodeEnv = env.NODE_ENV ?? "development";
//   if (!ENVIRONNEMENTS.includes(nodeEnv)) {
//     throw new Error(`NODE_ENV invalide (« ${nodeEnv} ») : valeurs possibles ${ENVIRONNEMENTS.join(", ")}.`);
//   }

//   const storage = env.STORAGE ?? "postgres";
//   if (!STOCKAGES.includes(storage)) {
//     throw new Error(`STORAGE invalide (« ${storage} ») : valeurs possibles ${STOCKAGES.join(", ")}.`);
//   }

//   // Aucune valeur par défaut pour un mot de passe.
//   if (storage === "postgres" && !env.DB_PASSWORD) {
//     throw new Error("DB_PASSWORD est obligatoire quand STORAGE vaut postgres (vérifiez le .env).");
//   }

//   return {
//     port,
//     nodeEnv,
//     storage,
//     db: {
//       host: env.DB_HOST ?? "localhost",
//       port: lireEntier("DB_PORT", env.DB_PORT, 5432, 1, 65535),
//       user: env.DB_USER ?? "queenbee",
//       password: env.DB_PASSWORD,
//       database: env.DB_NAME ?? "queenbee",
//       poolMax: lireEntier("DB_POOL_MAX", env.DB_POOL_MAX, 10, 1, 100),
//     },
//   };
// }

// // La configuration est lue une seule fois, au premier import.
// function chargerOuArreter() {
//   try {
//     return loadConfig();
//   } catch (err) {
//     console.error(`Configuration invalide : ${err.message}`);
//     process.exit(1);
//   }
// }

// export const config = chargerOuArreter();

// Lit la configuration dans l'environnement. Une valeur invalide arrête le démarrage.
const ENVIRONNEMENTS = ["development", "test", "production"];

function lireEntier(nom, valeur, defaut, min, max) {
  const n = Number(valeur ?? defaut);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${nom} invalide (« ${valeur} ») : un entier entre ${min} et ${max} est attendu.`);
  }
  return n;
}

function obligatoire(env, nom) {
  if (!env[nom]) {
    throw new Error(`${nom} est obligatoire (vérifiez le .env).`);
  }
  return env[nom];
}

export function loadConfig(env = process.env) {
  const port = lireEntier("PORT", env.PORT, 3000, 1, 65535);

  const nodeEnv = env.NODE_ENV ?? "development";
  if (!ENVIRONNEMENTS.includes(nodeEnv)) {
    throw new Error(`NODE_ENV invalide (« ${nodeEnv} ») : valeurs possibles ${ENVIRONNEMENTS.join(", ")}.`);
  }

  const accessSecret = obligatoire(env, "JWT_ACCESS_SECRET");
  const refreshSecret = obligatoire(env, "JWT_REFRESH_SECRET");
  if (accessSecret === refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents.");
  }

  return {
    port,
    nodeEnv,
    db: {
      host: env.DB_HOST ?? "localhost",
      port: lireEntier("DB_PORT", env.DB_PORT, 5432, 1, 65535),
      user: env.DB_USER ?? "queenbee",
      password: obligatoire(env, "DB_PASSWORD"), // aucune valeur par défaut pour un mot de passe
      database: env.DB_NAME ?? "queenbee",
      poolMax: lireEntier("DB_POOL_MAX", env.DB_POOL_MAX, 10, 1, 100),
    },
    auth: {
      accessSecret,
      refreshSecret,
      accessTtl: env.JWT_ACCESS_TTL ?? "15m",
      refreshTtl: env.JWT_REFRESH_TTL ?? "7d",
      maxFailedLogins: 5,
      lockMinutes: 15,
    },
  };
}

// La configuration est lue une seule fois, au premier import.
function chargerOuArreter() {
  try {
    return loadConfig();
  } catch (err) {
    console.error(`Configuration invalide : ${err.message}`);
    process.exit(1);
  }
}

export const config = chargerOuArreter();
