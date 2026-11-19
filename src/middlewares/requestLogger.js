// Une ligne par requête : date, méthode, URL complète, code de statut, durée.
export function requestLogger(req, res, next) {
  const debut = performance.now();

  // "finish" se déclenche une fois la réponse envoyée : on connaît alors le code de statut.
  res.on("finish", () => {
    const duree = (performance.now() - debut).toFixed(1);
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duree} ms`
    );
  });

  next();
}
