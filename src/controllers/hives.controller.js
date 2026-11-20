// // Convertit un paramètre de requête : absent → undefined, sinon un entier écrit en chiffres,
// // ou NaN (que le service refusera) pour "abc", "", "-1", "1.5"…
// function versEntier(valeur) {
//   if (valeur === undefined) return undefined;
//   return typeof valeur === "string" && /^\d+$/.test(valeur) ? Number(valeur) : NaN;
// }

// export function createHivesController({ hivesService, measuresService, inspectionsService }) {
//   return {
//     async list(req, res) {
//       res.status(200).json(await hivesService.list({ site_id: req.query.site_id }));
//     },

//     async getById(req, res) {
//       res.status(200).json(await hivesService.getById(req.params.id));
//     },

//     async listMeasures(req, res) {
//       const page = await measuresService.list(req.params.id, {
//         limit: versEntier(req.query.limit),
//         offset: versEntier(req.query.offset),
//       });
//       res.status(200).json(page);
//     },

//     async addMeasure(req, res) {
//       res.status(201).json(await measuresService.add(req.params.id, req.body ?? {}));
//     },

//     async listInspections(req, res) {
//       res.status(200).json({ items: await inspectionsService.list(req.params.id) });
//     },

//     async addInspection(req, res) {
//       res.status(201).json(await inspectionsService.add(req.params.id, req.body ?? {}));
//     },
//   };
// }

// Le contrôleur lit req.validated (données vérifiées et converties par Joi),
// jamais req.body ni req.query. Pas de try/catch : Express 5 transmet les erreurs.
export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    async list(req, res) {
      res.status(200).json(await hivesService.list(req.validated));
    },

    async getById(req, res) {
      res.status(200).json(await hivesService.getById(req.params.id));
    },

    async listMeasures(req, res) {
      res.status(200).json(await measuresService.list(req.params.id, req.validated));
    },

    async addMeasure(req, res) {
      res.status(201).json(await measuresService.add(req.params.id, req.validated));
    },

    async listInspections(req, res) {
      res.status(200).json({ items: await inspectionsService.list(req.params.id) });
    },

    async addInspection(req, res) {
      res.status(201).json(await inspectionsService.add(req.params.id, req.validated));
    },
  };
}
