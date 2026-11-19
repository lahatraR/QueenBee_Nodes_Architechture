// Erreurs métier : les services les lèvent, l'intergiciel d'erreur choisit le code HTTP.
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// Pour le 409 du TP 3 (UUID d'inspection déjà utilisé).
export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}
