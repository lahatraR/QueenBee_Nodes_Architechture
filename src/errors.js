// // Erreurs métier : les services les lèvent, l'intergiciel d'erreur choisit le code HTTP.
// export class NotFoundError extends Error {
//   constructor(message) {
//     super(message);
//     this.name = "NotFoundError";
//   }
// }

// export class ValidationError extends Error {
//   constructor(message) {
//     super(message);
//     this.name = "ValidationError";
//   }
// }

// // Pour le 409 du TP 3 (UUID d'inspection déjà utilisé).
// export class ConflictError extends Error {
//   constructor(message) {
//     super(message);
//     this.name = "ConflictError";
//   }
// }

// Une classe mère porte le code HTTP ; chaque sous-classe nomme un cas.
export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name; // « NotFoundError », « ValidationError »…
    this.status = status;
  }
}

export class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}

export class NotFoundError extends AppError {
  constructor(message) { super(message, 404); }
}

export class ConflictError extends AppError {
  constructor(message) { super(message, 409); }
}
