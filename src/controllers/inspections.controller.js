export function createInspectionsController({ inspectionsService }) {
  return {
    // Toujours 200 si le lot est bien formé : le détail est dans la réponse.
    async sync(req, res) {
      res.json(await inspectionsService.sync(req.user, req.validated.inspections));
    },
  };
}
