// import { ValidationError, ConflictError } from "../errors.js";

// const STATUTS_COLONIE = ["forte", "normale", "faible", "morte"];
// const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// const DATE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// export function createInspectionsService({ hivesService, inspectionsRepository }) {
//   return {
//     async list(hiveId) {
//       await hivesService.getById(hiveId);
//       return inspectionsRepository.findByHive(hiveId);
//     },

//     async add(hiveId, data = {}) {
//       const hive = await hivesService.getById(hiveId);
//       const { id, inspected_at, colony_status, queen_present, observations } = data;

//       if (typeof id !== "string" || !UUID.test(id)) {
//         throw new ValidationError("Le champ id est obligatoire et doit être un UUID.");
//       }
//       if (typeof inspected_at !== "string" || !DATE_ISO.test(inspected_at) || Number.isNaN(Date.parse(inspected_at))) {
//         throw new ValidationError(
//           "Le champ inspected_at est obligatoire et doit être une date ISO 8601 (ex. 2026-10-31T09:30:00Z)."
//         );
//       }
//       if (!STATUTS_COLONIE.includes(colony_status)) {
//         throw new ValidationError("Le champ colony_status doit valoir forte, normale, faible ou morte.");
//       }
//       if (queen_present !== undefined && typeof queen_present !== "boolean") {
//         throw new ValidationError("Le champ queen_present doit être un booléen.");
//       }
//       if (observations !== undefined && typeof observations !== "string") {
//         throw new ValidationError("Le champ observations doit être un texte.");
//       }
//       // L'UUID est choisi par l'application mobile : deux envois du même id sont un conflit.
//       if (await inspectionsRepository.findById(id)) {
//         throw new ConflictError(`Une inspection porte déjà l'identifiant ${id}.`);
//       }

//       return inspectionsRepository.add({
//         id,
//         hive_id: hive.id,
//         inspected_at,
//         colony_status,
//         queen_present: queen_present ?? null,
//         observations: observations ?? null,
//       });
//     },
//   };
// }

import { ValidationError, ConflictError } from "../errors.js";

// La forme de l'inspection (UUID, date, état de colonie…) est vérifiée par inspectionSchema.
export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async list(hiveId) {
      await hivesService.getById(hiveId);
      return inspectionsRepository.findByHive(hiveId);
    },

    async add(hiveId, data) {
      const hive = await hivesService.getById(hiveId);

      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche ${hive.id}.`
        );
      }
      // L'UUID est choisi par l'application mobile : deux envois du même id sont un conflit
      // (le TP 8 rendra ce rejeu idempotent).
      if (await inspectionsRepository.findById(data.id)) {
        throw new ConflictError(`Une inspection porte déjà l'identifiant ${data.id}.`);
      }

      return inspectionsRepository.add({
        id: data.id,
        hive_id: hive.id,
        inspected_at: data.inspected_at,
        colony_status: data.colony_status,
        queen_present: data.queen_present ?? null,
        observations: data.observations ?? null,
      });
    },
  };
}
