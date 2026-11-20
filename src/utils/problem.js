// Erreurs au format RFC 9457 (application/problem+json).
// Avec type "about:blank", title est l'intitulé du code : le même pour toutes les erreurs de ce code.
const TITRES = {
  400: "Requête invalide",
  404: "Ressource introuvable",
  409: "Conflit",
  413: "Contenu trop volumineux",
  500: "Erreur interne",
};


export function sendProblem(res, status, detail) {
  res
    .status(status)
    .type("application/problem+json")
    .json({
      type: "about:blank",
      title: TITRES[status] ?? "Erreur",
      status,
      detail,
    });
}
