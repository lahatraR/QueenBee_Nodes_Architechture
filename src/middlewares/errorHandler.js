// import { sendProblem } from "../utils/problem.js";

// // Route inconnue : un 404 au format RFC 9457, au lieu de la page HTML d'Express.
// export function notFoundHandler(req, res) {
//   sendProblem(res, 404, `Aucune route ne correspond à ${req.method} ${req.originalUrl}.`);
// }

// // Filet de sécurité : toute erreur non traitée arrive ici. Les quatre paramètres sont
// // obligatoires : c'est à eux qu'Express reconnaît un intergiciel d'erreur.
// export function errorHandler(err, req, res, next) {
//   if (err.type === "entity.parse.failed") {
//     return sendProblem(res, 400, "Le corps de la requête n'est pas un JSON valide.");
//   }
//   console.error(err); // la pile va dans le journal du serveur, jamais dans la réponse
//   sendProblem(res, 500, "Une erreur interne est survenue.");
// }

// import { sendProblem } from "../utils/problem.js";
// import { NotFoundError, ValidationError, ConflictError } from "../errors.js";

// // Route inconnue : un 404 au format RFC 9457, au lieu de la page HTML d'Express.
// export function notFoundHandler(req, res) {
//   sendProblem(res, 404, `Aucune route ne correspond à ${req.method} ${req.originalUrl}.`);
// }

// // Traduit les erreurs métier en codes HTTP. Les quatre paramètres sont obligatoires.
// export function errorHandler(err, req, res, next) {
//   if (err instanceof ValidationError) return sendProblem(res, 400, err.message);
//   if (err instanceof NotFoundError) return sendProblem(res, 404, err.message);
//   if (err instanceof ConflictError) return sendProblem(res, 409, err.message);

//   if (err.type === "entity.parse.failed") {
//     return sendProblem(res, 400, "Le corps de la requête n'est pas un JSON valide.");
//   }

//   console.error(err); // la pile va dans le journal du serveur, jamais dans la réponse
//   sendProblem(res, 500, "Une erreur interne est survenue.");
// }

import { sendProblem } from "../utils/problem.js";
import { AppError } from "../errors.js";

// Route inconnue : un 404 au format RFC 9457, au lieu de la page HTML d'Express.
export function notFoundHandler(req, res) {
  sendProblem(res, 404, `Aucune route ne correspond à ${req.method} ${req.originalUrl}.`);
}

// Codes PostgreSQL traduits en 400 : clé étrangère (23503), contrainte CHECK (23514),
// valeur au mauvais format (22P02).
const ERREURS_PG_400 = ["23503", "23514", "22P02"];

// Toutes les erreurs arrivent ici, dans cet ordre. Quatre paramètres obligatoires.
export function errorHandler(err, req, res, next) {
  // 1. Nos erreurs métier : elles portent leur code et leur message.
  if (err instanceof AppError) {
    return sendProblem(res, err.status, err.message);
  }

  // 2. Erreurs de express.json()
  if (err.type === "entity.parse.failed") {
    return sendProblem(res, 400, "Le corps de la requête n'est pas un JSON valide.");
  }
  if (err.type === "entity.too.large") {
    return sendProblem(res, 413, "Le corps de la requête dépasse la taille maximale de 1 Mo.");
  }

  // 3. Erreurs PostgreSQL : jamais leur message (il cite tables et contraintes).
  if (err.code === "23505") {
    return sendProblem(res, 409, "Cette ressource existe déjà.");
  }
  if (ERREURS_PG_400.includes(err.code)) {
    return sendProblem(res, 400, "Les données envoyées ne respectent pas les règles de la base.");
  }

  // 4. Tout le reste : la pile va dans le journal du serveur, jamais dans la réponse.
  console.error(err);
  sendProblem(res, 500, "Une erreur interne est survenue.");
}
